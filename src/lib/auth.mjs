import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { rows, withDb } from './db.mjs';
import { Issue, mail, roles } from './rules.mjs';
const derive = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const fake = '00000000000000000000000000000000:' + '0'.repeat(128);
export async function hashPassword(value) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + (await derive(value, salt, 64)).toString('hex');
}
export async function passwordMatches(password, stored) {
  const [salt, key] = stored.split(':');
  const actual = await derive(typeof password === 'string' && password.length <= 128 ? password : '', salt, 64);
  const expected = Buffer.from(key, 'hex');
  return expected.length===actual.length && timingSafeEqual(actual,expected);
}
export function tokenOf(context) { return context.cookies.get('pm_session')?.value; }
export function writeCookie(context, name, value, maxAge) {
  context.cookies.set(name, value, { httpOnly: true, maxAge, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', path: '/' });
}
export async function viewer(context) {
  const token = tokenOf(context);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [account] = await rows('SELECT u.id,u.nombre,u.correo,u.rol FROM sesiones s JOIN usuarios u ON u.id=s.usuario WHERE s.token=? AND s.vence>NOW() AND u.activo=1', [digest(token)]);
  return account && Object.hasOwn(roles, account.rol) ? account : null;
}
export async function login(context, form) {
  let email;
  const password = form.get('password');
  try { email = mail(String(form.get('email') || '')); } catch { email = ''; }
  const address = (() => { try { return context.clientAddress; } catch { return 'local'; } })();
  const identity = digest('account:' + email);
  const ip = digest('ip:' + address);
  const outcome = await withDb(async q => {
    await q('DELETE FROM intentos WHERE vence<=NOW()');
    for (const key of [identity, ip].sort()) {
      await q('INSERT INTO intentos (clave,cantidad,vence) VALUES (?,1,DATE_ADD(NOW(),INTERVAL 15 MINUTE)) ON DUPLICATE KEY UPDATE cantidad=LEAST(cantidad+1,65535)', [key]);
    }
    const attempts = await q('SELECT clave,cantidad FROM intentos WHERE clave IN (?,?)', [identity,ip]);
    if (attempts.some(row => Number(row.cantidad) > (row.clave === identity ? 8 : 35))) return { limited:true };
    const [account] = await q('SELECT id,activo,clave,rol FROM usuarios WHERE correo=? FOR UPDATE', [email]);
    const valid = await passwordMatches(password,account?.clave || fake);
    if (!valid || account?.activo !== '1' || !Object.hasOwn(roles,account.rol)) return {};
    const token = randomBytes(32).toString('hex');
    const previous = tokenOf(context);
    if (previous && /^[a-f0-9]{64}$/.test(previous)) await q('DELETE FROM sesiones WHERE token=? AND usuario=?', [digest(previous),Number(account.id)]);
    await q('DELETE FROM sesiones WHERE usuario=? AND vence<=NOW()', [Number(account.id)]);
    await q('DELETE FROM intentos WHERE clave=?', [identity]);
    await q('UPDATE intentos SET cantidad=GREATEST(cantidad-1,0) WHERE clave=?', [ip]);
    await q('INSERT INTO sesiones (token,usuario,vence) VALUES (?,?,DATE_ADD(NOW(),INTERVAL 8 HOUR))', [digest(token), Number(account.id)]);
    return {token};
  }, {transaction:true});
  if (outcome.limited) throw new Issue('Demasiados intentos. Vuelve a intentar en unos minutos.', 429);
  if (!outcome.token) throw new Issue('Correo o contraseña incorrectos, o cuenta inactiva.', 401);
  writeCookie(context, 'pm_session', outcome.token, 28800);
}
export async function logout(context) {
  const token = tokenOf(context);
  if (token && /^[a-f0-9]{64}$/.test(token)) await rows('DELETE FROM sesiones WHERE token=?', [digest(token)]);
  writeCookie(context, 'pm_session', '', 0);
}
export async function verifySession(context, q, account) {
  const [user] = await q('SELECT id,activo,rol FROM usuarios WHERE id=? FOR UPDATE', [Number(account.id)]);
  const token = tokenOf(context);
  const [session] = await q('SELECT usuario FROM sesiones WHERE token=? AND usuario=? AND vence>NOW() FOR UPDATE', [digest(token || ''), Number(account.id)]);
  if (!session || user?.activo !== '1' || user.rol !== account.rol) throw new Issue('La sesión cambió o venció. Vuelve a iniciar sesión.', 401);
}
