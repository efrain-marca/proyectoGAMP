import { withDb, optional } from './db.mjs';
import { dateLabel, id, insist, isDate, money, roles, states, statusLabel, today } from './rules.mjs';
export const reportTypes={
  consolidado:'Consolidado de proyectos', avances:'Avances físicos y financieros',
  presupuesto:'Presupuesto y ejecución financiera', cronograma:'Cronograma y cumplimiento',
  equipo:'Asignaciones y responsables', incidencias:'Incidencias y actuaciones',
  documentos:'Documentos y versiones', historial:'Historial de cambios',
  obra:'Inspecciones de obra',alertas:'Alertas y atención', publicaciones:'Publicaciones ciudadanas',
};
export function reportFilters(parameters) {
  const type=parameters.get('tipo')||'consolidado', project=parameters.get('proyecto')||'';
  const from=parameters.get('desde')||'1900-01-01', cut=parameters.get('corte')||today();
  const state=parameters.get('estado')||'';
  insist(Object.hasOwn(reportTypes,type),'Selecciona un tipo de informe válido.');
  insist(!state || Object.hasOwn(states,state),'Selecciona un estado válido.');
  insist(isDate(from) && isDate(cut) && from<=cut && cut<=today(),'Indica un rango válido con una fecha de corte de hoy o anterior.');
  return {type,project:project?id(project,'proyecto'):null,from,cut,state,hasFrom:parameters.has('desde')&&Boolean(parameters.get('desde'))};
}
const section=(title,entries)=>({title,entries});
const row=(title,...details)=>({title,details:details.filter(Boolean)});
const percent=value=>optional(value)==null?'Sin registro':Number(value).toLocaleString('es-BO',{maximumFractionDigits:2})+' %';
const reference=(amount,base)=>Number(base)>0?percent((Number(amount)*100/Number(base)).toFixed(2)):'No calculable (presupuesto cero)';
const csvDate=(start,end)=>dateLabel(start)+' al '+dateLabel(end);
const attached=id=>optional(id)?'Documento #'+id:'';
function newestPer(records,key) {
  const previous=new Set();
  return records.filter(record=>{
    if (previous.has(record[key])) return false;
    previous.add(record[key]); return true;
  });
}
function eventSummary(record) {
  const values=JSON.parse(record==='NULL'?'null':record);
  return values?Object.entries(values).map(([key,value])=>key+' '+(typeof value==='object'&&value!==null?JSON.stringify(value):String(value))).join(' · '):'';
}
export async function loadReport(account,filters) {
  insist(account.rol==='admin','El informe está disponible para el administrador.',403);
  return withDb(async q=>{
    const {type,project,from,cut,state}=filters;
    const list=await q("SELECT p.*,COALESCE((SELECT c.nuevo FROM cambios_estado c WHERE c.proyecto=p.id AND c.fecha<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY c.id DESC LIMIT 1),'planificado') estado_corte FROM proyectos p WHERE p.creado<DATE_ADD(?,INTERVAL 1 DAY) AND (? IS NULL OR p.id=?) HAVING (?='' OR estado_corte=?) ORDER BY p.codigo LIMIT 101",[cut,cut,project,project,state,state]);
    insist(list.length<=100,'El informe supera 100 proyectos. Aplica un filtro para generar el PDF.',422);
    const documents=[];
    for (const p of list) {
      const pid=Number(p.id), sections=[];
      const selected=(...types)=>types.includes(type);
      let budgets=[], financial=[], allPhysical=[], tasks=[];
      if (selected('consolidado','presupuesto','avances')) {
        budgets=await q('SELECT b.*,u.nombre persona FROM presupuesto b JOIN usuarios u ON u.id=b.autor WHERE b.proyecto=? AND b.fecha<=? ORDER BY b.fecha DESC,b.id DESC',[pid,cut]);
        financial=await q('SELECT f.*,b.monto referencia,u.nombre persona FROM avances_financieros f JOIN presupuesto b ON b.id=f.presupuesto JOIN usuarios u ON u.id=f.autor WHERE f.proyecto=? AND f.vigente=1 AND f.corte<=? ORDER BY f.corte DESC,f.id DESC',[pid,cut]);
      }
      if (selected('consolidado','cronograma','avances')) {
        tasks=await q('SELECT a.*,u.nombre persona FROM actividades a JOIN usuarios u ON u.id=a.responsable WHERE a.proyecto=? AND a.creado<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY a.inicio_original,a.id',[pid,cut]);
        const reschedules=await q('SELECT r.*,a.nombre,u.nombre persona FROM reprogramaciones r JOIN actividades a ON a.id=r.actividad JOIN usuarios u ON u.id=r.autor WHERE a.proyecto=? AND r.fecha<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY r.id DESC',[pid,cut]);
        allPhysical=await q('SELECT f.*,a.nombre,u.nombre persona FROM avances_fisicos f JOIN actividades a ON a.id=f.actividad JOIN usuarios u ON u.id=f.autor WHERE a.proyecto=? AND f.vigente=1 AND f.corte<=? ORDER BY f.corte DESC,f.id DESC',[pid,cut]);
        const current=new Map(newestPer(allPhysical,'actividad').map(record=>[record.actividad,record]));
        const releases=new Map(newestPer(reschedules,'actividad').map(record=>[record.actividad,record]));
        if (selected('consolidado','cronograma','avances')) sections.push(section(type==='avances'?'Último avance físico por actividad':'Cronograma y último avance físico',tasks.map(task=>{
          const plan=releases.get(task.id), record=current.get(task.id);
          const start=plan?.inicio||task.inicio_original, end=plan?.fin||task.fin_original;
          const status=Number(record?.porcentaje)===100?'Completada':end<cut?(record?'Plazo vencido':'Plazo vencido · sin avance informado'):'Dentro del plazo';
          return row(task.nombre,'Plan inicial '+csvDate(task.inicio_original,task.fin_original),'Plan al corte '+csvDate(start,end),status,
            'Avance físico '+percent(record?.porcentaje)+(record?' · corte '+dateLabel(record.corte):''),
            record?record.observacion:'');
        })));
        if (type==='cronograma') sections.push(section('Reprogramaciones en el periodo',reschedules.filter(r=>r.fecha.slice(0,10)>=from).map(r=>row(r.nombre,csvDate(r.inicio_previo,r.fin_previo)+' → '+csvDate(r.inicio,r.fin),r.motivo,dateLabel(r.fecha)+' · '+r.persona,attached(r.documento)))));
        if (type==='avances') sections.push(section('Avances físicos del periodo',allPhysical.filter(r=>r.corte>=from).map(r=>row(r.nombre+' · '+percent(r.porcentaje),dateLabel(r.corte)+' · '+r.persona,r.observacion,attached(r.documento),optional(r.reemplaza)?'Rectifica el avance #'+r.reemplaza:''))));
      }
      if (selected('consolidado','presupuesto','avances')) {
        const last=financial[0], base=budgets[0];
        sections.push(section('Situación financiera al corte',[
          row('Presupuesto de referencia',base?money(base.monto)+' · vigencia '+dateLabel(base.fecha):'Sin registro'),
          row('Ejecución acumulada',last?money(last.acumulado)+' · periodo '+last.periodo:'Sin registro',
            last?'Ejecución sobre referencia del informe '+reference(last.acumulado,last.referencia):'',
            last?.exceso==='1'?'Exceso registrado para revisión':'',
            last&&base?'Saldo frente al presupuesto al corte '+money((Number(base.monto)-Number(last.acumulado)).toFixed(2)):''),
        ]));
        if (type==='presupuesto') sections.push(section('Versiones de presupuesto del periodo',budgets.filter(b=>b.fecha>=from).map(b=>row(money(b.monto),dateLabel(b.fecha)+' · '+b.persona,optional(b.previo)?'Monto anterior '+money(b.previo):'Presupuesto inicial',b.motivo,attached(b.documento)))));
        if (type!=='consolidado') sections.push(section('Importes acumulados por periodo',financial.filter(f=>f.corte>=from).map(f=>row(f.periodo+' · '+money(f.acumulado),dateLabel(f.corte)+' · '+f.persona,
          'Referencia '+money(f.referencia)+' · ejecución '+reference(f.acumulado,f.referencia),f.exceso==='1'?'Marcado para revisión':'',f.observacion,attached(f.documento)))));
      }
      if (selected('equipo','consolidado')) {
        const team=await q('SELECT r.*,u.nombre FROM responsables r JOIN usuarios u ON u.id=r.usuario WHERE r.proyecto=? AND r.inicio<=? AND r.registrado<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY r.inicio,r.id',[pid,cut,cut]);
        sections.push(section(type==='consolidado'?'Responsables al corte':'Asignaciones del periodo',team.filter(r=>r.fin>=(type==='consolidado'?cut:from))
          .map(r=>row(r.nombre,roles[r.funcion],csvDate(r.inicio,r.fin),r.fin>=cut?'Vigente al corte':'Finalizada al corte',r.motivo))));
      }
      if (type==='obra') {
        const visits=await q('SELECT o.*,u.nombre persona FROM inspecciones_obra o JOIN usuarios u ON u.id=o.autor WHERE o.proyecto=? AND o.fecha BETWEEN ? AND ? ORDER BY o.fecha,o.id',[pid,from,cut]);
        sections.push(section('Visitas de supervisión',visits.map(v=>row('Inspección #'+v.id,dateLabel(v.fecha)+' · '+v.persona,v.observacion,attached(v.documento)))));
      }
      if (type==='cronograma') {
        const changes=await q("SELECT h.*,u.nombre persona FROM historial h JOIN usuarios u ON u.id=h.autor WHERE h.proyecto=? AND h.entidad='Ampliación' AND h.fecha>=? AND h.fecha<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY h.id",[pid,from,cut]);
        sections.push(section('Ampliaciones del proyecto',changes.map(c=>row(c.motivo,dateLabel(c.fecha)+' · '+c.persona,'Fin previo '+dateLabel(JSON.parse(c.anterior).fin)+' · nuevo fin '+dateLabel(JSON.parse(c.nuevo).fin),attached(JSON.parse(c.nuevo).documento)))));
      }
      if (type==='incidencias') {
        const events=await q('SELECT i.*,u.nombre persona FROM incidencias i JOIN usuarios u ON u.id=i.responsable WHERE i.proyecto=? AND i.fecha<=? ORDER BY i.fecha,i.id',[pid,cut]);
        const actions=await q('SELECT a.*,u.nombre persona FROM acciones_incidencia a JOIN incidencias i ON i.id=a.incidencia JOIN usuarios u ON u.id=a.autor WHERE i.proyecto=? AND a.fecha<=? ORDER BY a.fecha,a.id',[pid,cut]);
        const summaries=events.map(e=>({e,follow:actions.filter(a=>a.incidencia===e.id)})).filter(({e,follow})=>e.fecha>=from || follow.some(a=>a.fecha>=from));
        sections.push(section('Incidencias internas y seguimiento',summaries.flatMap(({e,follow})=>[
          row('#'+e.id+' · '+e.descripcion,dateLabel(e.fecha)+' · Atención a cargo de '+e.persona,'Estado al corte '+statusLabel(follow.at(-1)?.cierre==='1'?'resuelta':follow.length?'atencion':'pendiente')),
          ...follow.filter(a=>a.fecha>=from).map(a=>row('Actuación de incidencia #'+e.id,dateLabel(a.fecha)+' · '+a.persona,a.descripcion,attached(a.documento))),
        ])));
      }
      if (type==='documentos') {
        const docs=await q('SELECT d.*,u.nombre persona FROM documentos d JOIN usuarios u ON u.id=d.autor WHERE d.proyecto=? AND d.fecha BETWEEN ? AND ? AND d.registrado<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY d.fecha,d.id',[pid,from,cut,cut]);
        sections.push(section('Inventario documental',docs.map(d=>row('#'+d.id+' · '+d.nombre,dateLabel(d.fecha)+' · '+d.persona,d.descripcion,d.tipo+' · '+d.bytes+' bytes',
          optional(d.anterior)?'Versión anterior #'+d.anterior:'Primera versión',d.motivo))));
      }
      if (type==='historial') {
        const logs=await q('SELECT h.*,u.nombre persona FROM historial h JOIN usuarios u ON u.id=h.autor WHERE h.proyecto=? AND h.fecha>=? AND h.fecha<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY h.id',[pid,from,cut]);
        sections.push(section('Actuaciones registradas',logs.map(h=>row(h.entidad+' · '+h.accion+' #'+h.registro,h.fecha+' · '+h.persona,h.motivo,
          optional(h.anterior)?'Anterior · '+eventSummary(h.anterior):'',optional(h.nuevo)?'Registrado · '+eventSummary(h.nuevo):''))));
      }
      if (type==='alertas') {
        const alerts=await q('SELECT t.*,a.nombre FROM alertas t JOIN actividades a ON a.id=t.actividad WHERE a.proyecto=? AND t.creado<DATE_ADD(?,INTERVAL 1 DAY) AND (t.creado>=? OR t.atendido>=?) ORDER BY t.id',[pid,cut,from,from]);
        sections.push(section('Alertas del cronograma',alerts.map(a=>row(a.nombre+' · '+statusLabel(a.tipo),'Vencimiento '+dateLabel(a.fin)+' · Registro '+dateLabel(a.creado),
          optional(a.atendido)&&a.atendido.slice(0,10)<=cut?'Atendida '+dateLabel(a.atendido)+' · '+a.observacion:'Sin atención registrada al corte'))));
      }
      if (type==='publicaciones') {
        const publications=await q('SELECT v.*,u.nombre persona,(SELECT COUNT(*) FROM archivos_publicos x WHERE x.version=v.id) archivos FROM versiones_publicas v JOIN usuarios u ON u.id=v.autor WHERE v.proyecto=? AND v.aprobada<DATE_ADD(?,INTERVAL 1 DAY) AND (v.aprobada>=? OR v.retirada>=?) ORDER BY v.id',[pid,cut,from,from]);
        sections.push(section('Versiones aprobadas',publications.map(v=>row('Publicación #'+v.id+' · '+JSON.parse(v.ficha).nombre,'Aprobada '+dateLabel(v.aprobada)+' · '+v.persona+' · '+v.archivos+' documentos',
          optional(v.retirada)&&v.retirada.slice(0,10)<=cut?'Retirada '+dateLabel(v.retirada)+' · '+v.motivo:'Vigente al corte'))));
      }
      documents.push({code:p.codigo,name:p.nombre,meta:p.ubicacion+' · '+p.unidad+' · '+states[p.estado_corte],sections});
    }
    return {title:reportTypes[type],filters,documents,issued:new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz', dateStyle:'short',timeStyle:'short'}).format(new Date()),issuer:account.nombre};
  },{transaction:true,readonly:true});
}
