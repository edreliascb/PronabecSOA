const BASE = process.env.EDUPERU_URL || "http://localhost:3000";

async function req(path, options={}) {
    const r = await fetch(BASE + path, { headers: { "Content-Type":"application/json", ...(options.headers||{}) }, ...options });
    const data = await r.json().catch(()=>({}));
    return { status:r.status, ok:r.ok, data };
}

(async () => {
    console.log("\n==============================================");
    console.log(" EDUPERÚ - PRUEBA CORREO + AUTH V1");
    console.log("==============================================\n");

    const cfg = await req("/api/auth/email/configuration");
    if (!cfg.ok) throw new Error(`Configuración email HTTP ${cfg.status}`);
    console.log(`✅ EmailService - modo: ${cfg.data?.resultado?.modo}`);
    console.log(`✅ Proveedor configurado: ${cfg.data?.resultado?.proveedorConfigurado}`);

    const forgot = await req("/api/auth/password/forgot", { method:"POST", body:JSON.stringify({ email:"cuenta-inexistente-prueba@eduperu.invalid" }) });
    if (!forgot.ok) throw new Error(`Forgot HTTP ${forgot.status}`);
    console.log("✅ Recuperación no revela si una cuenta existe.");

    const invalidVerify = await req("/api/auth/email/verify", { method:"POST", body:JSON.stringify({ token:"token-invalido" }) });
    if (invalidVerify.status !== 400) throw new Error(`Verify esperado 400, recibido ${invalidVerify.status}`);
    console.log("✅ Token de verificación inválido rechazado.");

    const invalidReset = await req("/api/auth/password/reset", { method:"POST", body:JSON.stringify({ token:"token-invalido", password:"PasswordPrueba123!" }) });
    if (invalidReset.status !== 400) throw new Error(`Reset esperado 400, recibido ${invalidReset.status}`);
    console.log("✅ Token de recuperación inválido rechazado.");

    console.log("\n==============================================");
    console.log(" PRUEBA COMPLETADA");
    console.log("==============================================");
    console.log("Endpoints + configuración + controles de token operativos.\n");
})().catch(e => { console.error("\n❌", e.message); process.exit(1); });
