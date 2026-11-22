# Sistema de Seguimiento de Proyectos Municipales
## Potosí · Práctica universitaria

Aplicación web con **Astro 7, Node.js y MariaDB de XAMPP**. Incluye un panel interno, un portal de consulta pública y un módulo de informes PDF. Los proyectos, personas y documentos incluidos en la demostración son ficticios.

## 1. Instalar en Windows con XAMPP

1. Instala Node.js **22.22.0 o superior**. Abre XAMPP y pulsa **Start** en **MySQL**. El panel de XAMPP usa ese nombre para el servicio de base de datos.
2. Descomprime el ZIP y abre una terminal PowerShell dentro de la carpeta del proyecto.
3. Ejecuta lo siguiente.

   ```powershell
   npm install
   Copy-Item .env.example .env
   npm run db:init -- --demo
   npm run dev
   ```

4. Abre [http://127.0.0.1:4321](http://127.0.0.1:4321). Pulsa **Acceso municipal** para entrar.

El archivo `.env` apunta a `C:/xampp/mysql/bin/mysql.exe`, host `127.0.0.1` y puerto `3306`. Ajusta `DB_CLIENT`, `DB_PORT`, `DB_USER` y `DB_PASSWORD` a tu instalación. Usa barras normales en la ruta del cliente en Windows, como en el ejemplo. Con MySQL/MariaDB activo, Apache es opcional para ejecutar Astro. En Linux puedes configurar `DB_CLIENT=mariadb` si tienes el cliente en el `PATH`, o indicar la ruta del cliente instalado.

**Arranque compilado**

```powershell
npm run build
npm start
```

**Base sin proyectos ficticios.** Ejecuta `npm run db:init` sobre una base nueva para crear solamente la cuenta de administración. El instalador muestra la contraseña aleatoria inicial. Puedes establecer `PM_ADMIN_PASSWORD` en `.env`. El instalador conserva las cuentas y los datos existentes. Para generar una base independiente, cambia `DB_NAME` antes de inicializarla. El esquema está en `database/01-esquema.sql` y usa InnoDB y `utf8mb4`.

## 2. Credenciales de demostración

Usa la contraseña `Demo-Potosi#2026` con cualquiera de estas cuentas. El instalador las crea con la opción `--demo` sobre una base sin usuarios.

| Rol | Correo | Funciones en la demostración |
| --- | --- | --- |
| Administrador | `admin@potosi.test` | Usuarios, proyectos, encargados, cronogramas, ampliaciones, informes PDF y publicaciones |
| Encargado de proyecto | `tecnico@potosi.test` | Avances físicos con documento de respaldo y gestión de documentos |
| Encargado de presupuesto | `finanzas@potosi.test` | Presupuestos, ejecución financiera e incidentes internos |
| Supervisor | `supervisor@potosi.test` | Inspecciones de obra con fecha de visita, observación y respaldo |

Los encargados y supervisores acceden a proyectos con asignación vigente. La ciudadanía consulta la versión pública aprobada.

**Actualizar la entrega anterior.** Usa tu archivo `.env` con la base existente y ejecuta `npm run db:init` y `npm run build` antes de arrancar con `npm start`. Las cuentas de roles anteriores que ya no figuran en el diagrama requieren que un administrador les asigne uno de los cuatro roles actuales. Los registros conservan su autor histórico.

## 3. Recorrido de demostración

El PDF de ejemplo está en la carpeta ejemplo.

1. **Administrador.** Entra a **Informes PDF**. Elige **Avances físicos y financieros**, selecciona `POT-DEMO-001` y pulsa **Ver vista previa** o **Descargar PDF**. También puedes descargar un informe consolidado, de presupuesto, cronograma, equipo, incidencias, documentos, historial, alertas, inspecciones de obra o publicaciones.
2. **Administrador.** Abre `POT-DEMO-002`, entra a **Equipo** e intenta asignar al supervisor Marcos Rojas durante un intervalo que coincida con su asignación en `POT-DEMO-001`. El sistema indica qué periodo ya está ocupado.
3. **Encargado de proyecto.** Abre el proyecto en ejecución, registra un avance con su documento de respaldo y rectifícalo con un motivo. Para registrar una inspección, ingresa como Supervisor y abre la pestaña Obra.
4. **Portal ciudadano.** Cierra sesión, consulta las fichas publicadas y descarga una evidencia aprobada. Desde la cuenta de administración puedes retirar la ficha y comprobar que el enlace al documento deja de estar disponible.

## 4. Criterios y validaciones

Los nombres de personas, proyectos y actividades admiten letras y espacios, con tildes y ñ. El formulario, la API y la base de datos comprueban ese formato. Los códigos, importes, fechas y nombres de archivo tienen reglas propias. La ampliación requiere un plazo posterior al vigente y un respaldo. Una inspección requiere una fecha ya ocurrida dentro de la asignación del supervisor. El servidor verifica permisos y pertenencia al proyecto antes de guardar.

| Historias | Implementación |
| --- | --- |
| HU-PM-001 a 004 | Cuentas con correo único y contraseña protegida, sesiones revocables, fichas con código único y asignaciones con periodos y relevos trazables. Los solapamientos se comprueban con ambos extremos incluidos. La transacción bloquea la fila de la cuenta del supervisor durante una asignación, de modo que otra solicitud para la misma persona deba esperar antes de comprobar el calendario. |
| HU-PM-005 a 008 | Fechas coherentes y dentro del proyecto, respaldo para reprogramaciones, presupuesto con versiones, avances físicos de 0 a 100 y un acumulado financiero por mes. Las rectificaciones conservan la versión previa y deben ser coherentes con los cortes contiguos. Los excesos presupuestarios se registran con confirmación expresa. Si el presupuesto es cero, el porcentaje se informa como no calculable. |
| HU-PM-009 a 012 | Archivos de hasta 10 MB con firma y extensión de PDF, JPG o PNG, verificación de integridad, accesos controlados y respaldo en registros pertinentes. Las incidencias internas tienen actuaciones y resolución documentada. El historial conserva autor, fecha, motivo y valores anterior y registrado. La sección de alertas muestra las condiciones vigentes y permite registrar su atención. |
| HU-PM-013 | Vista previa y descarga de un PDF con tipo de informe, fecha de corte, fecha de emisión, autor y filtros. Los datos se consultan en los registros existentes. El consolidado presenta el avance por actividad y señala los datos sin registro. En informes históricos los avances aplican la rectificación vigente del corte correspondiente. |
| HU-PM-014 a 016 | Consulta ciudadana desde una versión aprobada, control de sus archivos públicos, retiro de la ficha y cambios de estado justificados con historial. Para concluir, todas las actividades deben estar al 100 % y las incidencias resueltas. |

Las altas con fechas de planificación y las asignaciones nuevas comienzan de hoy en adelante. Los cortes, respaldos y hechos ya ocurridos pueden registrarse con su fecha real dentro de los límites de cada módulo. Una asignación ocupa días completos. El sistema toma la fecha de Bolivia como referencia.

## 5. Estructura y comprobaciones

- **Pantallas Astro** — `src/pages/` y `src/components/`.
- **Autenticación, reglas y acceso a MariaDB** — `src/lib/`. El backend utiliza el cliente incluido en XAMPP.
- **Informes institucionales** — `src/lib/reports.mjs` y `src/lib/pdf.mjs`.
- **Esquema y datos ficticios** — `database/01-esquema.sql` y `scripts/setup.mjs`.

Ejecuta `npm test` para las pruebas de validación. La prueba de integración usa el servidor compilado y una base de demostración de pruebas. Para ejecutarla en PowerShell con MySQL de XAMPP en marcha, usa una base nueva con nombre que empiece por `pm_prueba_`.

```powershell
$env:DB_NAME = "pm_prueba_municipal"
$env:PM_INTEGRATION = "1"
npm run db:init -- --demo
npm run build
node --env-file=.env --test tests/*.test.mjs
```

La prueba de integración crea registros y cambia estados. Usa una base de pruebas dedicada.

Documentación oficial: [Astro en Node](https://docs.astro.build/en/guides/integrations-guide/node/) · [XAMPP para Windows](https://www.apachefriends.org/faq_windows.html) · [Bloqueos de filas en MariaDB](https://mariadb.com/docs/server/reference/sql-statements/data-manipulation/selecting-data/for-update).
