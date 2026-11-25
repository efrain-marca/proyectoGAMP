import { insist, roles, statusLabel } from './rules.mjs';

export const funciones = {
  admin: 'Administra cuentas, proyectos, responsables, cronogramas, informes y publicaciones.',
  tecnico: 'Registra avances físicos y carga los documentos de respaldo del proyecto.',
  finanzas: 'Registra presupuestos, ejecución financiera e incidencias y documenta su atención.',
  supervisor: 'Registra visitas e inspecciones de obra y consulta el historial autorizado.',
};

export function avanceFisico(actividades) {
  const medidas = actividades.map(a => a.porcentaje).filter(v => v != null && v !== 'NULL');
  const promedio = medidas.length
    ? Math.round(100 * medidas.reduce((sum, n) => sum + Number(n), 0) / medidas.length) / 100
    : null;
  return { promedio, medidas: medidas.length, total: actividades.length };
}

export function coordenadas(latitud, longitud) {
  if (!latitud && !longitud) return [null, null];
  const valid = (v, max) => /^-?\d{1,3}(?:\.\d{1,6})?$/.test(v) && Math.abs(Number(v)) <= max;
  insist(valid(latitud, 90) && valid(longitud, 180), 'Selecciona un punto válido en el mapa o completa ambas coordenadas.');
  return [Number(latitud).toFixed(6), Number(longitud).toFixed(6)];
}

const personas = new Set(['usuario','autor','responsable','encargado','retiro_autor']);
const referencias = {
  persona: 'SELECT id,nombre FROM usuarios',
  documento: 'SELECT id,nombre FROM documentos',
  actividad: 'SELECT id,nombre FROM actividades',
  proyecto: 'SELECT id,nombre FROM proyectos',
  presupuesto: "SELECT id,CONCAT('Bs ',monto,' · ',fecha) nombre FROM presupuesto",
  actuacion: 'SELECT id,descripcion nombre FROM acciones_incidencia',
  version: "SELECT id,CONCAT('Publicación del ',aprobada) nombre FROM versiones_publicas",
};
const grupoDe = clave => personas.has(clave) ? 'persona' : clave==='documentos' ? 'documento' : clave;
const etiquetas = {funcion:'Función',rol:'Rol',descripcion:'Descripción',actuacion:'Actuación',observacion:'Observación',
  ubicacion:'Ubicación',codigo:'Código',revision:'Revisión',retiro_autor:'Retirado por',sha256:'Huella de integridad',
  fin_original:'Fin original',inicio_original:'Inicio original',reemplaza:'Registro rectificado'};
const internos = new Set(['id','unico_vigente','unica_activa']);
const leerVersion = json => JSON.parse(json==='NULL'||json==null ? 'null' : json) || {};

export async function nombresHistorial(q, registros) {
  const pendientes = new Map();
  for (const registro of registros) {
    for (const version of [registro.anterior, registro.nuevo]) {
      for (const [clave,valor] of Object.entries(leerVersion(version))) {
        const grupo = grupoDe(clave);
        if (!Object.hasOwn(referencias,grupo)) continue;
        for (const id of Array.isArray(valor) ? valor : [valor]) {
          if (!/^[1-9]\d*$/.test(id)) continue;
          if (!pendientes.has(grupo)) pendientes.set(grupo,new Set());
          pendientes.get(grupo).add(Number(id));
        }
      }
    }
  }
  const nombres = new Map();
  for (const [grupo, ids] of pendientes) {
    const lista = [...ids];
    for (let inicio=0; inicio<lista.length; inicio+=250) {
      const lote = lista.slice(inicio,inicio+250);
      const registros = await q(referencias[grupo]+' WHERE id IN ('+lote.map(()=>'?').join(',')+')',lote);
      for (const r of registros) nombres.set(grupo+':'+r.id,r.nombre);
    }
  }
  return nombres;
}

function describir(clave,valor,nombres) {
  if (valor==null || valor==='NULL') return 'Sin registro';
  if (Array.isArray(valor)) return valor.map(v=>describir(clave,v,nombres)).join(', ') || 'Ninguno';
  if (typeof valor==='object') return pares(valor,nombres).map(([k,v])=>k+' · '+v).join(' / ');
  const grupo = grupoDe(clave);
  if (Object.hasOwn(referencias,grupo)) {
    return nombres.get(grupo+':'+valor) || (grupo==='persona'?'Persona sin identificar':'Referencia sin identificar');
  }
  if (clave==='funcion' || clave==='rol') return roles[valor] || valor;
  if (clave==='estado') return statusLabel(valor);
  if (['activo','activa','vigente','exceso','cierre'].includes(clave)) return valor===true || String(valor)==='1' ? 'Sí' : 'No';
  if (clave==='porcentaje') return Number(valor).toLocaleString('es-BO')+' %';
  return String(valor);
}
function pares(datos,nombres) {
  return Object.entries(datos).filter(([k])=>!internos.has(k)).map(([k,v])=>[
    etiquetas[k] || (k.charAt(0).toUpperCase()+k.slice(1)).replaceAll('_',' '),
    describir(k,v,nombres)
  ]);
}
export function mostrarVersion(json,nombres) {
  return pares(leerVersion(json),nombres);
}
