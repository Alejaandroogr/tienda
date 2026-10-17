# Configuración del backend PHP

## Conexión a MariaDB

La lógica de conexión está en `config/database_connection.php` y no contiene
credenciales. Para una instalación nueva, crea la configuración local ignorada
por Git a partir de la plantilla:

```powershell
Copy-Item backend/config/database.example.php backend/config/database.php
```

Edita únicamente `backend/config/database.php` para establecer el host, nombre
de base de datos, usuario y contraseña de tu entorno. No añadas ese archivo a
Git: está excluido en `.gitignore`. La plantilla contiene valores de ejemplo,
no credenciales de producción.

Los endpoints existentes incluyen `config/database.php` sin seleccionar modo;
si falla la conexión, responden `503` con un error JSON genérico y registran el
detalle solo en el log del servidor. El endpoint de recomendaciones selecciona
el modo `exception` antes de incluir la configuración para gestionar el fallo
con su propio formato de error.

## Errores y validación de entrada

`config/errores.php` se carga desde la conexión y desde `config/auth.php`.
Desactiva `display_errors`, registra los errores en el log y responde `500` con
un JSON genérico ante cualquier excepción o error fatal no controlado, de modo
que nunca se envían rutas, SQL ni trazas al cliente. También ofrece
`campoTextoSolicitud()` y `campoEnteroSolicitud()` para validar el tipo de los
campos del cuerpo JSON antes de usarlos.
