import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';

export function databaseName() {
  const name = process.env.DB_NAME || 'seguimiento_potosi';
  if (!/^[a-z][a-z0-9_]{1,50}$/i.test(name)) throw new Error('Nombre de base inválido.');
  return name;
}
function command() {
  return process.env.DB_CLIENT || (process.platform === 'win32' ? 'C:/xampp/mysql/bin/mysql.exe' : 'mariadb');
}
function args(database) {
  const connection = process.env.DB_SOCKET
    ? ['--protocol=SOCKET', '--socket=' + process.env.DB_SOCKET]
    : ['--protocol=TCP', '--host=' + (process.env.DB_HOST || '127.0.0.1'), '--port=' + (process.env.DB_PORT || '3306')];
  return ['--no-defaults', ...connection, '--user=' + (process.env.DB_USER || 'root'), '--default-character-set=utf8mb4',
    '--batch', '--unbuffered', '--connect-timeout=5', '--skip-reconnect', ...(database ? ['--database=' + database] : [])];
}
function client(database) {
  return spawn(command(), args(database), {
    env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || '' },
    stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true,
  });
}
function literal(value) {
  if (value === null) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (Buffer.isBuffer(value)) return "X'" + value.toString('hex') + "'";
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') throw new Error('Tipo de parámetro SQL inválido.');
  return "CONVERT(X'" + Buffer.from(value).toString('hex') + "' USING utf8mb4)";
}
export function bind(sql, values = []) {
  const segments = sql.split('?');
  if (segments.length !== values.length + 1) throw new Error('Cantidad de parámetros SQL incorrecta.');
  return segments.reduce((query, segment, index) => query + (index ? literal(values[index - 1]) : '') + segment, '');
}
function unescapeCell(value) {
  return value.replace(/\\([nt0r\\])/g, (_, key) => ({ n: '\n', t: '\t', 0: '\0', r: '\r', '\\': '\\' })[key]);
}
function decode(lines) {
  if (!lines.length) return [];
  const headers = lines[0].split('\t');
  return lines.slice(1).map(line => Object.fromEntries(
    line.split('\t').map((value, index) => [headers[index], unescapeCell(value)]),
  ));
}

export async function runScript(sql) {
  const child = client(null);
  let stderr = '';
  child.stdout.resume();
  child.stderr.on('data', data => { stderr = (stderr + data).slice(-3000); });
  child.stdin.on('error', () => {});
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve() : reject(new Error(stderr || 'Error del cliente de base de datos.')));
    child.stdin.end(sql);
  });
}

export async function withDb(work, { transaction = false, readonly = false } = {}) {
  const child = client(databaseName());
  let pending;
  let failure;
  let stderr = '';
  const timeout = setTimeout(() => child.kill(), 35000);
  const shutdown = new Promise(resolve => child.once('close', resolve));
  child.stderr.on('data', data => { stderr = (stderr + data).slice(-3500); });
  function fail(error) {
    failure = error;
    pending?.reject(error);
    pending = undefined;
  }
  child.once('error', fail);
  child.once('close', code => {
    if (code !== 0 || pending) fail(new Error(stderr || 'Conexión de base de datos finalizada.'));
  });
  child.stdin.on('error', () => {});
  const lines = createInterface({ input: child.stdout });
  lines.on('line', line => {
    if (!pending) return;
    if (line === pending.marker && pending.lines.at(-1) === '__consulta_fin') {
      pending.lines.pop();
      const { resolve, lines: rows } = pending;
      pending = undefined;
      resolve(decode(rows));
      return;
    }
    pending.lines.push(line);
  });
  const q = (sql, values) => {
    if (failure) throw failure;
    if (pending) throw new Error('Consulte esta conexión en forma secuencial.');
    const statement = bind(sql, values);
    return new Promise((resolve, reject) => {
      const marker = randomUUID();
      pending = { resolve, reject, marker, lines: [] };
      child.stdin.write(statement + ";\nSELECT '" + marker + "' AS __consulta_fin;\n");
    });
  };
  try {
    await q("SET SESSION time_zone = '-04:00', innodb_lock_wait_timeout = 8");
    if (transaction) await q(readonly ? 'START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY' : 'START TRANSACTION');
    const result = await work(q);
    if (transaction) await q('COMMIT');
    return result;
  } catch (error) {
    if (transaction && !failure) await q('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    child.stdin.end();
    await shutdown;
    clearTimeout(timeout);
  }
}
export const rows = (sql, values) => withDb(q => q(sql, values));
export async function inserted(q) {
  return Number((await q('SELECT LAST_INSERT_ID() AS id'))[0].id);
}
export const optional = value => value === 'NULL' || value === undefined ? null : value;
