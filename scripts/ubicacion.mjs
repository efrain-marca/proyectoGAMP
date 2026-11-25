import { readFile } from 'node:fs/promises';
import { databaseName, runScript } from '../src/lib/db.mjs';

const schema = await readFile(new URL('../database/03-ubicacion.sql', import.meta.url), 'utf8');
await runScript('USE '+databaseName()+';\n'+schema);
console.log('Columnas de ubicación disponibles en '+databaseName()+'.');
