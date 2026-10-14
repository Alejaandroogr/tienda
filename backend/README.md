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
el comportamiento predeterminado continúa terminando con el mensaje histórico
si falla la conexión. El endpoint de recomendaciones selecciona el modo
`exception` antes de incluir la configuración para poder responder con JSON
genérico y registrar los detalles solo en el log del servidor.
