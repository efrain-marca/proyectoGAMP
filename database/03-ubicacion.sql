-- Migración repetible para proyectos registrados antes del selector de ubicación.
ALTER TABLE proyectos
 ADD COLUMN IF NOT EXISTS latitud DECIMAL(9,6) NULL,
 ADD COLUMN IF NOT EXISTS longitud DECIMAL(9,6) NULL;
