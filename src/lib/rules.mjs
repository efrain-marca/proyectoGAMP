export const roles = {
  admin: 'Administrador', tecnico: 'Encargado de proyecto',
  finanzas: 'Encargado de presupuesto', supervisor: 'Supervisor',
};
export const states = { planificado: 'Planificado', ejecucion: 'En ejecución', suspendido: 'Suspendido', concluido: 'Concluido' };
export const operating = ['tecnico', 'finanzas', 'supervisor'];
export const transitions = {
  planificado: ['ejecucion', 'suspendido'],
  ejecucion: ['suspendido', 'concluido'],
  suspendido: ['ejecucion'],
  concluido: [],
};
export const access = {
  create_project: ['admin'], edit_project: ['admin'], user: ['admin'],
  assign: ['admin'], state: ['admin'], activity: ['admin'], schedule: ['admin'], extension: ['admin'],
  document: ['tecnico'], physical: ['tecnico'], work: ['supervisor'],
  budget: ['finanzas','admin'], financial: ['finanzas'],
  incident: ['finanzas'], incident_action: ['finanzas'],
  alert: ['admin'], publish: ['admin'], withdraw: ['admin'],
};
export const statusLabel = value => states[value] || ({ pendiente:'Pendiente', atencion:'En atención', resuelta:'Resuelta', abierta:'Abierta', atendida:'Atendida', cerrada:'Cerrada', vencida:'Vencida', proxima:'Próxima', '0':'No', '1':'Sí' })[value] || value;
export const today = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export const addDays = (value, days) => {
  const d = new Date(value + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0,10);
};
export class Issue extends Error {
  constructor(message, status = 422) { super(message); this.status = status; }
}
export const insist = (condition, message, status) => { if (!condition) throw new Issue(message, status); };
export const allowed = (role, action) => Object.hasOwn(access,action) && access[action].includes(role);
export const isDate = value => {
  if (typeof value !== 'string' || !/^(19|20|21)\d\d-\d\d-\d\d$/.test(value)) return false;
  const parsed = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(+parsed) && parsed.toISOString().slice(0, 10) === value;
};
export function period(start, end, { min, max } = {}) {
  insist(isDate(start) && isDate(end), 'Introduce fechas válidas.');
  insist(start <= end, 'La fecha de fin debe ser igual o posterior al inicio.');
  if (min) insist(start >= min, 'El inicio debe ser el ' + min + ' o posterior.');
  if (max) insist(end <= max, 'La fecha de fin excede ' + max + '.');
}
export function id(value, label = 'registro') {
  insist(typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 4294967295, 'Selecciona un ' + label + ' válido.');
  return Number(value);
}
export function input(form) {
  function text(key, label, { min = 1, max = 500, required = true } = {}) {
    const value = form.get(key);
    if (value == null && !required) return '';
    insist(typeof value === 'string', 'Completa ' + label + '.');
    const result = value.normalize('NFC').trim();
    if (key === 'nombre') {
      insist(/^\p{L}+(?: +\p{L}+)*$/u.test(result), 'El nombre solo admite letras y espacios. Puedes usar tildes y ñ.');
    }
    insist((!required && !result) || (result.length >= min && result.length <= max
      && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(result)), label + ' debe tener entre ' + min + ' y ' + max + ' caracteres.');
    return result;
  }
  return {
    text,
    id: (key, label, required = true) => (!required && !form.get(key)) ? null : id(form.get(key), label),
    date(key, label, { min, max } = {}) {
      const value = form.get(key);
      insist(isDate(value), 'Introduce una fecha válida en ' + label + '.');
      if (min) insist(value >= min, label + ' debe ser el ' + min + ' o posterior.');
      if (max) insist(value <= max, label + ' debe ser el ' + max + ' o anterior.');
      return value;
    },
    pick(key, variants, label) {
      const value = form.get(key);
      insist(variants.includes(value), 'Selecciona ' + label + ' válido.');
      return value;
    },
    decimal(key, label, { digits = 13, max } = {}) {
      const value = text(key, label, { max: digits + 3 }).replace(',', '.');
      insist(new RegExp('^\\d{1,' + digits + '}(?:\\.\\d{1,2})?$').test(value), label + ' debe ser un número no negativo con hasta dos decimales.');
      const [integer, decimals = ''] = value.split('.');
      const fixed = String(Number(integer)) + '.' + decimals.padEnd(2, '0');
      if (max != null) insist(Number(fixed) <= max, label + ' debe estar entre 0 y ' + max + '.');
      return fixed;
    },
    checked(key) {
      const value=form.get(key);
      insist(value===null || value==='0' || value==='1','Valor de confirmación inválido.');
      return value==='1';
    },
  };
}
export const money = value => value == null || value === 'NULL' ? 'Sin registro' : 'Bs ' + new Intl.NumberFormat('es-BO', { minimumFractionDigits:2, maximumFractionDigits:2 }).format(Number(value));
export const dateLabel = value => value && value !== 'NULL' ? value.slice(0,10).split('-').reverse().join('/') : '—';
export function mail(value) {
  const result = value.trim().toLowerCase();
  insist(result.length <= 190 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result), 'Introduce un correo válido.');
  return result;
}
export function password(value) {
  insist(typeof value === 'string' && value.length >= 12 && value.length <= 128, 'La contraseña debe tener de 12 a 128 caracteres.');
  return value;
}
