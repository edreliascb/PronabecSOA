const fs = require("fs");

let errors = 0;
const ok = t => console.log("✅", t);
const fail = t => { console.log("❌", t); errors++; };

const app = fs.readFileSync("app.js", "utf8");

console.log("");
console.log("======================================================");
console.log(" EDUPERÚ - VERIFICAR LOGIN / LOGOUT");
console.log("======================================================");

if (/express\.static\([\s\S]*?\{\s*index\s*:\s*false\s*\}/m.test(app)) {
    ok("express.static index:false");
} else {
    fail("express.static todavía puede servir index.html en /");
}

if (/res\.redirect\([\s\S]*?["']\/pages\/login\.html["']/m.test(app)) {
    ok("/ redirige al login");
} else {
    fail("No se detectó redirección / -> login");
}

if (fs.existsSync("public/js/auth-navigation.js")) {
    ok("auth-navigation.js instalado");
} else {
    fail("Falta auth-navigation.js");
}

const index = fs.readFileSync("public/index.html", "utf8");

if (index.includes("/js/auth-navigation.js")) {
    ok("Dashboard tiene guard de autenticación");
} else {
    fail("Dashboard no carga auth-navigation.js");
}

console.log("------------------------------------------------------");

if (errors === 0) {
    console.log("RESULTADO: FIX LOGIN / LOGOUT OK ✅");
    process.exit(0);
}

console.log(`RESULTADO: REVISAR — ${errors} problema(s) ❌`);
process.exit(1);
