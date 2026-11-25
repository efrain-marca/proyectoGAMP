import { rows, withDb, optional } from './db.mjs';
import { today, addDays, operating, insist } from './rules.mjs';

import { nombresHistorial } from './seguimiento.mjs';

export function scope(account, alias='p') {
  if (!operating.includes(account.rol)) return {sql:'1=1', params:[]};
  return {sql:'EXISTS (SELECT 1 FROM responsables ac WHERE ac.proyecto='+alias+'.id AND ac.usuario=? AND ac.funcion=? AND ac.inicio<=? AND ac.fin>=?)',
    params:[Number(account.id),account.rol,today(),today()]};
}
export async function projectAccess(q, account, projectId, lock=false) {
  const [project] = await q('SELECT * FROM proyectos WHERE id=?'+(lock?' FOR UPDATE':''),[projectId]);
  insist(project,'El proyecto no está disponible.',404);
  if (operating.includes(account.rol)) {
    const [permission] = await q('SELECT id FROM responsables WHERE proyecto=? AND usuario=? AND funcion=? AND inicio<=? AND fin>=?'+(lock?' FOR UPDATE':''),[projectId,Number(account.id),account.rol,today(),today()]);
    insist(permission,'El proyecto no está disponible.',404);
  }
  return project;
}
export const canReadHistory = role => ['admin','supervisor'].includes(role);
const pattern = text => '%'+text.replace(/[!%_]/g, c=>'!'+c)+'%';
const progress = '(SELECT f.porcentaje FROM avances_fisicos f WHERE a.id=f.actividad AND f.vigente=1 ORDER BY f.corte DESC,f.id DESC LIMIT 1)';
export async function listProjects(account,{term='',state='',page=1}={}) {
  const {sql,params}=scope(account);
  return rows('SELECT p.*,(SELECT COUNT(*) FROM actividades a WHERE a.proyecto=p.id) AS actividades FROM proyectos p WHERE '+sql+
    " AND (?='' OR p.estado=?) AND CONCAT_WS(' ',p.codigo,p.nombre,p.ubicacion) LIKE ? ESCAPE '!' ORDER BY p.creado DESC,p.id DESC LIMIT 21 OFFSET ?",
    [...params,state,state,pattern(term),(page-1)*20]);
}
export async function actividadesRecientes(account, proyectos) {
  if (!proyectos.length) return new Map();
  const acceso = scope(account);
  const ids = proyectos.map(p=>Number(p.id));
  const registros = await rows('SELECT a.proyecto,'+progress+' porcentaje FROM actividades a JOIN proyectos p ON p.id=a.proyecto WHERE '+acceso.sql+' AND p.id IN ('+ids.map(()=>'?').join(',')+')',[...acceso.params,...ids]);
  const porProyecto = new Map();
  for (const r of registros) {
    if (!porProyecto.has(r.proyecto)) porProyecto.set(r.proyecto,[]);
    porProyecto.get(r.proyecto).push(r);
  }
  return porProyecto;
}
export async function totals(account) {
  const scopeA=scope(account,'ap'), scopeP=scope(account);
  const [result]=await rows("SELECT COUNT(*) total,COALESCE(SUM(p.estado='ejecucion'),0) ejecucion,COALESCE(SUM(p.estado='concluido'),0) concluido,"+
    '(SELECT COUNT(*) FROM actividades a JOIN proyectos ap ON ap.id=a.proyecto WHERE '+scopeA.sql+" AND ap.estado<>'concluido' AND a.fin<? AND COALESCE("+progress+',0)<100) vencidas FROM proyectos p WHERE '+scopeP.sql,
    [...scopeA.params,today(),...scopeP.params]);
  return result;
}
export async function projectInfo(account, projectId, tab, filters={}) {
  return withDb(async q=>{
    const project=await projectAccess(q,account,projectId);
    const data={project};
    if (['resumen','equipo','cronograma','incidencias'].includes(tab)) data.team=await q('SELECT r.*,u.nombre,u.activo FROM responsables r JOIN usuarios u ON u.id=r.usuario WHERE r.proyecto=? ORDER BY r.inicio DESC,r.id DESC',[projectId]);
    if (tab==='equipo' && account.rol==='admin') data.candidates=await q("SELECT id,nombre,rol FROM usuarios WHERE activo=1 AND rol IN ('tecnico','finanzas','supervisor') ORDER BY nombre");
    if (['resumen','cronograma','avances','alertas'].includes(tab)) data.activities=await q('SELECT a.*,u.nombre persona,'+progress+' porcentaje FROM actividades a JOIN usuarios u ON u.id=a.responsable WHERE a.proyecto=? ORDER BY a.inicio,a.id',[projectId]);
    if (tab==='cronograma') data.schedules=await q('SELECT r.*,a.nombre,u.nombre persona FROM reprogramaciones r JOIN actividades a ON a.id=r.actividad JOIN usuarios u ON u.id=r.autor WHERE a.proyecto=? ORDER BY r.id DESC',[projectId]);
    if (['resumen','presupuesto','avances'].includes(tab)) data.budgets=await q('SELECT b.*,u.nombre persona FROM presupuesto b JOIN usuarios u ON u.id=b.autor WHERE b.proyecto=? ORDER BY b.fecha DESC,b.id DESC',[projectId]);
    if (['resumen','avances'].includes(tab)) data.financial=await q('SELECT f.*,u.nombre persona,b.monto referencia FROM avances_financieros f JOIN usuarios u ON u.id=f.autor JOIN presupuesto b ON b.id=f.presupuesto WHERE f.proyecto=? ORDER BY f.corte DESC,f.id DESC',[projectId]);
    if (tab==='avances') data.physical=await q('SELECT f.*,a.nombre,u.nombre persona FROM avances_fisicos f JOIN actividades a ON a.id=f.actividad JOIN usuarios u ON u.id=f.autor WHERE a.proyecto=? AND (? IS NULL OR a.id=?) AND f.corte BETWEEN ? AND ? ORDER BY f.corte DESC,f.id DESC',[projectId,filters.activity||null,filters.activity||null,filters.from||'1900-01-01',filters.until||today()]);
    if (['documentos','resumen','cronograma','presupuesto','avances','incidencias','publicacion','obra'].includes(tab)) data.docs=await q('SELECT d.id,d.nombre,d.descripcion,d.tipo,d.bytes,d.anterior,d.vigente,d.fecha,d.motivo,u.nombre persona FROM documentos d JOIN usuarios u ON u.id=d.autor WHERE d.proyecto=? ORDER BY d.id DESC',[projectId]);
    if (tab==='obra') data.work=await q('SELECT o.*,u.nombre persona FROM inspecciones_obra o JOIN usuarios u ON u.id=o.autor WHERE o.proyecto=? ORDER BY o.fecha DESC,o.id DESC',[projectId]);
    if (tab==='cronograma') data.extensions=await q("SELECT h.*,u.nombre persona FROM historial h JOIN usuarios u ON u.id=h.autor WHERE h.proyecto=? AND h.entidad='Ampliación' ORDER BY h.id DESC",[projectId]);
    if (tab==='incidencias') {
      data.incidents=await q('SELECT i.*,u.nombre persona FROM incidencias i JOIN usuarios u ON u.id=i.responsable WHERE i.proyecto=? ORDER BY i.id DESC',[projectId]);
      data.actions=await q('SELECT a.*,u.nombre persona FROM acciones_incidencia a JOIN incidencias i ON i.id=a.incidencia JOIN usuarios u ON u.id=a.autor WHERE i.proyecto=? ORDER BY a.id DESC',[projectId]);
    }
    if (tab==='alertas') {
      data.alerts=await q('SELECT t.*,a.nombre,u.nombre persona FROM alertas t JOIN actividades a ON a.id=t.actividad JOIN usuarios u ON u.id=a.responsable WHERE a.proyecto=? ORDER BY t.id DESC',[projectId]);
      data.conditions=data.activities.filter(a=>project.estado!=='concluido' && a.fin<=addDays(today(),7) && Number(optional(a.porcentaje)??0)<100);
    }
    if (tab==='historial') {
      insist(canReadHistory(account.rol),'Tu rol no puede consultar el historial detallado.',403);
      data.history=await q("SELECT h.*,u.nombre persona FROM historial h JOIN usuarios u ON u.id=h.autor WHERE h.proyecto=? AND (?='' OR h.entidad=?) AND (? IS NULL OR h.autor=?) AND h.fecha>=? AND h.fecha<DATE_ADD(?,INTERVAL 1 DAY) ORDER BY h.id DESC LIMIT 101 OFFSET ?",
        [projectId,filters.entity||'',filters.entity||'',filters.author||null,filters.author||null,filters.from||'1900-01-01',filters.until||today(),((filters.page||1)-1)*100]);
      data.nombres=await nombresHistorial(q,data.history);
      data.authors=await q('SELECT DISTINCT u.id,u.nombre FROM historial h JOIN usuarios u ON u.id=h.autor WHERE h.proyecto=? ORDER BY u.nombre',[projectId]);
      data.entities=await q('SELECT DISTINCT entidad FROM historial WHERE proyecto=? ORDER BY entidad',[projectId]);
    }
    if (tab==='publicacion') {
      insist(account.rol==='admin','Tu rol no puede consultar versiones públicas internas.',403);
      data.publications=await q('SELECT v.id,v.ficha,v.activa,v.aprobada,v.retirada,v.motivo,u.nombre persona FROM versiones_publicas v JOIN usuarios u ON u.id=v.autor WHERE v.proyecto=? ORDER BY v.id DESC',[projectId]);
      data.publicationFiles=await q('SELECT p.documento FROM archivos_publicos p JOIN versiones_publicas v ON v.id=p.version WHERE v.proyecto=? AND v.activa=1',[projectId]);
    }
    if (['resumen','historial'].includes(tab)) data.changes=await q('SELECT c.*,u.nombre persona FROM cambios_estado c JOIN usuarios u ON u.id=c.autor WHERE c.proyecto=? ORDER BY c.id DESC',[projectId]);
    return data;
  },{transaction:true,readonly:true});
}
export async function publicList(term,state,page=1) {
  const result=await rows("SELECT v.proyecto,v.ficha,v.aprobada FROM versiones_publicas v WHERE v.activa=1 AND (?='' OR JSON_UNQUOTE(JSON_EXTRACT(v.ficha,'$.estado'))=?) AND CONCAT_WS(' ',JSON_UNQUOTE(JSON_EXTRACT(v.ficha,'$.nombre')),JSON_UNQUOTE(JSON_EXTRACT(v.ficha,'$.ubicacion')),JSON_UNQUOTE(JSON_EXTRACT(v.ficha,'$.codigo'))) LIKE ? ESCAPE '!' ORDER BY v.aprobada DESC,v.id DESC LIMIT 22 OFFSET ?",[state,state,pattern(term),(page-1)*21]);
  return result.map(row=>({...row,ficha:JSON.parse(row.ficha)}));
}
export async function publicProject(projectId) {
  return withDb(async q=>{
    const [version]=await q('SELECT id,ficha,aprobada FROM versiones_publicas WHERE proyecto=? AND activa=1',[projectId]);
    insist(version,'La ficha pública no está disponible.',404);
    const files=await q('SELECT d.id,d.nombre,d.descripcion,d.bytes FROM archivos_publicos p JOIN documentos d ON d.id=p.documento WHERE p.version=? ORDER BY d.id',[Number(version.id)]);
    return {...version,ficha:JSON.parse(version.ficha),files};
  },{transaction:true,readonly:true});
}
export async function documentDownload(projectId,documentId,account) {
  return withDb(async q=>{
    let file;
    if (account) {
      await projectAccess(q,account,projectId);
      [file]=await q('SELECT nombre,tipo,bytes,sha FROM documentos WHERE id=? AND proyecto=?',[documentId,projectId]);
    } else {
      [file]=await q('SELECT d.nombre,d.tipo,d.bytes,d.sha FROM versiones_publicas v JOIN archivos_publicos a ON a.version=v.id JOIN documentos d ON d.id=a.documento WHERE v.activa=1 AND v.proyecto=? AND d.id=? AND d.proyecto=v.proyecto',[projectId,documentId]);
    }
    insist(file,'El documento no está disponible.',404);
    const pieces=await q('SELECT HEX(datos) hex FROM archivo_partes WHERE documento=? ORDER BY numero',[documentId]);
    return {...file,data:Buffer.concat(pieces.map(row=>Buffer.from(row.hex,'hex')))};
  },{transaction:true,readonly:true});
}
