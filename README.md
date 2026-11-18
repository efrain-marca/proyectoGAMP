# Sistema Web de Seguimiento y Control de Proyectos del GAMP

Aplicación separada en una API NestJS y un cliente Angular standalone. La base SQL independiente está en `database/gamp_proyectos.sql`.

## Alcance implementado y limitaciones

La entrega implementa autenticación JWT con bcrypt y roles, administración de usuarios, CRUD de proyectos y actividades, validación de datos, relaciones TypeORM principales, persistencia MariaDB y pantallas Angular de inicio/cierre de sesión, usuarios y proyectos. El SQL define además estructuras para responsables, presupuesto, avances, cronogramas/reprogramaciones, incidencias, documentos/evidencias, alertas y trazabilidad.

**No se debe considerar terminado el sistema funcional completo solicitado:** los endpoints CRUD y lógica de servicio de presupuestos, responsables, avances físicos/financieros, cronogramas, reprogramaciones, incidencias, documentos/evidencias, alertas y trazabilidad aún no están implementados. Tampoco se implementó almacenamiento/validación de archivos, generación de reportes, historial automático/auditable ni pruebas automatizadas. Sus tablas SQL son una base de datos preparada, no una afirmación de que esas funcionalidades estén disponibles. La autorización del gasto por encima del saldo todavía requiere flujo de aprobación.

## Requisitos

- Node.js 20 o superior y npm.
- MariaDB 10.5 o superior.

## Instalación y ejecución

1. Configurar API:

   ```sh
   cd backend
   cp .env.example .env
   # Editar .env: configurar credenciales de MariaDB y un JWT_SECRET privado.
   # Ejemplo para generar una clave segura: openssl rand -hex 32
   npm install
   npm run build
   ```

   NestJS carga explícitamente `backend/.env`, sin depender de la carpeta actual desde la que se inicie. `.env.example` es solo una plantilla y no se carga directamente. Reemplaza el valor de ejemplo de `JWT_SECRET`; si falta, el servidor da un error claro. Para MariaDB, TypeORM utiliza el conector `mysql2`, que se instala junto con las dependencias. El usuario MariaDB configurado necesita permiso `CREATE DATABASE` la primera vez.

2. Iniciar la API para que cree automáticamente la base y las tablas. En una terminal, desde `backend`:

   ```sh
   npm run start:dev
   ```

   Espera a que NestJS indique que la aplicación inició correctamente. Deja esta terminal abierta.

3. Crear la cuenta inicial de administrador de forma privada (no existe registro público de administradores). Abre **otra terminal** y ejecuta:

   ```sh
   cd sistema_gamp/backend
   npm run build
   read -rp "Nombre de administrador: " ADMIN_NAME
   read -rp "Correo de administrador: " ADMIN_EMAIL
   read -rsp "Contraseña (mínimo 12 caracteres): " ADMIN_PASSWORD; echo
   export ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD
   npm run seed:admin
   unset ADMIN_NAME ADMIN_EMAIL ADMIN_PASSWORD
   ```

   Introduce un nombre, un correo válido y una contraseña de al menos 12 caracteres. La contraseña no se muestra mientras la escribes. Este comando crea un usuario con rol `ADMINISTRADOR`; no existe registro público de administradores. Si el correo ya está registrado, el script lo indicará. No reutilices la clave ilustrativa.

4. Iniciar Angular en una tercera terminal:

   ```sh
   cd sistema_gamp/frontend
   npm install
   npm start
   ```

   Abrir `http://localhost:4200` e iniciar sesión con el correo y la contraseña creados. El cliente usa `http://localhost:3000` como URL de API; cambia `API` en `frontend/src/app/core/auth.service.ts` y `data.service.ts` si la API se sirve en otra dirección. CORS de la API se ajusta mediante `FRONTEND_ORIGIN`.

Para una instalación manual alternativa, se puede importar `database/gamp_proyectos.sql`; no es necesario cuando se usa la creación automática con `DB_SYNCHRONIZE=true`.

## Compilación

```sh
cd backend && npm run build
cd ../frontend && npm run build
```

La API requiere que MariaDB esté accesible en runtime. Al iniciar, crea `DB_NAME` si no existe y, con `DB_SYNCHRONIZE=true`, TypeORM crea y sincroniza las tablas definidas por las entidades registradas en `backend/src`. No hace falta importar primero el SQL para una instalación nueva. El archivo SQL independiente se conserva para instalaciones manuales.

**Importante para producción:** `synchronize` se activa por defecto para facilitar desarrollo. Puede modificar el esquema y eliminar columnas que dejen de existir en los modelos; usa `DB_SYNCHRONIZE=false` y migraciones revisadas antes de desplegar o actualizar una base con datos reales. La compilación no valida credenciales ni disponibilidad de MariaDB.

## Endpoints implementados

Todos los endpoints salvo el login requieren `Authorization: Bearer <JWT>`.

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| POST | `/auth/login` | Público | Inicia sesión; cuerpo `{ "correo": "...", "password": "..." }` |
| GET | `/usuarios` | ADMINISTRADOR, SUPERVISOR | Listar usuarios |
| GET | `/usuarios/:id` | ADMINISTRADOR, SUPERVISOR | Consultar usuario |
| POST | `/usuarios` | ADMINISTRADOR | Crear cuenta |
| PATCH | `/usuarios/:id` | ADMINISTRADOR | Editar, cambiar rol/estado o clave |
| DELETE | `/usuarios/:id` | ADMINISTRADOR | Eliminar usuario |
| GET | `/proyectos` | Cualquier usuario autenticado | Listar proyectos |
| GET | `/proyectos/:id` | Cualquier usuario autenticado | Ver ficha y relaciones |
| POST | `/proyectos` | ADMINISTRADOR, SUPERVISOR | Registrar proyecto |
| PATCH | `/proyectos/:id` | ADMINISTRADOR, SUPERVISOR | Editar proyecto |
| DELETE | `/proyectos/:id` | ADMINISTRADOR | Eliminar proyecto |
| GET | `/actividades` | Cualquier usuario autenticado | Listar actividades |
| POST | `/actividades` | ADMINISTRADOR, SUPERVISOR, TECNICO | Crear actividad |
| PATCH | `/actividades/:id` | ADMINISTRADOR, SUPERVISOR, TECNICO | Editar actividad |
| DELETE | `/actividades/:id` | ADMINISTRADOR, SUPERVISOR | Eliminar actividad |
| GET | `/avances-fisicos` | Usuario autenticado | Historial de avances físicos |
| POST | `/avances-fisicos` | ADMINISTRADOR, SUPERVISOR, TECNICO | Registrar avance físico |
| GET | `/avances-financieros` | Usuario autenticado | Historial de ejecución financiera |
| POST | `/avances-financieros` | ADMINISTRADOR, SUPERVISOR, TECNICO | Registrar ejecución; exceder presupuesto requiere rol ADMINISTRADOR |
| GET | `/alertas` | Usuario autenticado | Actividades vencidas y con avance menor al 100% |
| GET | `/reportes/proyectos` | Usuario autenticado | Presupuesto, ejecución y porcentaje financiero por proyecto |

## Notas de seguridad

- Los hashes de contraseña se generan con bcrypt (factor 12) y nunca se seleccionan en las respuestas ordinarias.
- El JWT secret es obligatorio; no usar valores de ejemplo en despliegues.
- `JWT_EXPIRES_IN` define la expiración del JWT como segundos (por defecto, 28800 = 8 horas).
- Configurar HTTPS, secretos administrados y respaldos de base de datos antes de operar en producción.
- El token del cliente se conserva en `localStorage`; para una instalación productiva se recomienda migrar a cookies `HttpOnly`, `Secure`, `SameSite` y definir protección CSRF.
- `npm audit --omit=dev` no reportó vulnerabilidades de severidad alta en dependencias runtime; el backend sí reportó 3 moderadas transitivas (`glob`/`minimatch` bajo TypeORM 0.3.31). No se forzó una actualización mayor de TypeORM. Revisar y actualizar dependencias antes de producción.
