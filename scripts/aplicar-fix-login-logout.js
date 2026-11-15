const fs = require("fs");
const path = require("path");

const root = process.cwd();
const appPath = path.join(root, "app.js");
const publicPath = path.join(root, "public");
const pagesPath = path.join(publicPath, "pages");
const loginJsPath = path.join(publicPath, "js", "login.js");
const authNavTarget = path.join(publicPath, "js", "auth-navigation.js");
const authNavSource = path.join(__dirname, "auth-navigation.js");

function fail(message) {
    console.error("❌", message);
    process.exit(1);
}

if (!fs.existsSync(appPath)) fail("No existe app.js");
if (!fs.existsSync(authNavSource)) fail("No existe scripts/auth-navigation.js");

fs.copyFileSync(authNavSource, authNavTarget);

let app = fs.readFileSync(appPath, "utf8").replace(/^\uFEFF/, "");

// 1) express.static no debe servir index.html automáticamente en "/"
if (!/\{\s*index\s*:\s*false\s*\}/m.test(app)) {
    const staticRegex =
        /express\.static\(\s*(path\.join\(\s*__dirname\s*,\s*["']public["']\s*\))\s*\)/m;

    const multilineRegex =
        /express\.static\(\s*path\.join\(\s*__dirname\s*,\s*["']public["']\s*\)\s*\)/m;

    if (staticRegex.test(app)) {
        app = app.replace(
            staticRegex,
            "express.static($1, { index: false })"
        );
    } else if (multilineRegex.test(app)) {
        app = app.replace(
            multilineRegex,
            'express.static(path.join(__dirname, "public"), { index: false })'
        );
    } else {
        fail("No pude localizar express.static(public) de forma segura.");
    }
}

// 2) "/" -> login
const homeRegex =
    /app\.get\(\s*["']\/["']\s*,\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{[\s\S]*?\n\s*\}\s*\);/m;

const homeReplacement = `app.get(
    "/",
    (req, res) => {
        return res.redirect(
            302,
            "/pages/login.html"
        );
    }
);`;

if (homeRegex.test(app)) {
    app = app.replace(homeRegex, homeReplacement);
} else if (!/\/pages\/login\.html/.test(app)) {
    const marker = "/* =========================================================\n   HOME";
    const pos = app.indexOf(marker);
    if (pos >= 0) {
        app = app.slice(0, pos) + homeReplacement + "\n\n" + app.slice(pos);
    } else {
        fail("No pude localizar la ruta HOME.");
    }
}

fs.writeFileSync(appPath, app, "utf8");

// 3) Si login.js manda a "/", cámbialo a /index.html
if (fs.existsSync(loginJsPath)) {
    let login = fs.readFileSync(loginJsPath, "utf8");

    const replacements = [
        [/window\.location\.href\s*=\s*["']\/["']/g, 'window.location.href = "/index.html"'],
        [/window\.location\.replace\(\s*["']\/["']\s*\)/g, 'window.location.replace("/index.html")'],
        [/window\.location\.assign\(\s*["']\/["']\s*\)/g, 'window.location.assign("/index.html")'],
        [/location\.href\s*=\s*["']\/["']/g, 'location.href = "/index.html"']
    ];

    for (const [regex, replacement] of replacements) {
        login = login.replace(regex, replacement);
    }

    fs.writeFileSync(loginJsPath, login, "utf8");
}

// 4) Inyectar guard / logout seguro en páginas privadas
const publicFiles = new Set([
    "login.html",
    "registro.html",
    "recuperar-password.html",
    "restablecer-password.html",
    "verificar-email.html"
]);

function injectHtml(filePath) {
    let html = fs.readFileSync(filePath, "utf8");

    if (html.includes('/js/auth-navigation.js')) return;

    const tag = '\n<script src="/js/auth-navigation.js?v=1"></script>\n';

    if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `${tag}</body>`);
    } else {
        html += tag;
    }

    fs.writeFileSync(filePath, html, "utf8");
}

const indexPath = path.join(publicPath, "index.html");
if (fs.existsSync(indexPath)) injectHtml(indexPath);

if (fs.existsSync(pagesPath)) {
    for (const name of fs.readdirSync(pagesPath)) {
        if (
            !name.toLowerCase().endsWith(".html") ||
            publicFiles.has(name.toLowerCase())
        ) {
            continue;
        }
        injectHtml(path.join(pagesPath, name));
    }
}

console.log("");
console.log("======================================================");
console.log(" EDUPERÚ - FIX LOGIN / LOGOUT RENDER");
console.log("======================================================");
console.log("✅ / ahora redirige a /pages/login.html");
console.log("✅ express.static ya no captura / con index.html");
console.log("✅ Dashboard privado protegido por token");
console.log("✅ Cerrar sesión limpia el navegador y va al login");
console.log("✅ Login que redirigía a / ahora usa /index.html");
