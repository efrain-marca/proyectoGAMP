-- Validaciones de escritura para MariaDB de XAMPP.
DELIMITER //
CREATE TRIGGER IF NOT EXISTS validar_nombre_usuarios_insert BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
  IF (CHAR_LENGTH(NEW.nombre) NOT BETWEEN 3 AND 120 OR NEW.nombre REGEXP '(*UCP)[^[:alpha:] ]' OR NEW.nombre NOT REGEXP '(*UCP)^[[:alpha:]]+( +[[:alpha:]]+)*$') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre solo admite letras y espacios y debe cumplir su longitud requerida.';
  END IF;
END//
CREATE TRIGGER IF NOT EXISTS validar_nombre_usuarios_update BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
  IF BINARY NEW.nombre <> BINARY OLD.nombre AND (CHAR_LENGTH(NEW.nombre) NOT BETWEEN 3 AND 120 OR NEW.nombre REGEXP '(*UCP)[^[:alpha:] ]' OR NEW.nombre NOT REGEXP '(*UCP)^[[:alpha:]]+( +[[:alpha:]]+)*$') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre solo admite letras y espacios y debe cumplir su longitud requerida.';
  END IF;
END//
CREATE TRIGGER IF NOT EXISTS validar_nombre_proyectos_insert BEFORE INSERT ON proyectos
FOR EACH ROW
BEGIN
  IF (CHAR_LENGTH(NEW.nombre) NOT BETWEEN 5 AND 160 OR NEW.nombre REGEXP '(*UCP)[^[:alpha:] ]' OR NEW.nombre NOT REGEXP '(*UCP)^[[:alpha:]]+( +[[:alpha:]]+)*$') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre solo admite letras y espacios y debe cumplir su longitud requerida.';
  END IF;
END//
CREATE TRIGGER IF NOT EXISTS validar_nombre_proyectos_update BEFORE UPDATE ON proyectos
FOR EACH ROW
BEGIN
  IF BINARY NEW.nombre <> BINARY OLD.nombre AND (CHAR_LENGTH(NEW.nombre) NOT BETWEEN 5 AND 160 OR NEW.nombre REGEXP '(*UCP)[^[:alpha:] ]' OR NEW.nombre NOT REGEXP '(*UCP)^[[:alpha:]]+( +[[:alpha:]]+)*$') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre solo admite letras y espacios y debe cumplir su longitud requerida.';
  END IF;
END//
CREATE TRIGGER IF NOT EXISTS validar_nombre_actividades_insert BEFORE INSERT ON actividades
FOR EACH ROW
BEGIN
  IF (CHAR_LENGTH(NEW.nombre) NOT BETWEEN 3 AND 150 OR NEW.nombre REGEXP '(*UCP)[^[:alpha:] ]' OR NEW.nombre NOT REGEXP '(*UCP)^[[:alpha:]]+( +[[:alpha:]]+)*$') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre solo admite letras y espacios y debe cumplir su longitud requerida.';
  END IF;
END//
CREATE TRIGGER IF NOT EXISTS validar_nombre_actividades_update BEFORE UPDATE ON actividades
FOR EACH ROW
BEGIN
  IF BINARY NEW.nombre <> BINARY OLD.nombre AND (CHAR_LENGTH(NEW.nombre) NOT BETWEEN 3 AND 150 OR NEW.nombre REGEXP '(*UCP)[^[:alpha:] ]' OR NEW.nombre NOT REGEXP '(*UCP)^[[:alpha:]]+( +[[:alpha:]]+)*$') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El nombre solo admite letras y espacios y debe cumplir su longitud requerida.';
  END IF;
END//
DELIMITER ;
