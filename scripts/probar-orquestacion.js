const axios = require("axios");

const BASE_URL = process.env.EDUPERU_BASE_URL || "http://localhost:3000";

function simbolo(estado) {
    if (estado === "OPERATIVO") return "✅";
    if (estado === "NO_DISPONIBLE") return "⚠️";
    return "❌";
}

function linea() {
    console.log("==============================================");
}

async function main() {
    console.log("");
    linea();
    console.log(" EDUPERÚ - PRUEBA DE ORQUESTACIÓN");
    linea();
    console.log("");
    console.log(`Servidor: ${BASE_URL}`);
    console.log("Ejecutando 6 servicios coordinados...\n");

    try {
        const respuesta = await axios.get(
            `${BASE_URL}/api/consulta/orquestacion`,
            { timeout: 45000 }
        );

        const resultado = respuesta.data?.resultado;
        if (!resultado) throw new Error("El endpoint no devolvió el objeto resultado esperado.");

        for (const servicio of resultado.servicios || []) {
            console.log(`${simbolo(servicio.estado)} ${servicio.servicio}`);
            console.log(`   Estado  : ${servicio.estado}`);
            console.log(`   Tiempo  : ${servicio.duracionMs} ms`);
            console.log(`   Fuente  : ${servicio.fuente}`);
            if (servicio.total !== null) console.log(`   Total   : ${servicio.total}`);
            if (servicio.motivo) console.log(`   Motivo  : ${servicio.motivo}`);
            console.log("");
        }

        linea();
        console.log(` Estado general       : ${resultado.estado}`);
        console.log(` Servicios ejecutados : ${resultado.resumen?.totalServicios ?? 0}`);
        console.log(` Operativos           : ${resultado.resumen?.operativos ?? 0}`);
        console.log(` No disponibles       : ${resultado.resumen?.noDisponibles ?? 0}`);
        console.log(` Errores              : ${resultado.resumen?.errores ?? 0}`);
        console.log(` Tiempo total         : ${resultado.duracionTotalMs} ms`);
        linea();
        console.log("");

        if ((resultado.resumen?.errores || 0) > 0) process.exitCode = 2;
    } catch (error) {
        console.error("\n❌ No se pudo ejecutar la prueba de orquestación.");
        if (error.code === "ECONNREFUSED") {
            console.error("El servidor EduPerú no está iniciado. Abre otra terminal y ejecuta: npm start");
        } else if (error.code === "ECONNABORTED") {
            console.error("La demostración excedió 45 segundos. Revisa la terminal de npm start para identificar la fuente externa bloqueada.");
        } else if (error.response?.data) {
            console.error(JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        process.exitCode = 1;
    }
}

main();
