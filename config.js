/* =========================================================
   LUX — CONFIGURAÇÃO SUPABASE
   ========================================================= */

const LUX_SUPABASE_URL =
  "https://lardmkeyyifmgbjrcfhn.supabase.co";

const LUX_SUPABASE_ANON_KEY =
  "sb_publishable_U_Kpn40EXhDrj3Ju9By_Xg_elyY7iB2";


/* =========================================================
   VERIFICAÇÃO DA BIBLIOTECA
   ========================================================= */

if (!window.supabase) {

  console.error(
    "Biblioteca Supabase não foi carregada."
  );

}


/* =========================================================
   CLIENTE SUPABASE
   ========================================================= */

if (
  window.supabase &&
  LUX_SUPABASE_URL.startsWith("https://") &&
  LUX_SUPABASE_ANON_KEY.startsWith("sb_publishable_")
) {

  window.luxSupabase =
    window.supabase.createClient(
      LUX_SUPABASE_URL,
      LUX_SUPABASE_ANON_KEY
    );

} else {

  window.luxSupabase = null;

  console.error(
    "Não foi possível inicializar o Supabase."
  );

}


/* =========================================================
   E-MAIL ADMINISTRADOR
   ========================================================= */

const LUX_ADMIN_EMAIL =
  "Luxcdam@gmail.com";
