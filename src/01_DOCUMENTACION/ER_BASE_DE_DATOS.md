// ==========================================
// Vistar enlace para visualizar el diagrama ER 
// https://dbdiagram.io/d
// ==========================================

// ==========================================
// DBML PARA BD_GESTION_TAREAS
// ==========================================

Table AUDITORIA_TAREAS {
  ID bigint [pk, increment]
  USUARIO_ID uniqueidentifier
  USUARIO_NOMBRE nvarchar(200)
  ROL_CODIGO nvarchar(50)
  UNIDAD_ID uniqueidentifier
  ACCION nvarchar(50) [not null]
  ENTIDAD nvarchar(100) [not null]
  ENTIDAD_ID nvarchar(100)
  DATOS_ANTERIORES nvarchar(max)
  DATOS_NUEVOS nvarchar(max)
  DIRECCION_IP nvarchar(45)
  AGENTE_USUARIO nvarchar(500)
  RESULTADO nvarchar(20) [not null, default: 'EXITOSO', note: 'EXITOSO, FALLIDO, DENEGADO']
  DETALLE nvarchar(500)
  CREADO_EN datetime2 [not null, default: `sysutcdatetime()`]
}

Table ESTADO_TAREA {
  ID uniqueidentifier [pk, default: `newid()`]
  NOMBRE nvarchar(100) [not null]
  COLOR nvarchar(7) [not null, default: '#6B7280']
  ORDEN int [not null, default: 0]
  ES_DEFECTO bit [not null, default: 0]
  ESTA_ACTIVO bit [not null, default: 1]
  CREADO_EN datetime2 [not null, default: `sysutcdatetime()`]
  ACTUALIZADO_EN datetime2 [not null, default: `sysutcdatetime()`]
  ELIMINADO_EN datetime2
  CREADO_POR uniqueidentifier
}

Table HISTORIAL_TAREA {
  ID bigint [pk, increment]
  TAREA_ID uniqueidentifier [not null]
  ACCION nvarchar(20) [not null]
  DATOS_ANTERIORES nvarchar(max)
  DATOS_NUEVOS nvarchar(max)
  SOLICITUD_ID uniqueidentifier
  REALIZADO_POR uniqueidentifier [not null]
  CREADO_EN datetime2 [not null, default: `sysutcdatetime()`]
}

Table SOLICITUD_APROBACION {
  ID uniqueidentifier [pk, default: `newid()`]
  TAREA_ID uniqueidentifier
  TIPO_ACCION nvarchar(20) [not null, note: 'CREAR, EDITAR, COMPLETAR, ELIMINAR']
  TITULO nvarchar(300) [not null]
  DESCRIPCION nvarchar(max)
  ESTADO_ID uniqueidentifier
  PRIORIDAD nvarchar(10) [not null, default: 'MEDIA', note: 'ALTA, MEDIA, BAJA']
  UNIDAD_ID uniqueidentifier [not null]
  SOLICITANTE_ID uniqueidentifier [not null]
  ESTADO_SOLICITUD nvarchar(20) [not null, default: 'PENDIENTE', note: 'PENDIENTE, APROBADA, RECHAZADA']
  APROBADO_POR uniqueidentifier
  FECHA_RESOLUCION datetime2
  MOTIVO_RECHAZO nvarchar(500)
  CREADO_EN datetime2 [not null, default: `sysutcdatetime()`]
}

Table TAREA {
  ID uniqueidentifier [pk, default: `newid()`]
  TITULO nvarchar(300) [not null]
  DESCRIPCION nvarchar(max)
  ESTADO_ID uniqueidentifier [not null]
  PRIORIDAD nvarchar(10) [not null, default: 'MEDIA', note: 'ALTA, MEDIA, BAJA']
  UNIDAD_ID uniqueidentifier [not null]
  CREADO_POR uniqueidentifier [not null]
  ASIGNADO_A uniqueidentifier
  FECHA_CREACION datetime2 [not null, default: `sysutcdatetime()`]
  ACTUALIZADO_EN datetime2 [not null, default: `sysutcdatetime()`]
  ELIMINADO_EN datetime2
  ACTUALIZADO_POR uniqueidentifier
}

// ==========================================
// RELACIONES (Llaves Foráneas)
// ==========================================

// Relaciones explícitas de tu script
Ref: HISTORIAL_TAREA.TAREA_ID > TAREA.ID
Ref: TAREA.ESTADO_ID > ESTADO_TAREA.ID

// Relaciones lógicas (implícitas por nombre de columnas)
Ref: SOLICITUD_APROBACION.TAREA_ID > TAREA.ID
Ref: SOLICITUD_APROBACION.ESTADO_ID > ESTADO_TAREA.ID