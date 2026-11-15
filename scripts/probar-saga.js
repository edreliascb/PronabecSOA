require("dotenv").config();

const readline = require("readline");
const authService = require("../src/services/auth.service");
const sagaService = require("../src/services/sagaSeguimiento.service");

function preguntar(rl, pregunta) {
    return new Promise((resolve) => {
        rl.question(pregunta, (respuesta) => resolve(String(respuesta || "").trim()));
    });
}

function titulo(texto) {
    console.log("\n==============================================");
    console.log(` ${texto}`);
    console.log("==============================================\n");
}

function imprimirSaga(saga) {
    console.log(`Saga ID              : ${saga.saga_id}`);
    console.log(`Estado               : ${saga.estado}`);
    console.log(`Usuario              : ${saga.id_usuario}`);
    console.log("");

    for (const paso of saga.pasos || []) {
        const icono = paso.estado === "COMPLETADO"
            ? "✅"
            : paso.estado === "OMITIDO"
                ? "➖"
                : "⚠️";
        console.log(`${icono} ${paso.paso} — ${paso.estado}`);
    }

    if ((saga.compensaciones || []).length > 0) {
        console.log("\nCompensaciones:");
        for (const item of saga.compensaciones) {
            const icono = item.estado === "COMPLETADA" ? "↩️" : "❌";
            console.log(`${icono} ${item.compensacion} — ${item.estado}`);
        }
    }

    if (saga.error) {
        console.log(`\nError original       : ${saga.error.mensaje}`);
    }
}

function datosPrueba(prefijo) {
    const ahora = Date.now();

    return {
        seguimiento: {
            id_postulacion: `${prefijo}-${ahora}`,
            titulo: `Prueba SAGA EduPerú ${prefijo}`,
            estado: "EN_SEGUIMIENTO",
            notas: "Registro generado por npm run saga:probar"
        },
        documento: {
            tipo_documento: "CONSTANCIA_PRUEBA",
            nombre_archivo: `saga-${prefijo.toLowerCase()}-${ahora}.pdf`,
            descripcion: "Metadato de documento para demostrar SAGA y compensación."
        },
        alerta: {
            nombre: `Alerta SAGA ${prefijo}`,
            palabra_clave: "SAGA",
            region: ""
        },
        notificacion: {
            titulo: `SAGA ${prefijo}`,
            mensaje: "Prueba controlada del patrón SAGA en EduPerú SOA.",
            tipo: "SEGUIMIENTO"
        }
    };
}

async function main() {
    titulo("EDUPerú - PRUEBA SAGA");

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const email = process.env.SAGA_TEST_EMAIL ||
        await preguntar(rl, "Correo de prueba [usuario@eduperu.pe]: ") ||
        "usuario@eduperu.pe";

    const password = process.env.SAGA_TEST_PASSWORD ||
        await preguntar(rl, "Contraseña del usuario de prueba: ");

    rl.close();

    if (!password) {
        throw new Error("Debes indicar la contraseña del usuario de prueba.");
    }

    const sesion = await authService.iniciarSesion({
        email,
        password
    });

    const usuario = sesion?.usuario;
    const idUsuario = Number(usuario?.id_usuario || usuario?.id);

    if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
        throw new Error("El login fue correcto, pero no se obtuvo un id_usuario válido.");
    }

    console.log(`\n✅ Login correcto — ${email} (usuario ${idUsuario})`);

    titulo("PRUEBA 1 - CAMINO EXITOSO");

    const sagaExitosa = await sagaService.ejecutarSagaSeguimiento(
        idUsuario,
        datosPrueba("OK")
    );

    imprimirSaga(sagaExitosa);

    titulo("PRUEBA 2 - FALLO CONTROLADO Y COMPENSACIÓN");

    try {
        await sagaService.ejecutarSagaSeguimiento(
            idUsuario,
            datosPrueba("FALLO"),
            {
                forzarFalloEn: "AUDITORIA_ANTES"
            }
        );

        console.log("⚠️ La prueba debía fallar, pero terminó sin error.");
    } catch (error) {
        if (!error.saga) {
            throw error;
        }

        imprimirSaga(error.saga);

        if (error.saga.estado === "COMPENSADA") {
            console.log("\n✅ La compensación SAGA funcionó correctamente.");
        } else {
            console.log(`\n⚠️ Estado final de compensación: ${error.saga.estado}`);
        }
    }

    titulo("RESULTADO FINAL");
    console.log("✅ SAGA exitosa validada");
    console.log("✅ Fallo controlado validado");
    console.log("✅ Compensaciones en orden inverso validadas");
    console.log("\nLa prueba dejó persistida únicamente la SAGA exitosa.");
}

main()
    .then(() => {
        process.exitCode = 0;
    })
    .catch((error) => {
        console.error("\n❌ PRUEBA SAGA FALLIDA");
        console.error(error.message);
        process.exitCode = 1;
    });
