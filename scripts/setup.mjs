import { cuentasDemo, prepararCuentas } from './cuentas-demo.mjs';
import { readFile } from 'node:fs/promises';
import { randomBytes, createHash } from 'node:crypto';
import { databaseName, inserted, runScript, withDb } from '../src/lib/db.mjs';
import { hashPassword } from '../src/lib/auth.mjs';
import { addDays, roles, today } from '../src/lib/rules.mjs';
import { audit, syncAlerts } from '../src/lib/mutations.mjs';
import { renderPdf } from '../src/lib/pdf.mjs';

const flags=new Set(process.argv.slice(2));
if ([...flags].some(item=>item!=='--demo')) { console.error('Uso: npm run db:init -- [--demo]'); process.exit(1); }
const demo=flags.has('--demo');
const name=databaseName();
const date=today();
const shift=count=>addDays(date,count);
const adminInicial='admin@potosi.test';
const schema=(await Promise.all(['01-esquema.sql','02-validaciones.sql','03-ubicacion.sql'].map(file=>readFile(new URL('../database/'+file,import.meta.url),'utf8')))).join('\n');

try {
  await runScript('CREATE DATABASE IF NOT EXISTS '+name+' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\nUSE '+name+';\n'+schema);
  if (!demo) {
    const pass=process.env.PM_ADMIN_PASSWORD || 'Pm!'+randomBytes(17).toString('base64url');
    if (pass.length<12 || pass.length>128) throw new Error('PM_ADMIN_PASSWORD debe tener de 12 a 128 caracteres.');
    const fresh=await withDb(async q=>{
      const [existing]=await q("SELECT id FROM usuarios WHERE rol='admin' LIMIT 1 FOR UPDATE");
      if (existing) return false;
      await q("INSERT INTO usuarios (nombre,correo,clave,rol) VALUES ('Administración municipal',?,?,'admin')",[adminInicial,await hashPassword(pass)]);
      return true;
    },{transaction:true});
    console.log(fresh?'Cuenta inicial '+adminInicial+' / '+pass:'La cuenta administradora ya existe. Se conservaron sus credenciales.');
  } else {
    const seed=await withDb(async q=>{
      const users=await prepararCuentas(q);
      const [existing]=await q('SELECT id FROM proyectos LIMIT 1 FOR UPDATE');
      if (existing) return false;
      const names=Object.fromEntries(Object.entries(cuentasDemo).map(([rol,cuenta])=>[rol,cuenta.nombre]));
      const examples=[
        {code:'POT-DEMO-001',name:'Mejoramiento de la plaza de Villa Esperanza',location:'Zona Villa Esperanza',unit:'Dirección de Obras Públicas',state:'ejecucion',start:shift(-25),end:shift(48),
          description:'Proyecto de demostración para mejorar el acceso peatonal, la iluminación y las áreas de descanso de una plaza barrial.'},
        {code:'POT-DEMO-002',name:'Renovación del alumbrado en el Distrito Cuatro',location:'Distrito 4',unit:'Unidad de Alumbrado Público',state:'planificado',start:shift(3),end:shift(70),
          description:'Proyecto de demostración para renovar luminarias y puntos de conexión de una zona residencial.'},
        {code:'POT-DEMO-003',name:'Mantenimiento del polideportivo vecinal',location:'Zona San Martín',unit:'Dirección de Infraestructura',state:'concluido',start:shift(-65),end:shift(-5),
          description:'Proyecto de demostración para reparar superficies deportivas, pintar señalética y recuperar las graderías.'},
      ];
      const map=[];
      for (const p of examples) {
        await q('INSERT INTO proyectos (codigo,nombre,ubicacion,unidad,descripcion,inicio,fin,estado,autor,creado) VALUES (?,?,?,?,?,?,?,?,?,TIMESTAMP(?))',
          [p.code,p.name,p.location,p.unit,p.description,p.start,p.end,p.state,users.admin,p.state==='planificado'?date:p.start]);
        const pid=await inserted(q);
        map.push(pid);
        await q("INSERT INTO cambios_estado (proyecto,nuevo,motivo,autor,fecha) VALUES (?,'planificado','Registro inicial de demostración',?,TIMESTAMP(?))",[pid,users.admin,p.state==='planificado'?date:p.start]);
        await audit(q,pid,'Proyecto',pid,'Creación',null,{codigo:p.code,nombre:p.name,estado:'planificado'},'',users.admin);
        for (const role of ['tecnico','finanzas',...(p.state==='planificado'?[]:['supervisor'])]) {
          await q('INSERT INTO responsables (proyecto,usuario,funcion,inicio,fin,fin_original,motivo,autor,registrado) VALUES (?,?,?,?,?,?,?,?,TIMESTAMP(?))',
            [pid,users[role],role,p.start,p.end,p.end,'Asignación de demostración',users.admin,p.state==='planificado'?date:p.start]);
          await audit(q,pid,'Responsable',await inserted(q),'Asignación',null,{usuario:users[role],funcion:role,inicio:p.start,fin:p.end},'Datos de demostración',users.admin);
        }
        if (p.state==='planificado') continue;
        const finished=p.state==='concluido';
        const evidence=renderPdf({title:'Documento de respaldo de demostración',issuer:names.tecnico,issued:date,filters:{cut:date},documents:[
          {code:p.code,name:p.name,meta:p.location,sections:[{title:'Datos de demostración',entries:[{title:'Constancia de ejemplo',details:['Documento ficticio para probar el sistema universitario.']}]}]},
        ]});
        const digest=createHash('sha256').update(evidence).digest('hex');
        await q("INSERT INTO documentos (proyecto,nombre,descripcion,tipo,bytes,sha,motivo,autor,fecha,registrado) VALUES (?,'respaldo-demo.pdf','Constancia ficticia de demostración','application/pdf',?,?,'',?,?,TIMESTAMP(?))",[pid,evidence.length,digest,users.tecnico,p.start,p.start]);
        const doc=await inserted(q);
        await q('INSERT INTO archivo_partes (documento,numero,datos) VALUES (?,0,?)',[doc,evidence]);
        await audit(q,pid,'Documento',doc,'Carga',null,{nombre:'respaldo-demo.pdf'},'',users.tecnico);
        await q("INSERT INTO cambios_estado (proyecto,anterior,nuevo,motivo,documento,autor,fecha) VALUES (?,'planificado','ejecucion','Inicio de la demostración',?,?,TIMESTAMP(?))",[pid,doc,users.admin,p.start]);
        if (finished) await q("INSERT INTO cambios_estado (proyecto,anterior,nuevo,motivo,documento,autor,fecha) VALUES (?,'ejecucion','concluido','Cierre de la demostración',?,?,TIMESTAMP(?))",[pid,doc,users.admin,p.end]);
        const activities=finished?[
          ['Reparación de la superficie deportiva',p.start,p.end,p.end,100],
          ['Pintado de señalética',shift(-48),p.end,p.end,100],
        ]:[
          ['Nivelación de accesos peatonales',shift(-21),shift(-3),shift(-4),72],
          ['Instalación de luminarias',shift(-12),shift(5),shift(-4),35],
          ['Mejoras en áreas de descanso',shift(8),shift(40),null,null],
        ];
        for (const [title,start,end,cut,pct] of activities) {
          await q('INSERT INTO actividades (proyecto,nombre,responsable,inicio,fin,inicio_original,fin_original,autor,creado) VALUES (?,?,?,?,?,?,?,?,TIMESTAMP(?))',
            [pid,title,users.tecnico,start,end,start,end,users.admin,p.start]);
          const task=await inserted(q);
          if (cut) await q("INSERT INTO avances_fisicos (actividad,corte,porcentaje,observacion,documento,motivo,autor,registrado) VALUES (?,?,?,'Seguimiento de demostración',?,'',?,TIMESTAMP(?))",[task,cut,pct,doc,users.tecnico,cut]);
        }
        const amount=finished?'86500.00':'286000.00';
        const used=finished?'84650.00':'117300.00';
        const cut=finished?p.end:shift(-4);
        await q("INSERT INTO presupuesto (proyecto,monto,fecha,motivo,documento,autor,registrado) VALUES (?,?,?,'Presupuesto inicial de demostración',?,?,TIMESTAMP(?))",[pid,amount,p.start,doc,users.finanzas,p.start]);
        const allocation=await inserted(q);
        await q("INSERT INTO avances_financieros (proyecto,periodo,corte,acumulado,presupuesto,exceso,observacion,documento,motivo,autor,registrado) VALUES (?,?,?,?,?,0,'Ejecución de demostración',?,'',?,TIMESTAMP(?))",
          [pid,cut.slice(0,7),cut,used,allocation,doc,users.finanzas,cut]);
        await syncAlerts(q,pid,p.state);
        if (!finished) {
          await q("INSERT INTO incidencias (proyecto,descripcion,fecha,responsable,estado,autor) VALUES (?,'Entrega parcial de material para los accesos peatonales',?,?,'atencion',?)",[pid,shift(-4),users.tecnico,users.finanzas]);
          const issue=await inserted(q);
          await q("INSERT INTO acciones_incidencia (incidencia,descripcion,fecha,documento,cierre,autor) VALUES (?,'Se coordinó una nueva fecha de entrega con el proveedor.',?,?,0,?)",[issue,shift(-2),doc,users.finanzas]);
        }
        const ficha={codigo:p.code,nombre:p.name,ubicacion:p.location,unidad:p.unit,estado:p.state,inicio:p.start,fin:p.end,resumen:p.description};
        await q('INSERT INTO versiones_publicas (proyecto,ficha,autor) VALUES (?,?,?)',[pid,JSON.stringify(ficha),users.admin]);
        const version=await inserted(q);
        await q('INSERT INTO archivos_publicos (version,documento) VALUES (?,?)',[version,doc]);
        await audit(q,pid,'Publicación',version,'Aprobación',null,{ficha,documentos:[doc]},'',users.admin);
      }
      return map;
    },{transaction:true});
    console.log(seed?'Se crearon tres proyectos ficticios con dos fichas públicas.':'Se conservaron los proyectos registrados.');
    for (const [rol,cuenta] of Object.entries(cuentasDemo)) console.log(roles[rol]+' · '+cuenta.correo);
    const [estado]=await withDb(q=>q('SELECT (SELECT COUNT(*) FROM proyectos) proyectos,(SELECT COUNT(*) FROM versiones_publicas WHERE activa=1) publicados'));
    console.log('Proyectos registrados: '+estado.proyectos+'. Publicados para la ciudadanía: '+estado.publicados+'.');

  }
  console.log('Base: '+name);
} catch (error) {
  console.error('No se pudo preparar la base. Comprueba que MariaDB esté en ejecución y que la conexión de .env corresponda a tu instalación.');
  console.error(error.message);
  process.exitCode=1;
}
