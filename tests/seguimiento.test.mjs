import test from 'node:test';
import assert from 'node:assert/strict';
import { avanceFisico, coordenadas, mostrarVersion, nombresHistorial } from '../src/lib/seguimiento.mjs';

test('el avance distingue actividades sin medición, avances en cero y actividades terminadas', () => {
  const medir = valores => avanceFisico(valores.map(porcentaje => ({ porcentaje })));
  assert.deepEqual(medir([]), { promedio:null, medidas:0, total:0 });
  assert.deepEqual(medir(['NULL', null, undefined]), { promedio:null, medidas:0, total:3 });
  assert.deepEqual(medir([0,'50.25',null,100]), { promedio:50.08, medidas:3, total:4 });
  assert.deepEqual(medir([100,100]), { promedio:100, medidas:2, total:2 });
});

test('una ubicación admite dos coordenadas válidas o ninguna', () => {
  assert.deepEqual(coordenadas('',''), [null,null]);
  assert.deepEqual(coordenadas('0','0'), ['0.000000','0.000000']);
  assert.deepEqual(coordenadas('-19.5836','-65.7531'), ['-19.583600','-65.753100']);
  for (const pair of [['','5'],['12',''],['91','0'],['0','-181'],['-1.1234567','2']]) {
    assert.throws(() => coordenadas(...pair), /coordenadas/);
  }
});

test('el historial resuelve personas por lotes y distingue una cuenta ausente', async () => {
  const registro = {anterior:'NULL', nuevo:JSON.stringify({autor:2,encargado:'2',responsable:3,funcion:'tecnico'})};
  let consultas = 0;
  const nombres = await nombresHistorial(async (_, parametros) => {
    consultas++;
    assert.deepEqual(parametros, [2,3]);
    return [{id:'2',nombre:'Elena Flores'}];
  },[registro,registro]);
  assert.equal(consultas,1);
  assert.deepEqual(mostrarVersion(registro.nuevo,nombres), [
    ['Autor','Elena Flores'],['Encargado','Elena Flores'],['Responsable','Persona sin identificar'],['Función','Encargado de proyecto']
  ]);
});
