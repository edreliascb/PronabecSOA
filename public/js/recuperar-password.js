document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const r = await EduPeruAuth.request("/api/auth/password/forgot", { method: "POST", body: JSON.stringify({ email: document.getElementById("email").value.trim() }) });
            alertBox(r.mensaje || "Si el correo existe, recibirás instrucciones.", "success");
        } catch (e) { alertBox(e.message, "error"); } finally { setLoading(false); }
    });
});
function alertBox(m,t){const a=document.getElementById("alert");a.hidden=false;a.className=`auth-alert ${t}`;a.textContent=m;}
function setLoading(v){document.getElementById("btn").disabled=v;document.getElementById("txt").textContent=v?"Enviando...":"Enviar enlace";}
