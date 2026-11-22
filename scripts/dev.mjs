import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const { dev } = await import('astro');
await dev({ server: { host: process.env.HOST || '127.0.0.1', port: Number(process.env.PORT || 4321) } });
