import test from 'node:test';
import assert from 'node:assert/strict';
import { bind } from '../src/lib/db.mjs';
import { input, isDate, period, today, allowed, addDays } from '../src/lib/rules.mjs';
import { fileType } from '../src/lib/mutations.mjs';
import { reportFilters } from '../src/lib/reports.mjs';
import { renderPdf } from '../src/lib/pdf.mjs';

test('calendario de Bolivia, fechas existentes e intervalos válidos',()=>{
  assert.equal(today(new Date('2026-11-23T02:00:00Z')),'2026-11-22');
  assert.equal(isDate('2024-02-29'),true);
  assert.equal(isDate('2026-02-29'),false);
  assert.throws(()=>period('2026-11-23','2026-11-22'),/posterior/);
  assert.throws(()=>period('2026-11-21','2026-11-23',{min:'2026-11-22'}),/posterior/);
  assert.doesNotThrow(()=>period('2026-11-22','2026-11-22'));
});
test('porcentajes, importes y permisos se validan sin depender del navegador',()=>{
  const val=(m)=>input(new URLSearchParams({m})).decimal('m','El importe',{max:100});
  assert.equal(val('11,2'),'11.20');
  for (const invalid of ['100.01','1e2','0.001','-1','NaN']) assert.throws(()=>val(invalid));
  assert.equal(allowed('autoridad','publish'),false);
  assert.equal(allowed('supervisor','physical'),false);
  assert.equal(allowed('admin','constructor'),false);
});
test('los literales enviados al cliente SQL no cambian la estructura de la consulta',()=>{
  const userInput="a' café; texto\n";
  const bound=bind('SELECT ? AS texto, ? AS n, ? AS bin, ? AS faltante',[userInput,42,Buffer.from([0,255]),null]);
  assert.equal(bound,"SELECT CONVERT(X'"+Buffer.from(userInput).toString('hex')+"' USING utf8mb4) AS texto, 42 AS n, X'00ff' AS bin, NULL AS faltante");
  assert.throws(()=>bind('SELECT ?,?', ['dato']));
});
test('el informe es un PDF paginado y los filtros rechazan fechas futuras',()=>{
  assert.throws(()=>reportFilters(new URLSearchParams({corte:addDays(today(),1)})),/fecha de corte/);
  assert.throws(()=>reportFilters(new URLSearchParams({tipo:'queja'})),/informe válido/);
  const pdf=renderPdf({title:'Avances físicos y financieros',issuer:'Autoridad',issued:today(),filters:{cut:today()},documents:[
    {code:'POT-00',name:'Proyecto (demo)',meta:'Potosí',sections:[{title:'Avances',entries:Array.from({length:100},(_,i)=>({title:'Actividad '+i,details:['Avance del 25 %']}))}]},
  ]});
  assert.equal(fileType(pdf),'application/pdf');
  assert.equal(fileType(Buffer.from('archivo.pdf')) ,null);
  assert.match(pdf.toString(),/\/Count [2-9]/);
  assert.match(pdf.toString(),/xref\n0/);
});

test('nombres en español con tildes, espacios y ñ',()=>{
  const name=value=>input(new URLSearchParams({nombre:value})).text('nombre','Nombre',{min:3,max:120});
  for (const invalid of ['Gus123','Gus@tavo','Gus_tavo','María-José','123','Gus🔥','José\\nMuñoz']) assert.throws(()=>name(invalid));
  assert.equal(name('Jose\u0301 Muñoz'),'José Muñoz');
});
