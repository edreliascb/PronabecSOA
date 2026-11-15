/* =========================================================
   EDUPERÚ SOA
   EMAIL SERVICE V1
   - Modo console para desarrollo
   - Modo resend para correo real
   - Sin credenciales en código
========================================================= */

function crearError(mensaje, statusCode = 500, codigo = "EMAIL_ERROR") {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    error.codigo = codigo;
    return error;
}

function obtenerConfiguracion() {
    const mode = String(process.env.EMAIL_MODE || "console").trim().toLowerCase();
    const from = String(process.env.EMAIL_FROM || "EduPerú <onboarding@resend.dev>").trim();
    const appBaseUrl = String(process.env.APP_BASE_URL || "http://localhost:3000").trim().replace(/\/$/, "");

    if (!["console", "resend"].includes(mode)) {
        throw crearError("EMAIL_MODE debe ser console o resend.", 500, "EMAIL_CONFIG_ERROR");
    }

    return {
        mode,
        from,
        appBaseUrl,
        resendApiKey: String(process.env.RESEND_API_KEY || "").trim()
    };
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function enviarCorreo({ to, subject, html, text }) {
    const config = obtenerConfiguracion();
    const destinatario = String(to || "").trim().toLowerCase();

    if (!destinatario || !subject || !html) {
        throw crearError("Destinatario, asunto y contenido son obligatorios.", 500, "EMAIL_DATA_ERROR");
    }

    if (config.mode === "console") {
        console.log(`[EMAIL:CONSOLE] Para=${destinatario} | Asunto=${subject}`);
        return { proveedor: "console", enviado: false, simulado: true };
    }

    if (!config.resendApiKey) {
        throw crearError("RESEND_API_KEY no está configurada.", 503, "EMAIL_PROVIDER_NOT_CONFIGURED");
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.resendApiKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            from: config.from,
            to: [destinatario],
            subject: String(subject),
            html: String(html),
            text: text ? String(text) : undefined
        })
    });

    let data = {};
    try { data = await response.json(); } catch { data = {}; }

    if (!response.ok) {
        console.error("[EmailService] Resend error:", response.status, data);
        throw crearError("No fue posible enviar el correo en este momento.", 502, "EMAIL_PROVIDER_ERROR");
    }

    return {
        proveedor: "resend",
        enviado: true,
        simulado: false,
        id: data?.id || null
    };
}

async function enviarVerificacion({ email, nombres, token }) {
    const { appBaseUrl } = obtenerConfiguracion();
    const url = `${appBaseUrl}/pages/verificar-email.html?token=${encodeURIComponent(token)}`;
    const nombre = escaparHtml(nombres || "estudiante");

    return enviarCorreo({
        to: email,
        subject: "Verifica tu correo en EduPerú",
        text: `Hola ${nombres || ""}. Verifica tu correo en EduPerú: ${url}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;line-height:1.6">
              <h2>Verifica tu correo en EduPerú</h2>
              <p>Hola <strong>${nombre}</strong>.</p>
              <p>Confirma que este correo te pertenece para activar completamente tu cuenta.</p>
              <p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0b57d0;color:white;text-decoration:none;border-radius:8px">Verificar mi correo</a></p>
              <p>El enlace es temporal y solo puede usarse una vez.</p>
              <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
            </div>`
    });
}

async function enviarRecuperacion({ email, nombres, token }) {
    const { appBaseUrl } = obtenerConfiguracion();
    const url = `${appBaseUrl}/pages/restablecer-password.html?token=${encodeURIComponent(token)}`;
    const nombre = escaparHtml(nombres || "estudiante");

    return enviarCorreo({
        to: email,
        subject: "Recuperación de contraseña - EduPerú",
        text: `Hola ${nombres || ""}. Restablece tu contraseña de EduPerú: ${url}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;line-height:1.6">
              <h2>Recuperación de contraseña</h2>
              <p>Hola <strong>${nombre}</strong>.</p>
              <p>Recibimos una solicitud para cambiar tu contraseña de EduPerú.</p>
              <p><a href="${url}" style="display:inline-block;padding:12px 18px;background:#0b57d0;color:white;text-decoration:none;border-radius:8px">Crear nueva contraseña</a></p>
              <p>Este enlace expira y solo puede utilizarse una vez.</p>
              <p>Si no solicitaste el cambio, ignora este correo.</p>
            </div>`
    });
}

function obtenerEstadoConfiguracion() {
    const config = obtenerConfiguracion();
    return {
        modo: config.mode,
        proveedorConfigurado: config.mode === "console" ? true : Boolean(config.resendApiKey),
        remitente: config.from,
        appBaseUrl: config.appBaseUrl
    };
}

module.exports = {
    enviarCorreo,
    enviarVerificacion,
    enviarRecuperacion,
    obtenerEstadoConfiguracion
};
