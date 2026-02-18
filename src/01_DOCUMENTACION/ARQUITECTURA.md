

// ==========================================
// PAULO ANDRADE - ARQUITECTURA TASK MANAGER
// ==========================================

│   Index.ts
│   Server.ts
│
├───COMPARTIDO
│   ├───DTOs_Generales
│   │       API_Response.dto.ts
│   │
│   ├───Middlewares
│   │       Middleware_Autenticacion.ts
│   │       Middleware_Errores.ts
│   │       Middleware_Permisos.ts
│   │
│   └───Servicios
│           Servicio_Auditoria.ts
│           Servicio_Auth.ts
│
├───CONFIGURACION
│       Conexion_Base_Datos.ts
│       Swagger.ts
│
├───MODULO_APROBACIONES
│   │   Controller_Aprobaciones.ts
│   │   Negocio_Aprobaciones.ts
│   │   Transaccion_Aprobaciones.ts
│   │
│   └───DTOs
│           index.ts
│
├───MODULO_DASHBOARD
│   │   Controller_Dashboard.ts
│   │   Negocio_Dashboard.ts
│   │   Transaccion_Dashboard.ts
│   │
│   └───DTOs
│           index.ts
│
├───MODULO_ESTADOS
│   │   Controller_Estados.ts
│   │   Negocio_Estados.ts
│   │   Transaccion_Estados.ts
│   │
│   └───DTOs
│           index.ts
│
└───MODULO_REPORTES
    │   Controller_Reportes.ts
    │   Negocio_Reportes.ts
    │   Transaccion_Reportes.ts
    │
    └───DTOs
            index.ts
