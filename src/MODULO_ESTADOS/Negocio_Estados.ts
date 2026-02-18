import { Transaccion_Estados } from "./Transaccion_Estados";
import { Estado_Crear_DTO, Estado_Editar_DTO, Estado_Detalle_DTO } from "./DTOs";
import { Servicio_Auditoria } from "../COMPARTIDO/Servicios/Servicio_Auditoria";
import { Token_Payload } from "../COMPARTIDO/DTOs_Generales/API_Response.dto";

export class Negocio_Estados {
    private tx = new Transaccion_Estados();

    async listar(): Promise<Estado_Detalle_DTO[]> {
        return this.tx.listar();
    }

    async crear(datos: Estado_Crear_DTO, usuario: Token_Payload): Promise<string> {
        if (!datos.nombre) throw new Error("El nombre del estado es requerido");
        const id = await this.tx.crear(datos.nombre, datos.color || "#6B7280", usuario.usuario_id);
        await Servicio_Auditoria.registrar({ usuario, accion: "CREAR_ESTADO", entidad: "ESTADO_TAREA", entidad_id: id, datos_nuevos: datos });
        return id;
    }

    async editar(id: string, datos: Estado_Editar_DTO, usuario: Token_Payload): Promise<void> {
        await this.tx.editar(id, datos);
        await Servicio_Auditoria.registrar({ usuario, accion: "EDITAR_ESTADO", entidad: "ESTADO_TAREA", entidad_id: id, datos_nuevos: datos });
    }

    async eliminar(id: string, usuario: Token_Payload): Promise<void> {
        await this.tx.eliminar(id);
        await Servicio_Auditoria.registrar({ usuario, accion: "ELIMINAR_ESTADO", entidad: "ESTADO_TAREA", entidad_id: id });
    }
}
