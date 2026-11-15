const axios = require("axios");
const readline = require("readline");

const BASE = process.env.EDUPERU_URL || "http://localhost:3000";
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const preguntar = (q, d="") => new Promise(r=>rl.question(`${q}${d?` [${d}]`:""}: `,a=>r(a.trim()||d)));

(async()=>{
  try{
    console.log("\n==============================================\n EDUPERÚ - PRUEBA OBSERVABILIDAD + TRACEID\n==============================================\n");
    const correo=await preguntar("Correo de prueba","usuario@eduperu.pe");
    const clave=await preguntar("Contraseña del usuario de prueba","EduPeru2026!");
    console.log("\n1) Iniciando sesión...");
    const login=await axios.post(`${BASE}/api/auth/login`,{email:correo,password:clave});
    const token=login.data?.token||login.data?.accessToken||login.data?.resultado?.token;
    if(!token) throw new Error("Login correcto pero no se encontró token en la respuesta.");
    console.log("✅ Autenticación correcta");

    console.log("\n2) Generando petición con TraceId propio...");
    const traceId=`demo-${Date.now()}`;
    const h={Authorization:`Bearer ${token}`,"X-Trace-Id":traceId};
    const perfil=await axios.get(`${BASE}/api/perfil`,{headers:h});
    const devuelto=perfil.headers["x-trace-id"];
    if(devuelto!==traceId) throw new Error(`TraceId no propagado. Esperado ${traceId}, recibido ${devuelto}`);
    console.log(`✅ TraceId propagado: ${devuelto}`);

    console.log("\n3) Consultando observabilidad...");
    const obs=await axios.get(`${BASE}/api/observabilidad/resumen`,{headers:{Authorization:`Bearer ${token}`}});
    const x=obs.data?.resultado;
    if(!x) throw new Error("No llegó el resumen de observabilidad.");
    console.log(`✅ Peticiones: ${x.totalPeticiones} | Errores: ${x.totalErrores} | Servicios observados: ${x.serviciosObservados}`);

    console.log("\n4) Recuperando la traza específica...");
    const tr=await axios.get(`${BASE}/api/observabilidad/trazas/${encodeURIComponent(traceId)}`,{headers:{Authorization:`Bearer ${token}`}});
    if(!tr.data?.encontrados) throw new Error("La traza generada no fue encontrada.");
    console.log(`✅ Traza encontrada: ${tr.data.encontrados} evento(s)`);
    console.log("\n==============================================\n PRUEBA COMPLETADA\n==============================================\nTraceId + métricas + logs operativos.\n");
  }catch(e){
    console.error("\n❌ No se pudo completar la prueba.");
    console.error(e.response?.data||e.message);
    process.exitCode=1;
  }finally{rl.close()}
})();
