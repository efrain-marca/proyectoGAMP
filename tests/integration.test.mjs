import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { rows } from '../src/lib/db.mjs';
import { today,addDays } from '../src/lib/rules.mjs';
import { renderPdf } from '../src/lib/pdf.mjs';
import { reportTypes } from '../src/lib/reports.mjs';

test('flujos completos de las 16 historias con Astro y una base MariaDB de demostración', {skip:process.env.PM_INTEGRATION!=='1',timeout:120000}, async()=>{
  assert.match(process.env.DB_NAME||'', /^pm_prueba_[a-z0-9_]+$/);
  const {render}=await import('../dist/server/entry.mjs');
  const origin='http://localhost:4321';
  const pass='Demo-Potosi#2026', date=today(), shift=n=>addDays(date,n);
  const get=(path,cookie)=>render(new Request(origin+path,{headers:cookie?{cookie}:{}}));
  const post=(path,body,cookie,source=origin)=>render(new Request(origin+path,{method:'POST',body,headers:{origin:source,accept:'application/json',...(cookie?{cookie}:{})}}));
  async function login(username,password=pass) {
    const response=await post('/api/auth/ingreso',new URLSearchParams({email:username+'@potosi.test',password}));
    assert.equal(response.status,200,await response.text());
    const cookie=response.headers.get('set-cookie');
    assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Lax/i);
    return cookie.split(';')[0];
  }
  async function op(cookie,action,fields={},expected=200,operation=randomUUID()) {
    const body=new FormData();
    for (const [name,value] of Object.entries({accion:action,operacion:operation,...fields})) {
      for (const item of (Array.isArray(value)?value:[value])) body.append(name,item);
    }
    const response=await post('/api/interno/operacion',body,cookie);
    const result=await response.json();
    assert.equal(response.status,expected,JSON.stringify(result));
    return result;
  }
  const parse=async response=>{assert.equal(response.status,200);return response.text();};
  const getProject=async code=>(await rows('SELECT * FROM proyectos WHERE codigo=?',[code]))[0];
  const uid=async role=>(await rows('SELECT id FROM usuarios WHERE correo=?',[role+'@potosi.test']))[0]?.id;
  const passwords={};
  for (const account of ['admin','tecnico','finanzas','supervisor']) passwords[account]=await login(account);
  assert.equal((await get('/app')).status,303);
  assert.equal((await get('/api/interno/informe.pdf')).status,401);
  assert.equal((await post('/api/auth/ingreso',new URLSearchParams({email:'admin@potosi.test',password:'otro'}))).status,401);
  assert.equal((await post('/api/auth/ingreso',new URLSearchParams({email:'admin@potosi.test',password:pass}),null,'http://otra.invalid')).status,403);
  assert.match(await parse(await get('/app',passwords.admin)),/Proyectos recientes/);
  assert.match(await parse(await get('/app/usuarios',passwords.admin)),/Directorio de usuarios/);
  assert.match(await parse(await get('/portal')),/Villa Esperanza/);

  const demo=await getProject('POT-DEMO-001');
  const demo2=await getProject('POT-DEMO-002');
  assert.equal((await get('/app/proyectos/'+demo2.id,passwords.supervisor)).status,404);
  assert.equal((await get('/api/pub/'+demo2.id+'-1')).status,404);

  const newCode='PM-T-'+randomUUID().slice(0,8).toUpperCase();
  const base={codigo:newCode,nombre:'Renovación de vías de prueba',ubicacion:'Potosí',unidad:'Obras Públicas',descripcion:'Ficha creada para comprobar las validaciones del sistema.',inicio:date,fin:shift(80)};
  await op(passwords.admin,'create_project',{...base,inicio:shift(-1)},422);
  await op(passwords.admin,'create_project',{...base,fin:shift(-1)},422);
  await op(passwords.tecnico,'create_project',base,403);
  await op(passwords.admin,'create_project',{...base,nombre:'Gus123'},422);
  const nonce=randomUUID();
  await op(passwords.admin,'create_project',base,200,nonce);
  await op(passwords.admin,'create_project',base,409,nonce);
  await op(passwords.admin,'create_project',base,409);
  const p=await getProject(newCode), proyecto=p.id;

  const supervisor=await uid('supervisor');
  const assignment={proyecto,funcion:'supervisor',responsable:supervisor,inicio:date,fin:shift(20)};
  const overlap=await op(passwords.admin,'assign',assignment,409);
  assert.match(overlap.error,/cruza/);
  const after=(await rows('SELECT fin FROM responsables WHERE proyecto=? AND funcion=?',[Number(demo.id),'supervisor']))[0].fin;
  await op(passwords.admin,'assign',{...assignment,inicio:after,fin:shift(70)},409);
  await op(passwords.admin,'assign',{...assignment,inicio:addDays(after,1),fin:shift(70)});
  await op(passwords.admin,'assign',{...assignment,inicio:shift(-1)},422);
  assert.equal((await get('/app/proyectos/'+proyecto,passwords.supervisor)).status,404);

  for (const table of ['usuarios','proyectos','actividades']) {
    await assert.rejects(rows('UPDATE '+table+' SET nombre=? ORDER BY id LIMIT 1',['Gus123']),/45000/);
  }
  const second='supervisor-'+randomUUID().slice(0,8);
  const newUser={nombre:'Supervisora de prueba',correo:second+'@potosi.test',rol:'supervisor',clave:pass,activo:'1'};
  await op(passwords.admin,'user',{...newUser,nombre:'Gus123'},422);
  await op(passwords.admin,'user',{...newUser,nombre:'José Muñoz'});
  await op(passwords.admin,'user',newUser,409);
  const additional=await uid(second);
  await op(passwords.admin,'assign',{...assignment,responsable:additional,fin:shift(38)});
  for (const role of ['tecnico','finanzas']) {
    await op(passwords.admin,'assign',{...assignment,funcion:role,responsable:await uid(role),fin:shift(75)});
  }
  const newSupervisor=await login(second);
  assert.equal((await get('/app/proyectos/'+proyecto,newSupervisor)).status,200);

  const exported=await get('/api/interno/informe.pdf?tipo=avances&proyecto='+demo.id,passwords.admin);
  assert.equal(exported.status,200);
  assert.equal(exported.headers.get('content-type'),'application/pdf');
  assert.match(exported.headers.get('content-disposition'),/attachment; filename="informe-avances/);
  const pdf=Buffer.from(await exported.arrayBuffer());
  assert.match(pdf.toString(),/Sin registro/);
  if (process.env.PM_TEST_PDF) await writeFile(process.env.PM_TEST_PDF,pdf);
  assert.equal((await get('/api/interno/informe.pdf?tipo=avances',newSupervisor)).status,403);
  assert.match(await parse(await get('/app/informes?tipo=avances&proyecto='+demo.id,passwords.admin)),/Avances del periodo|Avances físicos del periodo/);

  const invalidFile=new File(['solo texto'],'parece.pdf',{type:'application/pdf'});
  const file=(name,label)=>new File([renderPdf({title:label,issuer:'Prueba',issued:date,filters:{cut:date},documents:[]})],name,{type:'application/pdf'});
  const support={proyecto,fecha:date,descripcion:'Documento respaldatorio para pruebas.'};
  await op(passwords.tecnico,'document',{...support,archivo:invalidFile},422);
  await op(passwords.tecnico,'document',{...support,archivo:file('respaldo.pdf','Respaldo oficial demo')});
  await op(passwords.tecnico,'document',{...support,archivo:file('respaldo-duplicado.pdf','Respaldo oficial demo')},409);
  for (const type of Object.keys(reportTypes)) {
    const response=await get('/api/interno/informe.pdf?tipo='+type+'&proyecto='+demo.id,passwords.admin);
    assert.equal(response.status,200,await response.clone().text());
    assert.equal(response.headers.get('content-type'),'application/pdf');
    assert.match(await response.text(),/^%PDF/);
  }
  const doc=(await rows('SELECT id FROM documentos WHERE proyecto=?',[Number(proyecto)]))[0].id;
  assert.equal((await get('/api/interno/documentos/'+proyecto+'-'+doc,passwords.supervisor)).status,404);
  assert.equal((await get('/api/interno/documentos/'+proyecto+'-'+doc,newSupervisor)).status,200);
  assert.equal((await get('/api/pub/'+proyecto+'-'+doc)).status,404);

  const state={proyecto,estado:'ejecucion',motivo:'Inicio documentado para verificación.'};
  await op(passwords.admin,'state',state,422);
  await op(passwords.admin,'state',{...state,documento:doc});
  await op(passwords.admin,'state',{...state,documento:doc},422);
  const task={proyecto,nombre:'Preparación de vías',responsable:await uid('tecnico'),inicio:date,fin:shift(3)};
  await op(passwords.admin,'activity',{...task,inicio:shift(-1)},422);
  await op(passwords.admin,'activity',{...task,nombre:'Gus123'},422);
  await op(passwords.admin,'activity',task);
  await op(passwords.admin,'activity',task,409);
  const actividad=(await rows('SELECT id FROM actividades WHERE proyecto=?',[Number(proyecto)]))[0].id;
  await op(passwords.admin,'schedule',{...task,actividad,inicio_actual:date,fin_actual:shift(3),responsable_actual:task.responsable,fin:shift(4),documento:doc,motivo:'Nueva fecha de instalación autorizada.'});

  const budget={proyecto,fecha:date,monto:'1000.00',documento:doc};
  await op(passwords.finanzas,'budget',{...budget,monto:'-10'},422);
  await op(passwords.finanzas,'budget',budget);
  const physical={documento:doc,proyecto,actividad,corte:date,porcentaje:'50',observacion:'Avance verificado para la simulación.'};
  await op(passwords.tecnico,'physical',{...physical,porcentaje:'100.01'},422);
  await op(passwords.tecnico,'physical',{...physical,corte:shift(1)},422);
  await op(newSupervisor,'physical',physical,403);
  await op(passwords.tecnico,'physical',{...physical,documento:''},422);
  await op(passwords.tecnico,'physical',physical);
  await op(passwords.tecnico,'physical',physical,409);
  const first=(await rows('SELECT id FROM avances_fisicos WHERE actividad=? AND vigente=1',[Number(actividad)]))[0].id;
  await op(passwords.tecnico,'physical',{...physical,rectifica:first,porcentaje:'55',motivo:'Se rectificó la lectura de la medición.'});
  const versions=await rows('SELECT id,vigente,reemplaza FROM avances_fisicos WHERE actividad=? ORDER BY id',[Number(actividad)]);
  assert.deepEqual(versions.map(v=>[v.vigente,v.reemplaza]),[['0','NULL'],['1',first]]);
  const financial={proyecto,documento:doc,periodo:date.slice(0,7),corte:date,monto:'1100',observacion:'Informe financiero para revisión de la diferencia.'};
  assert.match((await op(passwords.finanzas,'financial',financial,422)).error,/supera el presupuesto/);
  await op(passwords.finanzas,'financial',{...financial,confirmar_exceso:'1'});
  await op(passwords.finanzas,'financial',{...financial,confirmar_exceso:'1'},409);

  const work={proyecto,fecha:date,observacion:'Se verificó la preparación del terreno.',documento:doc};
  await op(newSupervisor,'work',{...work,fecha:shift(1)},422);
  await op(passwords.tecnico,'work',work,403);
  await op(newSupervisor,'work',work);
  await op(newSupervisor,'work',work,409);
  assert.match(await parse(await get('/app/proyectos/'+proyecto+'?vista=obra',newSupervisor)),/preparación del terreno/);
  const extension={proyecto,revision:(await getProject(newCode)).revision,fin:shift(90),motivo:'Ampliación documentada para concluir la obra.',documento:doc};
  await op(passwords.admin,'extension',{...extension,fin:shift(75)},422);
  await op(passwords.admin,'extension',extension);
  await op(passwords.admin,'extension',extension,409);
  assert.match(await parse(await get('/app/proyectos/'+proyecto+'?vista=cronograma',passwords.admin)),/Ampliación documentada/);
  const incident={proyecto,fecha:date,responsable:task.responsable,descripcion:'Falta una señal reglamentaria en la vía.'};
  await op(newSupervisor,'incident',incident,403);
  await op(passwords.finanzas,'incident',incident);
  await op(passwords.finanzas,'incident',incident,409);
  const incidencia=(await rows('SELECT id FROM incidencias WHERE proyecto=?',[Number(proyecto)]))[0].id;
  const action={proyecto,incidencia,fecha:date,descripcion:'Se registró una inspección en el sector.'};
  await op(passwords.finanzas,'incident_action',{...action,cerrar:'1'},422);
  await op(passwords.finanzas,'incident_action',action);
  await op(passwords.finanzas,'incident_action',{...action,descripcion:'Se colocó y verificó la señal reglamentaria.',cerrar:'1',documento:doc});
  await op(passwords.admin,'alert',{proyecto});
  const alerts=await rows('SELECT id FROM alertas WHERE actividad=? AND estado=?',[Number(actividad),'abierta']);
  await op(passwords.admin,'alert',{proyecto,alerta:alerts[0].id,observacion:'Se hizo seguimiento del vencimiento.'});
  await op(passwords.admin,'alert',{proyecto,alerta:alerts[0].id,observacion:'Se hizo seguimiento del vencimiento.'},409);
  assert.match(await parse(await get('/app/proyectos/'+proyecto+'?vista=historial',newSupervisor)),/Rectificación/);

  const publish={proyecto,revision:(await getProject(newCode)).revision,resumen:'Resumen aprobado para consulta ciudadana.',archivos:doc,aprobado:'1'};
  await op(passwords.finanzas,'publish',publish,403);
  await op(passwords.admin,'publish',publish);
  assert.match(await parse(await get('/portal/'+proyecto)),/Resumen aprobado/);
  assert.equal((await get('/api/pub/'+proyecto+'-'+doc)).status,200);
  const revision=(await getProject(newCode)).revision;
  await op(passwords.admin,'edit_project',{...base,proyecto,revision,nombre:'Nombre interno pendiente de publicación',motivo:'Actualizar la nomenclatura de la obra.'});
  await op(passwords.admin,'edit_project',{...base,proyecto,revision,motivo:'Intento desde una edición anterior.'},409);
  assert.doesNotMatch(await parse(await get('/portal/'+proyecto)),/Nombre interno pendiente/);
  const publication=(await rows('SELECT id FROM versiones_publicas WHERE proyecto=? AND activa=1',[Number(proyecto)]))[0].id;
  await op(passwords.admin,'withdraw',{proyecto,publicacion:publication,motivo:'Retiro en el escenario de pruebas.'});
  assert.equal((await get('/portal/'+proyecto)).status,404);
  assert.equal((await get('/api/pub/'+proyecto+'-'+doc)).status,404);

  const director='cuenta-'+randomUUID().slice(0,8);
  const account={nombre:'Cuenta temporal de prueba',correo:director+'@potosi.test',rol:'supervisor',clave:pass,activo:'1'};
  await op(passwords.admin,'user',account);
  const session=await login(director);
  await op(passwords.admin,'user',{...account,usuario:await uid(director),activo:'0',clave:''});
  assert.equal((await get('/app',session)).status,303);
  const logout=await post('/api/auth/salir',new URLSearchParams(),passwords.admin);
  assert.equal(logout.status,303);
  assert.equal((await get('/app',passwords.admin)).status,303);
});
