const fs = require("fs");
const path = require("path");

const root = process.cwd();
const publicDir = path.join(root, "public");
const loginHtmlPath = path.join(publicDir, "pages", "login.html");
const loginJsPath = path.join(publicDir, "js", "login.js");
const authClientPath = path.join(publicDir, "js", "auth-client.js");

function fail(message) {
    console.error("❌", message);
    process.exit(1);
}

for (const p of [loginHtmlPath, loginJsPath, authClientPath]) {
    if (!fs.existsSync(p)) {
        fail(`No existe ${p}`);
    }
}

/* =========================================================
   1. REPARAR MOJIBAKE UTF-8 EN PUBLIC
========================================================= */

const replacements = new Map([
    ["Ã¡", "á"], ["Ã©", "é"], ["Ã­", "í"], ["Ã³", "ó"], ["Ãº", "ú"],
    ["Ã", "Á"], ["Ã‰", "É"], ["Ã", "Í"], ["Ã“", "Ó"], ["Ãš", "Ú"],
    ["Ã±", "ñ"], ["Ã‘", "Ñ"], ["Ã¼", "ü"], ["Ãœ", "Ü"],
    ["Â¿", "¿"], ["Â¡", "¡"], ["Â°", "°"], ["Â·", "·"],
    ["â€“", "–"], ["â€”", "—"], ["â€˜", "‘"], ["â€™", "’"],
    ["â€œ", "“"], ["â€", "”"], ["â€¦", "…"], ["â€¢", "•"],
    ["â†’", "→"], ["â†", "←"], ["âœ…", "✅"], ["âŒ", "❌"]
]);

function repararTexto(texto) {
    let out = texto;
    for (const [bad, good] of replacements) {
        out = out.split(bad).join(good);
    }
    return out;
}

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(p);
            continue;
        }

        if (!/\.(html|js|css|json|txt)$/i.test(entry.name)) continue;

        let content = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
        const fixed = repararTexto(content);

        if (fixed !== content) {
            fs.writeFileSync(p, fixed, "utf8");
            console.log("✅ UTF-8 reparado:", path.relative(root, p));
        }
    }
}

walk(publicDir);

/* =========================================================
   2. AUTH CLIENT: CONSERVAR CÓDIGO DE ERROR Y REENVÍO
========================================================= */

let authClient = fs.readFileSync(authClientPath, "utf8").replace(/^\uFEFF/, "");

if (!authClient.includes("error.codigo =")) {
    authClient = authClient.replace(
        /error\.status\s*=\s*response\.status\s*;/,
        `error.status =
                response.status;

            error.codigo =
                datos?.codigo ||
                null;

            error.datos =
                datos;`
    );
}

if (!authClient.includes("async reenviarVerificacion(")) {
    const marker = `    /* =====================================================
       USUARIO ACTUAL
    ===================================================== */`;

    const method = `    /* =====================================================
       REENVIAR VERIFICACIÓN
    ===================================================== */

    async reenviarVerificacion(
        email
    ) {

        return await this.request(
            "/api/auth/email/resend-verification",
            {
                method: "POST",
                body: JSON.stringify({
                    email
                })
            }
        );

    },


`;

    if (!authClient.includes(marker)) {
        fail("No pude localizar el punto de inserción en auth-client.js.");
    }

    authClient = authClient.replace(marker, method + marker);
}

fs.writeFileSync(authClientPath, authClient, "utf8");

/* =========================================================
   3. LOGIN HTML: ACCIÓN DE REENVÍO
========================================================= */

let loginHtml = fs.readFileSync(loginHtmlPath, "utf8").replace(/^\uFEFF/, "");
loginHtml = repararTexto(loginHtml);

if (!loginHtml.includes('id="verificationActions"')) {
    const alertRegex = /(<div\s+id="loginAlert"[\s\S]*?<\/div>)/i;

    const block = `

            <div
                id="verificationActions"
                hidden
                style="margin: 12px 0 18px 0;"
            >
                <p
                    style="margin: 0 0 10px 0; color: #64748b; font-size: 0.92rem;"
                >
                    ¿No recibiste el correo de verificación?
                </p>

                <button
                    id="resendVerificationButton"
                    type="button"
                    style="
                        width: 100%;
                        border: 1px solid #bfd3f8;
                        background: #eef5ff;
                        color: #0b57d0;
                        border-radius: 10px;
                        padding: 12px 16px;
                        font-weight: 700;
                        cursor: pointer;
                    "
                >
                    Reenviar correo de verificación
                </button>
            </div>`;

    if (!alertRegex.test(loginHtml)) {
        fail("No pude localizar loginAlert en login.html.");
    }

    loginHtml = loginHtml.replace(alertRegex, `$1${block}`);
}

fs.writeFileSync(loginHtmlPath, loginHtml, "utf8");

/* =========================================================
   4. LOGIN JS: MOSTRAR Y ENVIAR VERIFICACIÓN
========================================================= */

let loginJs = fs.readFileSync(loginJsPath, "utf8").replace(/^\uFEFF/, "");
loginJs = repararTexto(loginJs);

if (!loginJs.includes("configurarReenvioVerificacion();")) {
    loginJs = loginJs.replace(
        /configurarPasswordLogin\(\);/,
        `configurarPasswordLogin();

        configurarReenvioVerificacion();`
    );
}

if (!loginJs.includes("function mostrarAccionesVerificacion(")) {
    const marker = `/* =========================================================
   MOSTRAR PASSWORD
========================================================= */`;

    const helper = `/* =========================================================
   REENVÍO DE VERIFICACIÓN
========================================================= */

function mostrarAccionesVerificacion(
    visible
) {

    const acciones =
        document.getElementById(
            "verificationActions"
        );

    if (!acciones) return;

    acciones.hidden =
        !visible;

}


function configurarReenvioVerificacion() {

    const boton =
        document.getElementById(
            "resendVerificationButton"
        );

    boton
        ?.addEventListener(
            "click",
            async () => {

                const email =
                    document
                        .getElementById(
                            "email"
                        )
                        ?.value
                        ?.trim();

                if (!email) {

                    mostrarAlertaLogin(
                        "Ingresa primero tu correo electrónico.",
                        "error"
                    );

                    return;

                }

                const textoOriginal =
                    boton.textContent;

                boton.disabled =
                    true;

                boton.textContent =
                    "Enviando...";

                try {

                    const respuesta =
                        await EduPeruAuth
                            .reenviarVerificacion(
                                email
                            );

                    mostrarAlertaLogin(
                        respuesta?.mensaje ||
                        "Si la cuenta está pendiente de verificación, enviaremos un nuevo enlace.",
                        "success"
                    );

                } catch (error) {

                    mostrarAlertaLogin(
                        error.message ||
                        "No fue posible reenviar el correo de verificación.",
                        "error"
                    );

                } finally {

                    boton.disabled =
                        false;

                    boton.textContent =
                        textoOriginal;

                }

            }
        );

}


`;

    if (!loginJs.includes(marker)) {
        fail("No pude localizar la sección MOSTRAR PASSWORD en login.js.");
    }

    loginJs = loginJs.replace(marker, helper + marker);
}

if (!loginJs.includes('error.codigo === "EMAIL_NO_VERIFICADO"')) {
    const catchRegex = /(\}\s*catch\s*\(error\)\s*\{\s*mostrarAlertaLogin\(\s*error\.message,\s*"error"\s*\);\s*)(\}\s*finally)/m;

    const replacement = `$1

                    const requiereVerificacion =
                        error.codigo === "EMAIL_NO_VERIFICADO" ||
                        String(error.message || "")
                            .toLowerCase()
                            .includes("verificar tu correo");

                    mostrarAccionesVerificacion(
                        requiereVerificacion
                    );

                $2`;

    if (!catchRegex.test(loginJs)) {
        fail("No pude localizar el catch del login para activar el reenvío.");
    }

    loginJs = loginJs.replace(catchRegex, replacement);
}

/* Ocultar la acción cuando se envía un nuevo intento */
if (!loginJs.includes("mostrarAccionesVerificacion(false);")) {
    loginJs = loginJs.replace(
        /setLoadingLogin\(\s*true\s*\);/,
        `mostrarAccionesVerificacion(false);

                setLoadingLogin(
                    true
                );`
    );
}

fs.writeFileSync(loginJsPath, loginJs, "utf8");

console.log("");
console.log("======================================================");
console.log(" EDUPERÚ - REENVÍO VERIFICACIÓN + UTF-8 V1");
console.log("======================================================");
console.log("✅ Botón de reenvío agregado al login");
console.log("✅ Endpoint /api/auth/email/resend-verification conectado");
console.log("✅ Código EMAIL_NO_VERIFICADO preservado en frontend");
console.log("✅ Mojibake UTF-8 reparado en archivos public");
