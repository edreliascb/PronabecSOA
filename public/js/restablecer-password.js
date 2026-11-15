document.addEventListener("DOMContentLoaded", () => {
    const token = new URLSearchParams(location.search).get("token") || "";
    if (!token) alertBox("El enlace no contiene un token válido.", "error");
    document.getElementById("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("password").value;
        const confirm = document.getElementById("confirm").value;
        if (password !== confirm) return alertBox("Las contraseñas no coinciden.", "error");
        try {
            const r = await EduPeruAuth.request("/api/auth/password/reset", { method: "POST", body: JSON.stringify({ token, password }) });
            alertBox(r.mensaje, "success");
            setTimeout(() => location.href="/pages/login.html", 1200);
        } catch (e) { alertBox(e.message, "error"); }
    });
});
function alertBox(m,t){const a=document.getElementById("alert");a.hidden=false;a.className=`auth-alert ${t}`;a.textContent=m;}
