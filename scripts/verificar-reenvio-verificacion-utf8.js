const fs = require("fs");
const path = require("path");

const root = process.cwd();
const loginHtml = fs.readFileSync(
    path.join(root, "public", "pages", "login.html"),
    "utf8"
);
const loginJs = fs.readFileSync(
    path.join(root, "public", "js", "login.js"),
    "utf8"
);
const authClient = fs.readFileSync(
    path.join(root, "public", "js", "auth-client.js"),
    "utf8"
);

let ok = true;

function check(cond, msg) {
    if (cond) {
        console.log("✅", msg);
    } else {
        console.error("❌", msg);
        ok = false;
    }
}

check(
    loginHtml.includes('id="verificationActions"'),
    "Login contiene acciones de verificación"
);

check(
    loginHtml.includes('id="resendVerificationButton"'),
    "Login contiene botón de reenvío"
);

check(
    loginJs.includes("reenviarVerificacion("),
    "Login JS llama al reenvío"
);

check(
    loginJs.includes('EMAIL_NO_VERIFICADO'),
    "Login detecta EMAIL_NO_VERIFICADO"
);

check(
    authClient.includes('"/api/auth/email/resend-verification"'),
    "Auth client usa endpoint correcto"
);

check(
    authClient.includes("error.codigo"),
    "Auth client conserva código del backend"
);

const bad = [
    "sesiÃ",
    "contraseÃ",
    "EduPerÃ",
    "electrÃ",
    "TodavÃ",
    "AutenticaciÃ"
];

const publicDir = path.join(root, "public");
let badFiles = [];

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(p);
            continue;
        }
        if (!/\.(html|js|css)$/i.test(entry.name)) continue;
        const text = fs.readFileSync(p, "utf8");
        if (bad.some(x => text.includes(x))) {
            badFiles.push(path.relative(root, p));
        }
    }
}

walk(publicDir);

check(
    badFiles.length === 0,
    badFiles.length
        ? `Quedan textos dañados: ${badFiles.join(", ")}`
        : "No quedan patrones comunes de mojibake"
);

if (!ok) process.exit(1);

console.log("");
console.log("RESULTADO: FIX VERIFICADO ✅");
