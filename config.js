/* =========================================================
   LUX — CONFIGURAÇÃO SUPABASE
   ========================================================= */

const LUX_SUPABASE_URL =
  "https://lardmkeyyifmgbjrcfhn.supabase.co";

const LUX_SUPABASE_ANON_KEY =
  "sb_publishable_U_Kpn40EXhDrj3Ju9By_Xg_elyY7iB2";


/* =========================================================
   VERIFICAÇÃO DA BIBLIOTECA SUPABASE
   ========================================================= */

if (!window.supabase) {
  console.error(
    "Biblioteca Supabase não foi carregada."
  );
}


/* =========================================================
   CRIAR CLIENTE SUPABASE
   ========================================================= */

const luxSupabase =
  window.supabase
    ? window.supabase.createClient(
        LUX_SUPABASE_URL,
        LUX_SUPABASE_ANON_KEY
      )
    : null;


/* =========================================================
   DISPONIBILIZAR PARA O AUTH.JS
   ========================================================= */

window.luxSupabase = luxSupabase;


/* =========================================================
   E-MAIL DO ADMINISTRADOR
   ========================================================= */

const LUX_ADMIN_EMAIL =
  "Luxcdam@gmail.com";
