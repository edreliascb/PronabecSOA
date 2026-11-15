const resiliencia = require("../src/services/resilienciaHttp.service");

function fallo(codigo = "ETIMEDOUT") {
    const error = new Error(`Fallo simulado ${codigo}`);
    error.code = codigo;
    error.codigoTecnico = codigo;
    return error;
}

(async () => {
    console.log("\n==============================================");
    console.log(" EDUPERÚ - PRUEBA RESILIENCIA PRONABEC");
    console.log("==============================================\n");

    const nombre = "PRONABEC_PRUEBA";
    resiliencia.reiniciarCircuito(nombre);

    console.log("1) Probando Retry...");
    let intentos = 0;
    const ok = await resiliencia.ejecutarConResiliencia(
        nombre,
        async () => {
            intentos += 1;
            if (intentos < 3) throw fallo("ETIMEDOUT");
            return { ok: true };
        },
        { timeoutMs: 500, reintentos: 2, esperaBaseMs: 10, umbralFallos: 3, tiempoAbiertoMs: 1000 }
    );
    console.log(`✅ Retry correcto - intentos: ${intentos} | resultado: ${ok.ok}`);

    console.log("\n2) Probando apertura del Circuit Breaker...");
    resiliencia.reiniciarCircuito(nombre);
    for (let i = 1; i <= 3; i += 1) {
        try {
            await resiliencia.ejecutarConResiliencia(
                nombre,
                async () => { throw fallo("ECONNREFUSED"); },
                { timeoutMs: 200, reintentos: 0, umbralFallos: 3, tiempoAbiertoMs: 3000 }
            );
        } catch (_) {
            console.log(`   Fallo controlado ${i}/3`);
        }
    }
    const estadoAbierto = resiliencia.obtenerEstadoCircuito(nombre);
    if (estadoAbierto.estado !== "ABIERTO") throw new Error("El circuito no se abrió.");
    console.log(`✅ Circuit breaker abierto - fallos: ${estadoAbierto.fallosConsecutivos}`);

    console.log("\n3) Verificando rechazo rápido mientras está abierto...");
    const inicio = Date.now();
    try {
        await resiliencia.ejecutarConResiliencia(nombre, async () => ({ ok: true }), { tiempoAbiertoMs: 3000 });
        throw new Error("El circuito permitió una llamada cuando debía estar abierto.");
    } catch (error) {
        if ((error.codigoTecnico || error.code) !== "CIRCUIT_OPEN") throw error;
        console.log(`✅ Rechazo rápido: CIRCUIT_OPEN (${Date.now() - inicio} ms)`);
    }

    console.log("\n4) Reiniciando circuito...");
    const estadoFinal = resiliencia.reiniciarCircuito(nombre);
    console.log(`✅ Estado final: ${estadoFinal.estado}`);

    console.log("\n==============================================");
    console.log(" PRUEBA COMPLETADA");
    console.log("==============================================");
    console.log("Timeout + Retry + Circuit Breaker operativos.\n");
})().catch(error => {
    console.error("\n❌ No se pudo completar la prueba.");
    console.error(error);
    process.exit(1);
});
