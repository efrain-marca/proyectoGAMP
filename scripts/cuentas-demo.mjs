import { hashPassword, passwordMatches } from '../src/lib/auth.mjs';
import { inserted } from '../src/lib/db.mjs';

export const claveDemo = 'gustavo12345';
export const cuentasDemo = {
  admin:      {correo:'admin123@gmail.com',nombre:'Administración Demo'},
  supervisor: {correo:'supervisor123@gmail.com',nombre:'Marcos Rojas'},
  tecnico:    {correo:'encargado123@gmail.com',nombre:'Diego Pacheco'},
  finanzas:   {correo:'presupuesto123@gmail.com',nombre:'Camila Flores'},
};

export async function prepararCuentas(q) {
  const ids = {};
  for (const [rol,{correo,nombre}] of Object.entries(cuentasDemo)) {
    const anterior = rol+'@potosi.test';
    const registros = await q('SELECT id,rol,correo,clave,activo FROM usuarios WHERE correo IN (?,?) ORDER BY id FOR UPDATE',[anterior,correo]);
    if (!registros.length) {
      await q('INSERT INTO usuarios (nombre,correo,clave,rol) VALUES (?,?,?,?)',[nombre,correo,await hashPassword(claveDemo),rol]);
      ids[rol] = await inserted(q);
      continue;
    }
    const [cuenta] = registros;
    if (registros.length!==1 || cuenta.rol!==rol || cuenta.activo!=='1') {
      throw new Error('Revisa las cuentas de '+rol+' en Usuarios. Existe un conflicto de correo, rol o estado.');
    }
    ids[rol] = Number(cuenta.id);
    if (cuenta.correo.toLowerCase()===correo) {
      if (!await passwordMatches(claveDemo,cuenta.clave)) throw new Error('El correo '+correo+' ya pertenece a otra cuenta o tiene una clave distinta. Revisa Usuarios.');
      continue;
    }
    await q('UPDATE usuarios SET correo=?,clave=? WHERE id=?',[correo,await hashPassword(claveDemo),ids[rol]]);
    await q('DELETE FROM sesiones WHERE usuario=?',[ids[rol]]);
  }
  return ids;
}
