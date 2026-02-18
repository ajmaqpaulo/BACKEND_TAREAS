// ============================================================
// Swagger / OpenAPI 3.0 — BACKEND_TAREAS
// Acceder en: http://localhost:5000/api/tareas/docs
// ============================================================

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const definicion: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "BACKEND TAREAS — API Gestión de Tareas",
            version: "1.0.0",
            description: "Backend de gestión de tareas con flujo de aprobación, dashboard, estados dinámicos y reportes.\n\n**Autenticación:** JWT del Microservicio Auth (puerto 4000).\n\nFlujo: Admin/Supervisor → acción directa | Estándar → genera solicitud de aprobación.",
        },
        servers: [
            { url: "http://localhost:5000", description: "Desarrollo (HTTP)" },
            { url: "https://localhost:5000", description: "Desarrollo (HTTPS)" },
        ],
        components: {
            securitySchemes: {
                BearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Token JWT obtenido en Auth /login" },
            },
            schemas: {
                Respuesta: {
                    type: "object",
                    properties: { exito: { type: "boolean" }, mensaje: { type: "string" }, datos: { type: "object", nullable: true } },
                },
                CrearTareaRequest: {
                    type: "object", required: ["titulo"],
                    properties: {
                        titulo: { type: "string", example: "Implementar módulo de reportes" },
                        descripcion: { type: "string", example: "Crear los 5 reportes del sprint 3" },
                        estado_id: { type: "string", format: "uuid", description: "Si no se envía, usa el estado por defecto" },
                        prioridad: { type: "string", enum: ["BAJA", "MEDIA", "ALTA"], default: "MEDIA" },
                        unidad_id: { type: "string", format: "uuid", description: "Si no se envía, usa la unidad del usuario" },
                    },
                },
                EditarTareaRequest: {
                    type: "object",
                    properties: {
                        titulo: { type: "string" },
                        descripcion: { type: "string" },
                        estado_id: { type: "string", format: "uuid" },
                        prioridad: { type: "string", enum: ["BAJA", "MEDIA", "ALTA"] },
                    },
                },
                CrearEstadoRequest: {
                    type: "object", required: ["nombre"],
                    properties: {
                        nombre: { type: "string", example: "En Revisión" },
                        color: { type: "string", example: "#A855F7", default: "#6B7280" },
                    },
                },
                RechazarRequest: {
                    type: "object", required: ["motivo"],
                    properties: { motivo: { type: "string", minLength: 10, example: "La solicitud no tiene la documentación de respaldo necesaria para proceder." } },
                },
                AprobarRequest: {
                    type: "object",
                    properties: { observacion: { type: "string", example: "Aprobado, proceder con prioridad" } },
                },
                ReenviarRequest: {
                    type: "object",
                    properties: {
                        titulo: { type: "string", example: "Título corregido" },
                        descripcion: { type: "string" },
                        prioridad: { type: "string", enum: ["BAJA", "MEDIA", "ALTA"] },
                    },
                },
            },
        },
        tags: [
            { name: "Dashboard", description: "CRUD de tareas (con flujo de aprobación automático según rol)" },
            { name: "Estados", description: "Catálogo dinámico de estados de tarea" },
            { name: "Aprobaciones", description: "Gestión de solicitudes pendientes (Supervisor/Admin)" },
            { name: "Mis Solicitudes", description: "Usuario estándar consulta y reenvía sus solicitudes" },
            { name: "Reportes", description: "Ejecución de reportes vía stored procedures" },
            { name: "Interno", description: "Health check" },
        ],
        paths: {
            // ═══ DASHBOARD ═══
            "/api/tareas/dashboard/tareas": {
                get: {
                    tags: ["Dashboard"], summary: "Listar tareas", security: [{ BearerAuth: [] }],
                    parameters: [{ name: "unidad_id", in: "query", schema: { type: "string", format: "uuid" }, description: "Filtrar por unidad" }],
                    responses: { 200: { description: "Lista de tareas con estado, prioridad, unidad" } },
                },
                post: {
                    tags: ["Dashboard"], summary: "Crear tarea", security: [{ BearerAuth: [] }],
                    description: "**Admin/Supervisor:** crea tarea directamente.\n**Estándar:** genera solicitud de aprobación PENDIENTE.",
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CrearTareaRequest" } } } },
                    responses: {
                        201: { description: "Retorna `{tipo: 'TAREA', id}` si directo, o `{tipo: 'SOLICITUD', id}` si requiere aprobación" },
                        400: { description: "Título requerido" },
                    },
                },
            },
            "/api/tareas/dashboard/tareas/{id}": {
                get: {
                    tags: ["Dashboard"], summary: "Obtener tarea por ID", security: [{ BearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Detalle de la tarea" }, 404: { description: "Tarea no encontrada" } },
                },
                put: {
                    tags: ["Dashboard"], summary: "Editar tarea", security: [{ BearerAuth: [] }],
                    description: "**Admin/Supervisor:** edita directamente.\n**Estándar:** genera solicitud de edición.",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EditarTareaRequest" } } } },
                    responses: { 200: { description: "Tarea editada o solicitud creada" } },
                },
                delete: {
                    tags: ["Dashboard"], summary: "Eliminar tarea", security: [{ BearerAuth: [] }],
                    description: "**Admin/Supervisor:** elimina directamente (soft delete).\n**Estándar:** genera solicitud de eliminación.",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Tarea eliminada o solicitud creada" } },
                },
            },
            "/api/tareas/dashboard/tareas/{id}/completar": {
                post: {
                    tags: ["Dashboard"], summary: "Marcar tarea como completada", security: [{ BearerAuth: [] }],
                    description: "Cambia estado a 'Completada'. Estándar → solicitud de aprobación.",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Tarea completada o solicitud creada" } },
                },
            },
            "/api/tareas/dashboard/tareas/{id}/historial": {
                get: {
                    tags: ["Dashboard"], summary: "Historial de cambios de una tarea", security: [{ BearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Lista de acciones: CREADA, EDITADA, COMPLETADA, ELIMINADA" } },
                },
            },
            // ═══ ESTADOS ═══
            "/api/tareas/estados": {
                get: { tags: ["Estados"], summary: "Listar estados de tarea", security: [{ BearerAuth: [] }], responses: { 200: { description: "Lista de estados con color y orden" } } },
                post: {
                    tags: ["Estados"], summary: "Crear estado", security: [{ BearerAuth: [] }],
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CrearEstadoRequest" } } } },
                    responses: { 201: { description: "Estado creado" } },
                },
            },
            "/api/tareas/estados/{id}": {
                put: {
                    tags: ["Estados"], summary: "Editar estado", security: [{ BearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CrearEstadoRequest" } } } },
                    responses: { 200: { description: "Estado actualizado" } },
                },
                delete: {
                    tags: ["Estados"], summary: "Eliminar estado", security: [{ BearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Estado eliminado" } },
                },
            },
            // ═══ APROBACIONES ═══
            "/api/tareas/aprobaciones/contadores": {
                get: {
                    tags: ["Aprobaciones"], summary: "Contadores (pendientes, aprobadas, rechazadas)", security: [{ BearerAuth: [] }],
                    parameters: [{ name: "unidad_id", in: "query", schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Contadores para cards del frontend" } },
                },
            },
            "/api/tareas/aprobaciones": {
                get: {
                    tags: ["Aprobaciones"], summary: "Listar solicitudes (filtros por estado, prioridad, tipo)", security: [{ BearerAuth: [] }],
                    description: "**Supervisor:** solo ve solicitudes de su unidad.\n**Admin:** ve todas o filtra por unidad.",
                    parameters: [
                        { name: "estado_solicitud", in: "query", schema: { type: "string", enum: ["PENDIENTE", "APROBADA", "RECHAZADA"] }, description: "Default: PENDIENTE" },
                        { name: "prioridad", in: "query", schema: { type: "string", enum: ["BAJA", "MEDIA", "ALTA"] } },
                        { name: "tipo_accion", in: "query", schema: { type: "string", enum: ["CREAR", "EDITAR", "COMPLETAR", "ELIMINAR"] } },
                        { name: "unidad_id", in: "query", schema: { type: "string", format: "uuid" } },
                        { name: "busqueda", in: "query", schema: { type: "string" } },
                    ],
                    responses: { 200: { description: "Lista de solicitudes" } },
                },
            },
            "/api/tareas/aprobaciones/{id}": {
                get: {
                    tags: ["Aprobaciones"], summary: "Detalle completo de una solicitud", security: [{ BearerAuth: [] }],
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    responses: { 200: { description: "Detalle con datos propuestos y resolución" } },
                },
            },
            "/api/tareas/aprobaciones/{id}/aprobar": {
                post: {
                    tags: ["Aprobaciones"], summary: "Aprobar solicitud", security: [{ BearerAuth: [] }],
                    description: "**Validaciones:** misma unidad (Supervisor), anti auto-aprobación, solicitud PENDIENTE.",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/AprobarRequest" } } } },
                    responses: { 200: { description: "Solicitud aprobada — retorna tarea_id" }, 400: { description: "Validación fallida" } },
                },
            },
            "/api/tareas/aprobaciones/{id}/rechazar": {
                post: {
                    tags: ["Aprobaciones"], summary: "Rechazar solicitud", security: [{ BearerAuth: [] }],
                    description: "**Validaciones:** motivo mínimo 10 caracteres, misma unidad, anti auto-rechazo.",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RechazarRequest" } } } },
                    responses: { 200: { description: "Solicitud rechazada" }, 400: { description: "Motivo muy corto o validación fallida" } },
                },
            },
            // ═══ MIS SOLICITUDES ═══
            "/api/tareas/aprobaciones/mis-solicitudes/listar": {
                get: {
                    tags: ["Mis Solicitudes"], summary: "Ver mis solicitudes (usuario estándar)", security: [{ BearerAuth: [] }],
                    description: "El usuario estándar puede ver el estado de todas sus solicitudes.",
                    parameters: [{ name: "estado_solicitud", in: "query", schema: { type: "string", enum: ["PENDIENTE", "APROBADA", "RECHAZADA"] } }],
                    responses: { 200: { description: "Mis solicitudes con estado y motivo de rechazo" } },
                },
            },
            "/api/tareas/aprobaciones/{id}/reenviar": {
                post: {
                    tags: ["Mis Solicitudes"], summary: "Reenviar solicitud rechazada (con correcciones)", security: [{ BearerAuth: [] }],
                    description: "Solo funciona sobre solicitudes RECHAZADAS propias. Crea nueva solicitud PENDIENTE.",
                    parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
                    requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ReenviarRequest" } } } },
                    responses: { 201: { description: "Nueva solicitud creada" }, 400: { description: "No es rechazada o no es suya" } },
                },
            },
            // ═══ REPORTES ═══
            "/api/tareas/reportes/contadores": {
                get: {
                    tags: ["Reportes"], summary: "Contadores para cards de reportes", security: [{ BearerAuth: [] }],
                    responses: { 200: { description: "Contadores: aprobados, productividad, criticidad, auditoría" } },
                },
            },
            "/api/tareas/reportes/ejecutar/{codigo}": {
                get: {
                    tags: ["Reportes"], summary: "Ejecutar reporte por código", security: [{ BearerAuth: [] }],
                    description: "Códigos válidos:\n- `RPT_SOLICITUDES_APROBADAS`\n- `RPT_PRODUCTIVIDAD_UNIDAD`\n- `RPT_PRIORIDAD_CRITICIDAD`\n- `RPT_AUDITORIA_SISTEMA`\n- `RPT_SOLICITUDES_RECHAZADAS`",
                    parameters: [
                        { name: "codigo", in: "path", required: true, schema: { type: "string", enum: ["RPT_SOLICITUDES_APROBADAS", "RPT_PRODUCTIVIDAD_UNIDAD", "RPT_PRIORIDAD_CRITICIDAD", "RPT_AUDITORIA_SISTEMA", "RPT_SOLICITUDES_RECHAZADAS"] } },
                        { name: "fecha_desde", in: "query", schema: { type: "string", format: "date" } },
                        { name: "fecha_hasta", in: "query", schema: { type: "string", format: "date" } },
                        { name: "unidad_id", in: "query", schema: { type: "string", format: "uuid" } },
                    ],
                    responses: { 200: { description: "Datos del reporte con código, nombre_sp y registros" }, 400: { description: "Código de reporte no encontrado" } },
                },
            },
            // ═══ INTERNO ═══
            "/api/tareas/health": {
                get: { tags: ["Interno"], summary: "Health check", responses: { 200: { description: "Servicio activo" } } },
            },
        },
    },
    apis: [],
};

export function configurar_swagger(app: Application): void {
    const spec = swaggerJsdoc(definicion);
    app.use("/api/tareas/docs", swaggerUi.serve, swaggerUi.setup(spec, {
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "API Tareas — Swagger",
    }));
    console.log("[TAREAS-SWAGGER] Documentación en /api/tareas/docs");
}
