document.addEventListener("DOMContentLoaded", async () => {
    const token = new URLSearchParams(location.search).get("token") || "";
    if (token) {
        try {
            const r = await EduPeruAuth.request("/api/auth/email/verify", { method: "POST", body: JSON.stringify({ token }) });
            show(r.mensaje, "success"); document.getElementById("estado").textContent = "Tu correo ya está verificado.";
        } catch (e) { show(e.message, "error"); document.getElementById("estado").textContent = "No pudimos verificar el enlace."; }
    } else document.getElementById("estado").textContent = "No se encontró un token de verificación.";

    document.getElementById("resendForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
            const r = await EduPeruAuth.request("/api/auth/email/resend-verification", { method: "POST", body: JSON.stringify({ email: document.getElementById("email").value.trim() }) });
            show(r.mensaje, "success");
        } catch (e) { show(e.message, "error"); }
    });
});
function show(m,t){const a=document.getElementById("alert");a.hidden=false;a.className=`auth-alert ${t}`;a.textContent=m;}
