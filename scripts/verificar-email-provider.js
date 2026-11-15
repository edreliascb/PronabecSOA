require("dotenv").config();

const emailService =
    require("../src/services/email.service");

(async () => {
    try {
        console.log("");
        console.log("==============================================");
        console.log(" EDUPERÚ - VERIFICAR EMAIL PROVIDER");
        console.log("==============================================");

        const estado =
            emailService.obtenerEstadoConfiguracion();

        console.log(
            "Modo:",
            estado.modo
        );

        console.log(
            "Proveedor configurado:",
            estado.proveedorConfigurado
        );

        console.log(
            "APP_BASE_URL:",
            estado.appBaseUrl
        );

        const proveedor =
            await emailService.probarProveedor();

        console.log(
            "✅ Proveedor disponible:",
            proveedor.proveedor
        );

        console.log("----------------------------------------------");
        console.log("RESULTADO: EMAIL PROVIDER OK ✅");

    } catch (error) {
        console.error("");
        console.error(
            "❌ EMAIL PROVIDER ERROR:",
            error.message
        );
        process.exitCode = 1;
    }
})();
