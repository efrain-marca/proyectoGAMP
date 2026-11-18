import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'node:path';
import { Actividad } from './actividades/actividad.entity';
import { AvanceFinanciero } from './avances-financieros/avance-financiero.entity';
import { AvanceFisico } from './avances-fisicos/avance-fisico.entity';
import { AuthModule } from './auth/auth.module';
import { Presupuesto } from './presupuestos/presupuesto.entity';
import { Proyecto } from './proyectos/proyecto.entity';
import { Responsable } from './responsables/responsable.entity';
import { Usuario } from './usuarios/usuario.entity';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { ActividadesModule } from './actividades/actividades.module';
import { SeguimientoModule } from './seguimiento/seguimiento.module';
import { ensureDatabaseExists } from './database/ensure-database';
import { Cronograma } from './cronogramas/cronograma.entity';
import { Reprogramacion } from './cronogramas/reprogramacion.entity';
import { ModificacionPresupuestaria } from './presupuestos/modificacion-presupuestaria.entity';
import { Incidencia } from './incidencias/incidencia.entity';
import { Documento } from './documentos/documento.entity';
import { Evidencia } from './evidencias/evidencia.entity';
import { Alerta } from './alertas/alerta.entity';
import { Trazabilidad } from './trazabilidad/trazabilidad.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(__dirname, '..', '.env'),
      validate: (environment) => {
        const secret = environment.JWT_SECRET;
        if (typeof secret !== 'string' || secret.length === 0) {
          throw new Error('No se encontró JWT_SECRET. Cree backend/.env copiando backend/.env.example y configure esa variable.');
        }
        if (secret.length < 32 || secret === 'replace-with-a-long-random-secret') {
          throw new Error('JWT_SECRET no es seguro. Reemplace el valor de ejemplo por uno aleatorio de al menos 32 caracteres.');
        }
        return environment;
      },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        await ensureDatabaseExists(config);
        return {
          type: 'mariadb' as const,
          connectorPackage: 'mysql2' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get<string>('DB_PORT', '3306')),
          username: config.get<string>('DB_USER', 'root'),
          password: config.get<string>('DB_PASSWORD', ''),
          database: config.get<string>('DB_NAME', 'gamp_proyectos'),
          entities: [
            Usuario, Proyecto, Actividad, Responsable, Presupuesto, ModificacionPresupuestaria,
            AvanceFisico, AvanceFinanciero, Cronograma, Reprogramacion, Incidencia,
            Documento, Evidencia, Alerta, Trazabilidad,
          ],
          synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
          autoLoadEntities: true,
        };
      },
    }),
    UsuariosModule,
    AuthModule,
    ProyectosModule,
    ActividadesModule,
    SeguimientoModule,
  ],
})
export class AppModule {}
