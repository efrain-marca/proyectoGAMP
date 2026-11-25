import { coordenadas } from './seguimiento.mjs';
import { createHash } from 'node:crypto';
import { inserted, optional, withDb } from './db.mjs';
import { verifySession, hashPassword } from './auth.mjs';
import { allowed, addDays, id, input, insist, Issue, mail, money, operating, password, period, roles, states, today, transitions } from './rules.mjs';
import { projectAccess } from './projects.mjs';

const maxFile=10*1024*1024;
const bodyDate=(f,key,label,min)=>f.date(key,label,{min,max:today()});
const note=(f,key='motivo',required=true)=>f.text(key,key==='motivo'?'el motivo':'la observación',{min:5,max:key==='motivo'?500:750,required});
const same=(a,b)=>String(a)===String(b);
export function fileType(data) {
  if (data.subarray(0,5).toString()==='%PDF-' && data.subarray(-1024).includes(Buffer.from('%%EOF'))) return 'application/pdf';
  if (data.length>20 && data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) && data.subarray(-12).equals(Buffer.from('0000000049454e44ae426082','hex'))) return 'image/png';
  if (data.length>4 && data.subarray(0,3).equals(Buffer.from('ffd8ff','hex')) && data.subarray(-2).equals(Buffer.from('ffd9','hex'))) return 'image/jpeg';
  return null;
}
export async function audit(q,projectId,entity,record,action,previous,next,reason,actor) {
  const json=value=>value==null?null:JSON.stringify(value);
  await q('INSERT INTO historial (proyecto,entidad,registro,accion,anterior,nuevo,motivo,autor) VALUES (?,?,?,?,?,?,?,?)',[projectId,entity,record,action,json(previous),json(next),reason||'',actor]);
}
async function proof(q,p,f,required=true) {
  const doc=f.id('documento','documento de respaldo',required);
  if (doc==null) return null;
  const [record]=await q('SELECT id FROM documentos WHERE id=? AND proyecto=? AND vigente=1',[doc,Number(p.id)]);
  insist(record,'El respaldo debe ser un documento vigente del mismo proyecto.');
  return doc;
}
export async function syncAlerts(q,projectId,state) {
  const date=today();
  const activities=await q('SELECT a.id,a.fin,(SELECT f.porcentaje FROM avances_fisicos f WHERE f.actividad=a.id AND f.vigente=1 ORDER BY f.corte DESC,f.id DESC LIMIT 1) porcentaje FROM actividades a WHERE a.proyecto=?',[projectId]);
  for (const activity of activities) {
    const task=Number(activity.id), type=activity.fin<date?'vencida':'proxima';
    const relevant=state!=='concluido' && activity.fin<=addDays(date,7) && Number(optional(activity.porcentaje)??0)<100;
    await q("UPDATE alertas SET estado='cerrada' WHERE actividad=? AND estado='abierta' AND (tipo<>? OR fin<>? OR ?=0)",[task,type,activity.fin,relevant]);
    if (relevant) await q("INSERT INTO alertas (actividad,tipo,fin) VALUES (?,?,?) ON DUPLICATE KEY UPDATE estado=IF(estado='cerrada','abierta',estado)",[task,type,activity.fin]);
  }
}
function projectFields(f, previous={}) {
  const codigo=f.text('codigo','el código',{min:3,max:30}).toUpperCase();
  insist(/^[A-Z0-9]+([-/][A-Z0-9]+)*$/.test(codigo),'El código admite letras, números, guiones y barras entre segmentos.');
  const lat = f.text('latitud','la latitud',{required:false});
  const lon = f.text('longitud','la longitud',{required:false});
  const [latitud,longitud] = f.has('latitud') || f.has('longitud')
    ? coordenadas(lat,lon)
    : [optional(previous.latitud) ?? null,optional(previous.longitud) ?? null];
  return {codigo,nombre:f.text('nombre','el nombre',{min:5,max:160}),ubicacion:f.text('ubicacion','la ubicación',{min:3,max:150}),
    unidad:f.text('unidad','la unidad',{min:3,max:120}),descripcion:f.text('descripcion','la descripción',{min:10,max:1600}),
    inicio:f.date('inicio','Inicio'),fin:f.date('fin','Fin'),latitud,longitud};
}
async function createProject(q,f,actor) {
  const data=projectFields(f);
  period(data.inicio,data.fin,{min:today()});
  await q('INSERT INTO proyectos (codigo,nombre,ubicacion,unidad,descripcion,inicio,fin,latitud,longitud,autor) VALUES (?,?,?,?,?,?,?,?,?,?)',[...Object.values(data),actor]);
  const projectId=await inserted(q);
  await q("INSERT INTO cambios_estado (proyecto,nuevo,motivo,autor) VALUES (?,'planificado','Registro inicial',?)",[projectId,actor]);
  await audit(q,projectId,'Proyecto',projectId,'Creación',null,{...data,estado:'planificado'},'',actor);
  return '/app/proyectos/'+projectId;
}
async function user(q,f,actor,encrypted) {
  const target=f.id('usuario','usuario',false);
  const info={nombre:f.text('nombre','el nombre',{min:3,max:120}),correo:mail(f.text('correo','el correo',{max:190})),
    rol:f.pick('rol',Object.keys(roles),'un rol'),activo:f.checked('activo')};
  if (!target) {
    insist(encrypted,'Define una contraseña para la nueva cuenta.');
    await q('INSERT INTO usuarios (nombre,correo,rol,activo,clave) VALUES (?,?,?,?,?)',[...Object.values(info),encrypted]);
    await audit(q,null,'Usuario',await inserted(q),'Creación',null,info,'',actor);
    return;
  }
  const [before]=await q('SELECT id,nombre,correo,rol,activo FROM usuarios WHERE id=? FOR UPDATE',[target]);
  insist(before,'No se encontró la cuenta.',404);
  insist(actor!==target || (info.rol==='admin' && info.activo),'Tu propia cuenta debe permanecer activa como administradora.');
  const changesRole=info.rol!==before.rol;
  if (changesRole || !info.activo) {
    const [pending]=await q('SELECT id FROM responsables WHERE usuario=? AND fin>=? LIMIT 1 FOR UPDATE',[target,today()]);
    insist(!pending,'Releva o finaliza las asignaciones actuales y futuras antes de desactivar la cuenta o cambiar su rol.',409);
  }
  await q('UPDATE usuarios SET nombre=?,correo=?,rol=?,activo=?,clave=COALESCE(?,clave) WHERE id=?',[...Object.values(info),encrypted,target]);
  if (encrypted || changesRole || !info.activo) await q('DELETE FROM sesiones WHERE usuario=?',[target]);
  await audit(q,null,'Usuario',target,encrypted?'Actualización y cambio de contraseña':'Actualización',before,info,'',actor);
}
async function editProject(q,p,f,actor) {
  const data=projectFields(f,p), reason=note(f);
  insist(same(p.revision,f.id('revision','revisión')),'La ficha fue actualizada. Recarga la página y revisa la versión vigente.',409);
  period(data.inicio,data.fin);
  if (data.inicio!==p.inicio) {
    insist(p.estado==='planificado','La fecha inicial solo se modifica en un proyecto planificado.');
    period(data.inicio,data.fin,{min:today()});
  }
  insist(data.fin<=p.fin,'Registra la ampliación en Cronograma con su documento de respaldo.');
  if (data.fin!==p.fin) insist(data.fin>=today(),'La nueva fecha final debe ser de hoy en adelante.');
  const projectId=Number(p.id);
  const [children]=await q('SELECT (SELECT COUNT(*) FROM actividades WHERE proyecto=? AND (inicio<? OR fin>?)) + (SELECT COUNT(*) FROM responsables WHERE proyecto=? AND (inicio<? OR fin>?)) fuera',[projectId,data.inicio,data.fin,projectId,data.inicio,data.fin]);
  insist(Number(children.fuera)===0,'Las nuevas fechas dejarían actividades o asignaciones fuera del proyecto.');
  const previous=Object.fromEntries(Object.keys(data).map(key=>[key,p[key]]));
  insist(Object.keys(data).some(key=>String(data[key]??'NULL')!==String(p[key])),'La ficha ya contiene esos datos.');
  await q('UPDATE proyectos SET codigo=?,nombre=?,ubicacion=?,unidad=?,descripcion=?,inicio=?,fin=?,latitud=?,longitud=?,revision=revision+1 WHERE id=?',[...Object.values(data),projectId]);
  await audit(q,projectId,'Proyecto',projectId,'Actualización',previous,data,reason,actor);
}
async function assign(q,p,f,actor) {
  const projectId=Number(p.id), previousId=f.id('anterior','relevo',false), finishOnly=f.checked('finalizar'), reason=note(f,'motivo',Boolean(previousId));
  const [previous]=previousId?await q('SELECT * FROM responsables WHERE id=? AND proyecto=? FOR UPDATE',[previousId,projectId]):[];
  if (previousId) {
    insist(previous && previous.fin>=today(),'La asignación ya venció o cambió.',409);
    insist(same(previous.fin,f.date('fin_actual','Fin vigente')),'Ya se modificó el periodo. Recarga el proyecto antes de continuar.',409);
  }
  if (finishOnly) {
    insist(previous,'Selecciona la asignación a finalizar.');
    await q('SELECT id FROM usuarios WHERE id=? FOR UPDATE',[Number(previous.usuario)]);
    const effective=f.date('inicio','Primera fecha libre',{min:today(),max:previous.fin});
    insist(effective>previous.inicio,'La primera fecha libre debe ser posterior al inicio.');
    await q('UPDATE responsables SET fin=? WHERE id=?',[addDays(effective,-1),previousId]);
    await audit(q,projectId,'Responsable',previousId,'Finalización',{fin:previous.fin},{fin:addDays(effective,-1)},reason,actor);
    return;
  }
  const userId=f.id('responsable','responsable');
  const start=f.date('inicio','Inicio'),end=f.date('fin','Fin');
  period(start,end,{min:[today(),p.inicio].sort().at(-1),max:p.fin});
  if (previous) {
    insist(!same(previous.usuario,userId),'El relevo requiere una persona distinta.');
    insist(start>previous.inicio && start<=addDays(previous.fin,1),'La fecha de relevo debe continuar el periodo de la asignación anterior.');
  }
  const ids=[...new Set([userId,...(previous?[Number(previous.usuario)]:[])])].sort((a,b)=>a-b);
  let candidate;
  for (const person of ids) {
    const [account]=await q('SELECT id,activo,rol FROM usuarios WHERE id=? FOR UPDATE',[person]);
    if (person===userId) candidate=account;
  }
  const role=f.has('funcion') ? f.pick('funcion',operating,'la función') : candidate?.rol;
  insist(!previous || role===previous.funcion,'El relevo requiere la misma función.');
  insist(candidate?.activo==='1' && operating.includes(role) && candidate.rol===role,'La persona debe tener una cuenta activa con el rol de la asignación.');
  const [collision]=await q("SELECT r.id,r.proyecto,r.inicio,r.fin FROM responsables r WHERE r.inicio<=? AND r.fin>=? AND r.id<>? AND ((r.proyecto=? AND r.funcion=?) OR (?='supervisor' AND r.usuario=?)) LIMIT 1 FOR UPDATE",[end,start,previousId||0,projectId,role,role,userId]);
  if (collision) {
    const [code]=await q('SELECT codigo FROM proyectos WHERE id=?',[Number(collision.proyecto)]);
    throw new Issue('La asignación se cruza con '+(code?.codigo||'otra asignación')+' ('+collision.inicio+' a '+collision.fin+'). Ajusta las fechas o selecciona otra persona.',409);
  }
  if (previous) await q('UPDATE responsables SET fin=? WHERE id=? AND fin>=?',[addDays(start,-1),previousId,start]);
  await q('INSERT INTO responsables (proyecto,usuario,funcion,inicio,fin,fin_original,motivo,autor) VALUES (?,?,?,?,?,?,?,?)',[projectId,userId,role,start,end,end,reason,actor]);
  await audit(q,projectId,'Responsable',await inserted(q),previous?'Relevo':'Asignación',previous||null,{usuario:userId,funcion:role,inicio:start,fin:end},reason,actor);
}
async function changeState(q,p,f,actor) {
  const next=f.pick('estado',Object.keys(states),'un estado');
  insist(transitions[p.estado].includes(next),'La situación actual del proyecto no permite ese cambio de estado.');
  const reason=note(f),doc=await proof(q,p,f),projectId=Number(p.id);
  if (next==='ejecucion') insist(p.inicio<=today(),'El proyecto todavía no llega a su fecha de inicio.');
  if (next==='concluido') {
    const tasks=await q('SELECT (SELECT f.porcentaje FROM avances_fisicos f WHERE f.actividad=a.id AND f.vigente=1 ORDER BY f.corte DESC,f.id DESC LIMIT 1) progreso FROM actividades a WHERE a.proyecto=?',[projectId]);
    const [open]=await q("SELECT id FROM incidencias WHERE proyecto=? AND estado<>'resuelta' LIMIT 1",[projectId]);
    insist(tasks.length && tasks.every(a=>Number(a.progreso)===100) && !open,'Para concluir, registra todas las actividades al 100 % y resuelve las incidencias pendientes.');
  }
  await q('UPDATE proyectos SET estado=?,revision=revision+1 WHERE id=?',[next,projectId]);
  await q('INSERT INTO cambios_estado (proyecto,anterior,nuevo,motivo,documento,autor) VALUES (?,?,?,?,?,?)',[projectId,p.estado,next,reason,doc,actor]);
  await audit(q,projectId,'Estado',await inserted(q),'Cambio',{estado:p.estado},{estado:next,documento:doc},reason,actor);
  await syncAlerts(q,projectId,next);
}
async function teammate(q,projectId,person,from,until) {
  const [record]=await q('SELECT r.id FROM responsables r JOIN usuarios u ON u.id=r.usuario WHERE r.proyecto=? AND r.usuario=? AND u.activo=1 AND r.inicio<=? AND r.fin>=? LIMIT 1',[projectId,person,from,until]);
  insist(record,'La persona debe estar habilitada y asignada al proyecto en esas fechas.');
}
async function schedule(q,p,f,actor,reprogram) {
  const projectId=Number(p.id),start=f.date('inicio','Inicio'),end=f.date('fin','Fin'),person=f.id('responsable','responsable');
  period(start,end,{min:p.inicio,max:p.fin});
  if (!reprogram) {
    insist(start>=today(),'El inicio de una actividad nueva debe ser de hoy en adelante.');
    await teammate(q,projectId,person,start,end);
    const name=f.text('nombre','el nombre de la actividad',{min:3,max:150});
    await q('INSERT INTO actividades (proyecto,nombre,responsable,inicio,fin,inicio_original,fin_original,autor) VALUES (?,?,?,?,?,?,?,?)',[projectId,name,person,start,end,start,end,actor]);
    await audit(q,projectId,'Actividad',await inserted(q),'Creación',null,{nombre:name,responsable:person,inicio:start,fin:end},'',actor);
  } else {
    const activityId=f.id('actividad','actividad');
    const [old]=await q('SELECT * FROM actividades WHERE id=? AND proyecto=? FOR UPDATE',[activityId,projectId]);
    insist(old,'La actividad no pertenece al proyecto.');
    insist(same(old.fin,f.date('fin_actual','Fin vigente')) && same(old.inicio,f.date('inicio_actual','Inicio vigente')) && same(old.responsable,f.id('responsable_actual','responsable vigente')),'El cronograma cambió. Recarga para ver la versión vigente.',409);
    const [hasProgress]=await q('SELECT id FROM avances_fisicos WHERE actividad=? AND vigente=1 LIMIT 1',[activityId]);
    insist(end>=today() && (start>=today() || (hasProgress && start===old.inicio)),'Las fechas nuevas deben ser de hoy en adelante. Una actividad con avance conserva su inicio.');
    insist(!hasProgress || start===old.inicio,'Una actividad con avance conserva su inicio.');
    await teammate(q,projectId,person,start<today()?today():start,end);
    insist(start!==old.inicio || end!==old.fin || !same(person,old.responsable),'Introduce un cambio en las fechas o en el responsable.');
    const reason=note(f),doc=await proof(q,p,f);
    await q('INSERT INTO reprogramaciones (actividad,inicio_previo,fin_previo,inicio,fin,motivo,documento,autor) VALUES (?,?,?,?,?,?,?,?)',[activityId,old.inicio,old.fin,start,end,reason,doc,actor]);
    const version=await inserted(q);
    await q('UPDATE actividades SET inicio=?,fin=?,responsable=? WHERE id=?',[start,end,person,activityId]);
    await audit(q,projectId,'Cronograma',version,'Reprogramación',{inicio:old.inicio,fin:old.fin,responsable:old.responsable},{actividad:activityId,inicio:start,fin:end,responsable:person,documento:doc},reason,actor);
  }
  await syncAlerts(q,projectId,p.estado);
}
async function document(q,p,f,actor,upload) {
  const projectId=Number(p.id),previous=f.id('anterior','versión anterior',false);
  const description=f.text('descripcion','la descripción',{min:5,max:500}), reason=note(f,'motivo',Boolean(previous));
  const date=bodyDate(f,'fecha','Fecha del documento');
  if (previous) {
    const [old]=await q('SELECT vigente FROM documentos WHERE id=? AND proyecto=? FOR UPDATE',[previous,projectId]);
    insist(old?.vigente==='1','Selecciona una versión vigente del mismo proyecto. Si el archivo ya cambió, recarga la página.',409);
  }
  const {name,data,type,sha}=upload;
  await q('INSERT INTO documentos (proyecto,nombre,descripcion,tipo,bytes,sha,anterior,motivo,autor,fecha) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [projectId,name,description,type,data.length,sha,previous,reason,actor,date]);
  const doc=await inserted(q);
  for (let offset=0,part=0;offset<data.length;offset+=131072,part++) {
    await q('INSERT INTO archivo_partes (documento,numero,datos) VALUES (?,?,?)',[doc,part,data.subarray(offset,offset+131072)]);
  }
  if (previous) await q('UPDATE documentos SET vigente=0 WHERE id=?',[previous]);
  await audit(q,projectId,'Documento',doc,previous?'Nueva versión':'Carga',previous?{documento:previous}:null,{nombre:name,tipo:type,sha256:sha,fecha:date},reason,actor);
}
async function budget(q,p,f,actor) {
  const projectId=Number(p.id),amount=f.decimal('monto','El presupuesto'),doc=await proof(q,p,f);
  const [before]=await q('SELECT * FROM presupuesto WHERE proyecto=? AND vigente=1 FOR UPDATE',[projectId]);
  const date=bodyDate(f,'fecha','Fecha de vigencia',before?.fecha),reason=note(f,'motivo',Boolean(before));
  insist(!before || amount!==before.monto,'El monto coincide con el presupuesto vigente.');
  insist((f.id('referencia','presupuesto vigente',false) || null)===(before?Number(before.id):null),'El presupuesto cambió. Recarga los datos antes de actualizarlo.',409);
  if (before) await q('UPDATE presupuesto SET vigente=0 WHERE id=?',[Number(before.id)]);
  await q('INSERT INTO presupuesto (proyecto,monto,previo,fecha,motivo,documento,autor) VALUES (?,?,?,?,?,?,?)',[projectId,amount,before?.monto||null,date,reason,doc,actor]);
  await audit(q,projectId,'Presupuesto',await inserted(q),before?'Modificación':'Registro',before?{monto:before.monto,fecha:before.fecha,documento:before.documento}:null,{monto:amount,fecha:date,documento:doc},reason,actor);
}
async function physical(q,p,f,actor) {
  const projectId=Number(p.id), activity=f.id('actividad','actividad'), replaces=f.id('rectifica','avance a rectificar',false);
  const [task]=await q('SELECT * FROM actividades WHERE id=? AND proyecto=? FOR UPDATE',[activity,projectId]);
  insist(task,'Selecciona una actividad del proyecto.');
  const cut=bodyDate(f,'corte','Fecha de corte',task.inicio);
  const pct=f.decimal('porcentaje','El avance físico',{digits:3,max:100}), observation=note(f,'observacion'), doc=await proof(q,p,f);
  const [previous]=await q('SELECT * FROM avances_fisicos WHERE actividad=? AND corte=? AND vigente=1 FOR UPDATE',[activity,cut]);
  insist(replaces?same(previous?.id,replaces):!previous,replaces?'El avance a rectificar debe ser la versión vigente de esa actividad y fecha.':'Ya existe un avance para esta actividad y fecha. Usa su opción de rectificación.',409);
  const reason=note(f,'motivo',Boolean(replaces));
  insist(p.estado!=='concluido' || (replaces && pct===previous.porcentaje),'En un proyecto concluido solo se admiten rectificaciones que conserven el porcentaje.');
  const [prior]=await q('SELECT porcentaje FROM avances_fisicos WHERE actividad=? AND corte<? AND vigente=1 ORDER BY corte DESC LIMIT 1',[activity,cut]);
  const [later]=await q('SELECT porcentaje FROM avances_fisicos WHERE actividad=? AND corte>? AND vigente=1 ORDER BY corte LIMIT 1',[activity,cut]);
  insist((!prior || Number(prior.porcentaje)<=Number(pct)) && (!later || Number(later.porcentaje)>=Number(pct)),'El porcentaje acumulado debe ser coherente con los cortes anterior y posterior.');
  if (previous) await q('UPDATE avances_fisicos SET vigente=0 WHERE id=?',[replaces]);
  await q('INSERT INTO avances_fisicos (actividad,corte,porcentaje,observacion,documento,reemplaza,motivo,autor) VALUES (?,?,?,?,?,?,?,?)',[activity,cut,pct,observation,doc,replaces,reason,actor]);
  await audit(q,projectId,'Avance físico',await inserted(q),replaces?'Rectificación':'Registro',previous||null,{actividad:activity,corte:cut,porcentaje:pct,observacion:observation,documento:doc},reason,actor);
  await syncAlerts(q,projectId,p.estado);
}
async function financial(q,p,f,actor) {
  const projectId=Number(p.id),replaces=f.id('rectifica','avance a rectificar',false);
  const month=f.text('periodo','el periodo',{min:7,max:7}),cut=bodyDate(f,'corte','Fecha de corte',p.inicio);
  insist(month===cut.slice(0,7),'El periodo debe coincidir con el mes de la fecha de corte.');
  const [previous]=await q('SELECT * FROM avances_financieros WHERE proyecto=? AND periodo=? AND vigente=1 FOR UPDATE',[projectId,month]);
  insist(replaces?same(previous?.id,replaces):!previous,replaces?'Selecciona el informe vigente del periodo para rectificar.':'Ya existe un informe para ese periodo. Usa la opción de rectificación.',409);
  if (previous) insist(previous.corte===cut,'La rectificación conserva la fecha de corte del informe original.');
  insist(p.estado!=='concluido' || replaces,'En un proyecto concluido se admiten rectificaciones de informes financieros existentes.');
  const amount=f.decimal('monto','El importe acumulado'),doc=await proof(q,p,f),observation=note(f,'observacion'),reason=note(f,'motivo',Boolean(replaces));
  const [reference]=await q('SELECT id,monto FROM presupuesto WHERE proyecto=? AND fecha<=? ORDER BY fecha DESC,id DESC LIMIT 1',[projectId,cut]);
  insist(reference,'Registra un presupuesto con vigencia anterior o igual a la fecha de corte.');
  const excess=Number(amount)>Number(reference.monto);
  insist(!excess || f.checked('confirmar_exceso'),'El importe supera el presupuesto en '+money(Math.round((Number(amount)-Number(reference.monto))*100)/100)+'. Confirma expresamente su registro para revisión.');
  const [prior]=await q('SELECT acumulado FROM avances_financieros WHERE proyecto=? AND periodo<? AND vigente=1 ORDER BY periodo DESC LIMIT 1',[projectId,month]);
  const [later]=await q('SELECT acumulado FROM avances_financieros WHERE proyecto=? AND periodo>? AND vigente=1 ORDER BY periodo LIMIT 1',[projectId,month]);
  insist((!prior || Number(prior.acumulado)<=Number(amount)) && (!later || Number(later.acumulado)>=Number(amount)),'El importe acumulado debe ser coherente con los periodos anterior y posterior.');
  if (previous) await q('UPDATE avances_financieros SET vigente=0 WHERE id=?',[replaces]);
  await q('INSERT INTO avances_financieros (proyecto,periodo,corte,acumulado,presupuesto,exceso,observacion,documento,reemplaza,motivo,autor) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [projectId,month,cut,amount,Number(reference.id),excess,observation,doc,replaces,reason,actor]);
  await audit(q,projectId,'Avance financiero',await inserted(q),replaces?'Rectificación':'Registro',previous||null,{periodo:month,corte:cut,acumulado:amount,presupuesto:reference.id,exceso:excess,observacion:observation,documento:doc},reason,actor);
}
async function incident(q,p,f,actor) {
  const projectId=Number(p.id), description=f.text('descripcion','la descripción',{min:10,max:750});
  const date=bodyDate(f,'fecha','Fecha de la incidencia',p.inicio),owner=f.id('responsable','responsable');
  await teammate(q,projectId,owner,today(),today());
  const [duplicate]=await q('SELECT id FROM incidencias WHERE proyecto=? AND descripcion=? AND fecha=?',[projectId,description,date]);
  insist(!duplicate,'Ya se registró una incidencia con esa fecha y descripción.',409);
  await q('INSERT INTO incidencias (proyecto,descripcion,fecha,responsable,autor) VALUES (?,?,?,?,?)',[projectId,description,date,owner,actor]);
  await audit(q,projectId,'Incidencia',await inserted(q),'Registro',null,{descripcion:description,fecha:date,responsable:owner,estado:'pendiente'},'',actor);
}
async function incidentAction(q,p,f,actor) {
  const projectId=Number(p.id), incidentId=f.id('incidencia','incidencia');
  const [record]=await q('SELECT * FROM incidencias WHERE id=? AND proyecto=? FOR UPDATE',[incidentId,projectId]);
  insist(record && record.estado!=='resuelta','Selecciona una incidencia abierta del proyecto.');
  const description=f.text('descripcion','la actuación',{min:10,max:750}),close=f.checked('cerrar');
  const [last]=await q('SELECT fecha FROM acciones_incidencia WHERE incidencia=? ORDER BY fecha DESC,id DESC LIMIT 1',[incidentId]);
  const date=bodyDate(f,'fecha','Fecha de atención',last?.fecha||record.fecha);
  insist(!close || record.estado==='atencion','Registra primero una acción de atención para poder cerrar la incidencia.');
  const [duplicate]=await q('SELECT id FROM acciones_incidencia WHERE incidencia=? AND descripcion=? AND fecha=?',[incidentId,description,date]);
  insist(!duplicate,'Ya se registró esa acción para la incidencia en esa fecha.',409);
  const doc=await proof(q,p,f,close),status=close?'resuelta':'atencion';
  await q('INSERT INTO acciones_incidencia (incidencia,descripcion,fecha,documento,cierre,autor) VALUES (?,?,?,?,?,?)',[incidentId,description,date,doc,close,actor]);
  const movement=await inserted(q);
  await q('UPDATE incidencias SET estado=? WHERE id=?',[status,incidentId]);
  await audit(q,projectId,'Incidencia',incidentId,close?'Resolución':'Atención',{estado:record.estado},{estado:status,actuacion:movement,descripcion:description,fecha:date,documento:doc},'',actor);
}
async function publication(q,p,f,actor,form,withdraw) {
  const projectId=Number(p.id);
  const [previous]=await q('SELECT id,ficha FROM versiones_publicas WHERE proyecto=? AND activa=1 FOR UPDATE',[projectId]);
  insist((f.id('publicacion','versión vigente',false)||null)===(previous?Number(previous.id):null),'La publicación cambió. Recarga para consultar la versión actual.',409);
  if (withdraw) {
    insist(previous,'El proyecto no tiene una versión pública vigente.');
    const reason=note(f);
    await q('UPDATE versiones_publicas SET activa=0,retirada=NOW(),retiro_autor=?,motivo=? WHERE id=?',[actor,reason,Number(previous.id)]);
    await audit(q,projectId,'Publicación',Number(previous.id),'Retiro',{activa:true},{activa:false},reason,actor);
    return;
  }
  insist(f.checked('aprobado'),'Confirma la revisión de los campos y documentos elegidos.');
  insist(same(p.revision,f.id('revision','revisión de ficha')),'La ficha interna cambió. Revisa la versión vigente antes de publicar.',409);
  const ficha={codigo:p.codigo,nombre:p.nombre,ubicacion:p.ubicacion,unidad:p.unidad,estado:p.estado,inicio:p.inicio,fin:p.fin,
    resumen:f.text('resumen','el resumen público',{min:10,max:800})};
  const chosen=[...new Set(form.getAll('archivos').map(value=>id(value,'archivo público')))].sort((a,b)=>a-b);
  insist(chosen.length<=30,'Selecciona hasta 30 documentos por publicación.');
  for (const doc of chosen) {
    const [record]=await q('SELECT id FROM documentos WHERE id=? AND proyecto=? AND vigente=1',[doc,projectId]);
    insist(record,'Solo se pueden aprobar documentos vigentes del proyecto.');
  }
  if (previous) {
    const oldFiles=await q('SELECT documento FROM archivos_publicos WHERE version=? ORDER BY documento',[Number(previous.id)]);
    insist(JSON.stringify(JSON.parse(previous.ficha))!==JSON.stringify(ficha) || JSON.stringify(oldFiles.map(r=>Number(r.documento)))!==JSON.stringify(chosen),'La versión pública vigente ya contiene los mismos datos y archivos.');
    await q("UPDATE versiones_publicas SET activa=0,retirada=NOW(),retiro_autor=?,motivo='Nueva versión aprobada' WHERE id=?",[actor,Number(previous.id)]);
  }
  await q('INSERT INTO versiones_publicas (proyecto,ficha,autor) VALUES (?,?,?)',[projectId,JSON.stringify(ficha),actor]);
  const version=await inserted(q);
  for (const doc of chosen) await q('INSERT INTO archivos_publicos (version,documento) VALUES (?,?)',[version,doc]);
  await audit(q,projectId,'Publicación',version,'Aprobación',previous?{version:previous.id}:null,{ficha,documentos:chosen},'',actor);
}
async function alerts(q,p,f,actor) {
  const projectId=Number(p.id), target=f.id('alerta','alerta',false);
  await syncAlerts(q,projectId,p.estado);
  if (!target) return;
  const [current]=await q('SELECT t.id,t.estado FROM alertas t JOIN actividades a ON a.id=t.actividad WHERE t.id=? AND a.proyecto=? FOR UPDATE',[target,projectId]);
  insist(current?.estado==='abierta','La alerta ya fue atendida o dejó de estar abierta.',409);
  const comment=f.text('observacion','la observación',{min:5,max:500});
  await q("UPDATE alertas SET estado='atendida',atendido=NOW(),autor=?,observacion=? WHERE id=?",[actor,comment,target]);
  await audit(q,projectId,'Alerta',target,'Atención',{estado:'abierta'},{estado:'atendida',observacion:comment},'',actor);
}
async function recordWork(q,p,f,actor) {
  const projectId=Number(p.id);
  const date=bodyDate(f,'fecha','Fecha de inspección',p.inicio);
  const observation=note(f,'observacion');
  const doc=await proof(q,p,f);
  const [assignment]=await q('SELECT id FROM responsables WHERE proyecto=? AND usuario=? AND funcion=? AND inicio<=? AND fin>=?',[projectId,actor,'supervisor',date,date]);
  insist(assignment,'La visita debe corresponder a tu periodo de supervisión.');
  await q('INSERT INTO inspecciones_obra (proyecto,fecha,observacion,documento,autor) VALUES (?,?,?,?,?)',[projectId,date,observation,doc,actor]);
  await audit(q,projectId,'Obra',await inserted(q),'Inspección',null,{fecha:date,observacion:observation,documento:doc},'',actor);
}
async function extendDeadline(q,p,f,actor) {
  const projectId=Number(p.id);
  const end=f.date('fin','Nuevo vencimiento',{min:today()});
  insist(same(p.revision,f.id('revision','revisión')),'El plazo cambió. Recarga el cronograma.',409);
  insist(end>p.fin,'La ampliación debe superar el plazo vigente.');
  const reason=note(f),doc=await proof(q,p,f);
  await q('UPDATE proyectos SET fin=?, revision=revision+1 WHERE id=?',[end,projectId]);
  await audit(q,projectId,'Ampliación',projectId,'Ampliación de plazo',{fin:p.fin},{fin:end,documento:doc},reason,actor);
}
const handlers={work:recordWork,extension:extendDeadline,edit_project:editProject,assign,state:changeState,
  activity:(q,p,f,a)=>schedule(q,p,f,a,false),schedule:(q,p,f,a)=>schedule(q,p,f,a,true),
  budget,physical,financial,incident,incident_action:incidentAction,alert:alerts};
const tabs={work:'obra',extension:'cronograma',edit_project:'resumen',assign:'equipo',state:'resumen',activity:'cronograma',schedule:'cronograma',document:'documentos',
  budget:'presupuesto',physical:'avances',financial:'avances',incident:'incidencias',incident_action:'incidencias',
  alert:'alertas',publish:'publicacion',withdraw:'publicacion'};
const noClosed=['extension','work','edit_project','assign','activity','schedule','budget','incident','incident_action'];
export async function mutate(context,account,form) {
  const singleFields=new Set();
  for (const key of form.keys()) {
    if (key==='archivos') continue;
    insist(!singleFields.has(key),'Se recibió un campo duplicado. Recarga el formulario.',400);
    singleFields.add(key);
  }
  const action=form.get('accion');
  insist(typeof action==='string' && allowed(account.rol,action),'Tu rol no permite esta operación.',403);
  const nonce=form.get('operacion');
  insist(typeof nonce==='string' && /^[a-f0-9-]{36}$/.test(nonce),'Recarga el formulario e inténtalo nuevamente.',400);
  const actor=Number(account.id), f=input(form);
  const projectId=tabs[action]?f.id('proyecto','proyecto'):null;
  let encrypted=null,upload;
  if (action==='user' && form.get('clave')) encrypted=await hashPassword(password(form.get('clave')));
  if (action==='document') {
    const file=form.get('archivo');
    insist(file && typeof file!=='string' && file.size>0 && file.size<=maxFile,'Selecciona un PDF, JPG o PNG de hasta 10 MB.');
    const data=Buffer.from(await file.arrayBuffer());
    const type=fileType(data);
    const name=file.name.split(/[\\/]/).at(-1).replace(/[\u0000-\u001f\u007f]/g,'').trim();
    const ext=name.split('.').at(-1).toLowerCase();
    const matching={'application/pdf':['pdf'],'image/png':['png'],'image/jpeg':['jpg','jpeg']};
    insist(type && matching[type].includes(ext) && name.length>=5 && name.length<=180,'El tipo de archivo debe coincidir con la extensión PDF, JPG o PNG.');
    upload={name,data,type,sha:createHash('sha256').update(data).digest('hex')};
  }
  try {
    return await withDb(async q=>{
      await verifySession(context,q,account);
      const [processed]=await q('SELECT llave FROM operaciones WHERE usuario=? AND llave=? FOR UPDATE',[actor,nonce]);
      insist(!processed,'Este formulario ya se procesó. Recarga para consultar el resultado.',409);
      await q('INSERT INTO operaciones (usuario,llave) VALUES (?,?)',[actor,nonce]);
      if (action==='create_project') return createProject(q,f,actor);
      if (action==='user') { await user(q,f,actor,encrypted); return '/app/usuarios'; }
      const p=await projectAccess(q,account,projectId,true);
      insist(p.estado!=='concluido' || !noClosed.includes(action),'El proyecto está concluido.');
      if (action==='document') await document(q,p,f,actor,upload);
      else if (action==='publish' || action==='withdraw') await publication(q,p,f,actor,form,action==='withdraw');
      else await handlers[action](q,p,f,actor);
      return '/app/proyectos/'+projectId+'?vista='+tabs[action];
    },{transaction:true});
  } catch (error) {
    if (error instanceof Issue) throw error;
    if (/ERROR 1062\b/.test(error.message)) {
      const duplicate={work:'Esta visita ya tiene un acta con el mismo respaldo.',user:'Ya existe una cuenta con ese correo.',create_project:'Ya existe un proyecto con ese código.',edit_project:'Ya existe un proyecto con ese código.',
        activity:'Ya existe una actividad con ese nombre en el proyecto.',document:'Ese archivo ya está registrado en el proyecto o la versión anterior ya fue reemplazada.'};
      throw new Issue(duplicate[action]||'Ya existe un registro equivalente.',409);
    }
    if (/ERROR (1205|1213)\b/.test(error.message)) throw new Issue('Otra operación está modificando estos datos. Vuelve a intentarlo.',409);
    throw error;
  }
}
