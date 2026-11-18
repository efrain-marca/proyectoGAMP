import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../usuarios/usuario.entity';
import { UserRole } from '../common/roles';

async function seedAdmin(): Promise<void> {
  const { DB_HOST = 'localhost', DB_PORT = '3306', DB_USER = 'root', DB_PASSWORD = '', DB_NAME = 'gamp_proyectos' } = process.env;
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Defina ADMIN_NAME, ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres)');
  }
  const source = new DataSource({ type: 'mariadb', host: DB_HOST, port: Number(DB_PORT), username: DB_USER, password: DB_PASSWORD, database: DB_NAME, entities: [Usuario] });
  await source.initialize();
  try {
    const repo = source.getRepository(Usuario);
    if (await repo.existsBy({ correo: ADMIN_EMAIL })) throw new Error('Ya existe una cuenta con ese correo');
    await repo.save(repo.create({ nombre: ADMIN_NAME, correo: ADMIN_EMAIL, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), rol: UserRole.ADMINISTRADOR, activo: true }));
    console.log(`Administrador creado: ${ADMIN_EMAIL}`);
  } finally {
    await source.destroy();
  }
}

void seedAdmin().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
