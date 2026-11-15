const readline = require("readline");
const BASE = process.env.EDUPERU_URL || "http://localhost:3000";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(resolve => rl.question(q, resolve));

async function jsonFetch(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
        const error = new Error(data?.mensaje || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
    }
    return data;
}

(async () => {
    console.log("\n==============================================");
    console.log(" EDUPERÚ - PRUEBA CENTRO DE NOTIFICACIONES V1");
    console.log("==============================================\n");
    console.log(`Servidor: ${BASE}\n`);

    const email = (await ask("Correo de prueba [usuario@eduperu.pe]: ")).trim() || "usuario@eduperu.pe";
    const password = (await ask("Contraseña del usuario de prueba: ")).trim();

    console.log("\n1) Iniciando sesión...");
    const login = await jsonFetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const token = login?.resultado?.token;
    if (!token) throw new Error("No se recibió JWT.");
    console.log("✅ Autenticación correcta");

    const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

    console.log("\n2) Creando notificación temporal...");
    const created = await jsonFetch(`${BASE}/api/notificaciones`, {
        method: "POST",
        headers,
        body: JSON.stringify({
            titulo: "Prueba de notificaciones",
            mensaje: "Registro temporal para validar el Centro de Notificaciones V1.",
            tipo: "OPORTUNIDAD"
        })
    });
    const id = created?.resultado?.id_notificacion;
    if (!id) throw new Error("No se recibió id_notificacion.");
    console.log(`✅ Notificación #${id} creada`);

    console.log("\n3) Consultando bandeja y resumen...");
    const list = await jsonFetch(`${BASE}/api/notificaciones`, { headers });
    const summary = await jsonFetch(`${BASE}/api/notificaciones/resumen`, { headers });
    const found = (list.resultado || []).some(item => Number(item.id_notificacion) === Number(id));
    if (!found) throw new Error("La notificación temporal no aparece en la bandeja.");
    console.log(`✅ Bandeja: ${list.total} notificaciones`);
    console.log(`✅ Resumen: Total ${summary.resultado.total} | No leídas ${summary.resultado.no_leidas}`);

    console.log("\n4) Marcando notificación como leída...");
    const read = await jsonFetch(`${BASE}/api/notificaciones/${id}/leida`, { method: "PATCH", headers });
    if (!read?.resultado?.leida) throw new Error("La notificación no quedó marcada como leída.");
    console.log("✅ Notificación marcada como leída");

    console.log("\n5) Probando marcar todas como leídas...");
    const all = await jsonFetch(`${BASE}/api/notificaciones/marcar-todas`, { method: "PATCH", headers });
    console.log(`✅ Actualizadas: ${Number(all?.resultado?.actualizadas || 0)}`);

    console.log("\n6) Limpiando registro temporal...");
    await jsonFetch(`${BASE}/api/notificaciones/${id}`, { method: "DELETE", headers });
    console.log("✅ Registro temporal eliminado");

    console.log("\n==============================================");
    console.log(" PRUEBA COMPLETADA");
    console.log("==============================================");
    console.log("Las notificaciones son personales de EduPerú y no modifican datos oficiales de PRONABEC.\n");
})().catch(error => {
    console.error(`\n❌ ${error.message}`);
    console.error("Revisa también la terminal donde está ejecutándose npm start.");
    process.exitCode = 1;
}).finally(() => rl.close());
