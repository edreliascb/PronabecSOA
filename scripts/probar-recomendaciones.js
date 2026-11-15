const BASE=(process.env.EDUPERU_URL||"http://localhost:3000").replace(/\/$/,"");
const readline=require("readline");
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
const ask=q=>new Promise(r=>rl.question(q,r));
async function req(path,opt={}){const r=await fetch(BASE+path,opt);let d={};try{d=await r.json();}catch{}if(!r.ok)throw new Error(d.mensaje||`HTTP ${r.status}`);return d;}
(async()=>{
 console.log("\n==============================================\n EDUPERÚ - PRUEBA RECOMENDACIONES V1\n==============================================\n");
 console.log("Servidor:",BASE,"\n");
 const email=(await ask("Correo de prueba [usuario@eduperu.pe]: ")).trim()||"usuario@eduperu.pe";
 const password=(await ask("Contraseña del usuario de prueba: ")).trim();
 try{
  console.log("\n1) Iniciando sesión...");
  const login=await req("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,correo:email,password,contrasena:password})});
  const token=login.token||login.resultado?.token||login.accessToken; if(!token)throw new Error("El login no devolvió JWT.");
  console.log("✅ Autenticación correcta");
  const h={Authorization:`Bearer ${token}`};
  console.log("\n2) Consultando perfil...");
  const perfil=await req("/api/perfil",{headers:h});
  console.log(`✅ Perfil disponible${perfil.resultado?.departamento?` - ${perfil.resultado.departamento}`:""}`);
  console.log("\n3) Generando recomendaciones...");
  const data=await req("/api/recomendaciones",{headers:h}); const r=data.resultado||{};
  console.log(`✅ Estado: ${r.estado||"OK"}`);
  console.log(`✅ Recomendaciones generadas: ${r.total??(r.datos||[]).length}`);
  const conv=(r.datos||[]).filter(x=>x.tipo==="CONVOCATORIA").length, car=(r.datos||[]).filter(x=>x.tipo==="CARRERA").length;
  console.log(`   Convocatorias: ${conv} | Carreras: ${car}`);
  if((r.datos||[])[0])console.log(`✅ Mejor coincidencia: ${(r.datos||[])[0].titulo} - ${(r.datos||[])[0].puntaje} pts`);
  if(r.estado==="PERFIL_INCOMPLETO")console.log("⚠️ Completa el perfil para obtener resultados personalizados.");
  console.log("\n4) Verificando favoritos...");
  const fav=await req("/api/favoritos",{headers:h});
  console.log(`✅ Favoritos accesibles: ${fav.total??(fav.resultado||[]).length}`);
  console.log("\n==============================================\n PRUEBA COMPLETADA\n==============================================");
  console.log("Las recomendaciones son orientativas y no representan una decisión oficial de PRONABEC.\n");
 }catch(e){console.error("\n❌ No se pudo completar la operación:",e.message);process.exitCode=1;}finally{rl.close();}
})();
