/* =========================================================
   EDUPERÚ SOA
   EMAIL SERVICE V2
   - console: desarrollo
   - resend: proveedor Resend
   - smtp: Gmail SMTP con contraseña de aplicación
   - Sin credenciales en código
========================================================= */

const nodemailer = require("nodemailer");

function crearError(mensaje, statusCode = 500, codigo = "EMAIL_ERROR") {
    const error = new Error(mensaje);
    error.statusCode = statusCode;
    error.codigo = codigo;
    return error;
}

function obtenerConfiguracion() {
    const mode = String(process.env.EMAIL_MODE || "console")
        .trim()
        .toLowerCase();

    const from = String(
        process.env.EMAIL_FROM || "EduPerú <onboarding@resend.dev>"
    ).trim();

    const appBaseUrl = String(
        process.env.APP_BASE_URL || "http://localhost:3000"
    )
        .trim()
        .replace(/\/$/, "");

    if (!["console", "resend", "smtp"].includes(mode)) {
        throw crearError(
            "EMAIL_MODE debe ser console, resend o smtp.",
            500,
            "EMAIL_CONFIG_ERROR"
        );
    }

    return {
        mode,
        from,
        appBaseUrl,

        resendApiKey: String(
            process.env.RESEND_API_KEY || ""
        ).trim(),

        smtpHost: String(
            process.env.SMTP_HOST || "smtp.gmail.com"
        ).trim(),

        smtpPort: Number(
            process.env.SMTP_PORT || 465
        ),

        smtpSecure:
            String(
                process.env.SMTP_SECURE || "true"
            )
                .trim()
                .toLowerCase() === "true",

        smtpUser: String(
            process.env.SMTP_USER || ""
        ).trim(),

        smtpAppPassword: String(
            process.env.SMTP_APP_PASSWORD || ""
        )
            .replace(/\s+/g, "")
            .trim()
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

let smtpTransporter = null;
let smtpSignature = null;

function obtenerSmtpTransporter(config) {
    const signature = [
        config.smtpHost,
        config.smtpPort,
        config.smtpSecure,
        config.smtpUser
    ].join("|");

    if (
        smtpTransporter &&
        smtpSignature === signature
    ) {
        return smtpTransporter;
    }

    if (
        !config.smtpUser ||
        !config.smtpAppPassword
    ) {
        throw crearError(
            "SMTP_USER y SMTP_APP_PASSWORD deben estar configurados.",
            503,
            "EMAIL_PROVIDER_NOT_CONFIGURED"
        );
    }

    smtpTransporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
            user: config.smtpUser,
            pass: config.smtpAppPassword
        }
    });

    smtpSignature = signature;

    return smtpTransporter;
}

async function enviarPorResend(config, destinatario, subject, html, text) {
    if (!config.resendApiKey) {
        throw crearError(
            "RESEND_API_KEY no está configurada.",
            503,
            "EMAIL_PROVIDER_NOT_CONFIGURED"
        );
    }

    const response = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",
            headers: {
                "Authorization":
                    `Bearer ${config.resendApiKey}`,
                "Content-Type":
                    "application/json"
            },
            body: JSON.stringify({
                from: config.from,
                to: [destinatario],
                subject: String(subject),
                html: String(html),
                text:
                    text
                        ? String(text)
                        : undefined
            })
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch {
        data = {};
    }

    if (!response.ok) {
        console.error(
            "[EmailService] Resend error:",
            response.status,
            data
        );

        throw crearError(
            "No fue posible enviar el correo en este momento.",
            502,
            "EMAIL_PROVIDER_ERROR"
        );
    }

    return {
        proveedor: "resend",
        enviado: true,
        simulado: false,
        id: data?.id || null
    };
}

async function enviarPorSmtp(config, destinatario, subject, html, text) {
    const transporter =
        obtenerSmtpTransporter(config);

    try {
        const info =
            await transporter.sendMail({
                from: config.from,
                to: destinatario,
                subject: String(subject),
                html: String(html),
                text:
                    text
                        ? String(text)
                        : undefined
            });

        return {
            proveedor: "smtp",
            enviado: true,
            simulado: false,
            id:
                info?.messageId ||
                null
        };

    } catch (error) {
        console.error(
            "[EmailService] SMTP error:",
            error?.code ||
            "",
            error?.message ||
            error
        );

        throw crearError(
            "No fue posible enviar el correo en este momento.",
            502,
            "EMAIL_PROVIDER_ERROR"
        );
    }
}

async function enviarCorreo({
    to,
    subject,
    html,
    text
}) {
    const config =
        obtenerConfiguracion();

    const destinatario =
        String(to || "")
            .trim()
            .toLowerCase();

    if (
        !destinatario ||
        !subject ||
        !html
    ) {
        throw crearError(
            "Destinatario, asunto y contenido son obligatorios.",
            500,
            "EMAIL_DATA_ERROR"
        );
    }

    if (config.mode === "console") {
        console.log(
            `[EMAIL:CONSOLE] Para=${destinatario} | Asunto=${subject}`
        );

        return {
            proveedor: "console",
            enviado: false,
            simulado: true
        };
    }

    if (config.mode === "resend") {
        return await enviarPorResend(
            config,
            destinatario,
            subject,
            html,
            text
        );
    }

    return await enviarPorSmtp(
        config,
        destinatario,
        subject,
        html,
        text
    );
}

async function enviarVerificacion({
    email,
    nombres,
    token
}) {
    const {
        appBaseUrl
    } = obtenerConfiguracion();

    const url =
        `${appBaseUrl}/pages/verificar-email.html?token=${encodeURIComponent(token)}`;

    const nombre =
        escaparHtml(
            nombres ||
            "estudiante"
        );

    return enviarCorreo({
        to: email,
        subject:
            "Verifica tu correo en EduPerú",

        text:
            `Hola ${nombres || ""}. Verifica tu correo en EduPerú: ${url}`,

        html: `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;line-height:1.6">
              <h2>Verifica tu correo en EduPerú</h2>
              <p>Hola <strong>${nombre}</strong>.</p>
              <p>Confirma que este correo te pertenece para activar completamente tu cuenta.</p>
              <p>
                <a
                    href="${url}"
                    style="display:inline-block;padding:12px 18px;background:#0b57d0;color:white;text-decoration:none;border-radius:8px"
                >
                    Verificar mi correo
                </a>
              </p>
              <p>El enlace es temporal y solo puede usarse una vez.</p>
              <p>Si no creaste esta cuenta, puedes ignorar este mensaje.</p>
            </div>`
    });
}

async function enviarRecuperacion({
    email,
    nombres,
    token
}) {
    const {
        appBaseUrl
    } = obtenerConfiguracion();

    const url =
        `${appBaseUrl}/pages/restablecer-password.html?token=${encodeURIComponent(token)}`;

    const nombre =
        escaparHtml(
            nombres ||
            "estudiante"
        );

    return enviarCorreo({
        to: email,
        subject:
            "Recuperación de contraseña - EduPerú",

        text:
            `Hola ${nombres || ""}. Restablece tu contraseña de EduPerú: ${url}`,

        html: `
            <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;line-height:1.6">
              <h2>Recuperación de contraseña</h2>
              <p>Hola <strong>${nombre}</strong>.</p>
              <p>Recibimos una solicitud para cambiar tu contraseña de EduPerú.</p>
              <p>
                <a
                    href="${url}"
                    style="display:inline-block;padding:12px 18px;background:#0b57d0;color:white;text-decoration:none;border-radius:8px"
                >
                    Crear nueva contraseña
                </a>
              </p>
              <p>Este enlace expira y solo puede utilizarse una vez.</p>
              <p>Si no solicitaste el cambio, ignora este correo.</p>
            </div>`
    });
}

async function probarProveedor() {
    const config =
        obtenerConfiguracion();

    if (config.mode === "console") {
        return {
            ok: true,
            proveedor: "console",
            mensaje:
                "Modo console activo."
        };
    }

    if (config.mode === "resend") {
        return {
            ok:
                Boolean(
                    config.resendApiKey
                ),
            proveedor:
                "resend"
        };
    }

    const transporter =
        obtenerSmtpTransporter(
            config
        );

    await transporter.verify();

    return {
        ok: true,
        proveedor: "smtp",
        host: config.smtpHost,
        port: config.smtpPort
    };
}

function obtenerEstadoConfiguracion() {
    const config =
        obtenerConfiguracion();

    let proveedorConfigurado = true;

    if (config.mode === "resend") {
        proveedorConfigurado =
            Boolean(
                config.resendApiKey
            );
    }

    if (config.mode === "smtp") {
        proveedorConfigurado =
            Boolean(
                config.smtpUser &&
                config.smtpAppPassword
            );
    }

    return {
        modo:
            config.mode,

        proveedorConfigurado,

        remitente:
            config.from,

        appBaseUrl:
            config.appBaseUrl
    };
}

module.exports = {
    enviarCorreo,
    enviarVerificacion,
    enviarRecuperacion,
    probarProveedor,
    obtenerEstadoConfiguracion
};
