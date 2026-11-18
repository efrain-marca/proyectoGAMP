import { ConfigService } from '@nestjs/config';
import { createConnection } from 'mysql2/promise';

export async function ensureDatabaseExists(config: ConfigService): Promise<void> {
  const database = config.get<string>('DB_NAME', 'gamp_proyectos');
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error('DB_NAME solo puede contener letras, números y guion bajo.');
  }

  const connection = await createConnection({
    host: config.get<string>('DB_HOST', 'localhost'),
    port: Number(config.get<string>('DB_PORT', '3306')),
    user: config.get<string>('DB_USER', 'root'),
    password: config.get<string>('DB_PASSWORD', '123456'),
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
}
