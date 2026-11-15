const readline = require("readline");

const BASE_URL = process.env.EDUPERU_BASE_URL || "http://localhost:3000";

function preguntar(texto, defecto = "") {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise(resolve => {
        rl.question(`${texto}${defecto ? ` [${defecto}]` : ""}: `, respuesta => {
            rl.close();
            resolve(respuesta.trim() || defecto);
        });
    });
}

async function main() {
    console.log("\n==============================================");
    console.log(" EDUPERÚ - PRUEBA CALENDARIO EDUCATIVO");
    console.log("==============================================\n");
    console.log(`Servidor: ${BASE_URL}\n`);

    const email = process.env.EDUPERU_TEST_EMAIL || await preguntar("Correo de prueba", "usuario@eduperu.pe");
    const password = process.env.EDUPERU_TEST_PASSWORD || await preguntar("Contraseña del usuario de prueba");

    console.log("\n1) Iniciando sesión...");
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const login = await loginResponse.json();
    if (!loginResponse.ok || login.success === false) {
        throw new Error(login.mensaje || "No se pudo iniciar sesión.");
    }

    const token = login.resultado?.token || login.token;
    if (!token) throw new Error("El login no devolvió JWT.");
    console.log("✅ Autenticación correcta");

    console.log("\n2) Consultando CalendarioEducativoService...");
    const inicio = Date.now();
    const response = await fetch(`${BASE_URL}/api/calendario`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const body = await response.json();
    const ms = Date.now() - inicio;

    if (!response.ok || body.success === false) {
        throw new Error(body.mensaje || "Calendario no disponible.");
    }

    const r = body.resultado || {};
    console.log(`✅ Estado: ${r.estado || "OPERATIVO"}`);
    console.log(`   Tiempo: ${ms} ms`);
    console.log(`   Eventos totales: ${r.totalGeneral ?? r.total ?? 0}`);
    console.log(`   Oficiales: ${r.resumen?.oficiales ?? 0}`);
    console.log(`   Personales: ${r.resumen?.personales ?? 0}`);
    console.log(`   Próximos: ${Array.isArray(r.proximos) ? r.proximos.length : 0}`);

    console.log("\nFuentes:");
    console.log(` - Cronograma oficial: ${r.fuentes?.cronograma?.disponible === false ? "NO DISPONIBLE" : "OK"}`);
    console.log(` - Fuente: ${r.fuentes?.cronograma?.fuente || "N/D"}`);
    console.log(` - Alertas EduPeruDB: ${r.fuentes?.alertas?.disponible === false ? "NO DISPONIBLE" : "OK"}`);
    console.log(` - Seguimientos EduPeruDB: ${r.fuentes?.seguimientos?.disponible === false ? "NO DISPONIBLE" : "OK"}`);

    const proximos = Array.isArray(r.proximos) ? r.proximos.slice(0, 5) : [];
    if (proximos.length) {
        console.log("\nPróximos eventos:");
        for (const item of proximos) {
            console.log(` - ${item.fecha ? String(item.fecha).slice(0,10) : "N/D"} | ${item.titulo || "Evento"} | ${item.categoria || "N/D"}`);
        }
    } else {
        console.log("\nNo hay próximos eventos con fecha verificable.");
    }

    console.log("\n==============================================");
    console.log(" PRUEBA COMPLETADA");
    console.log("==============================================");
    console.log("EduPerú solo muestra fechas oficiales cuando están disponibles; no genera cronogramas ficticios.\n");
}

main().catch(error => {
    console.error("\n❌ PRUEBA FALLIDA:", error.message);
    process.exitCode = 1;
});
