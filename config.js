// =========================================================
// CONFIGURAÇÃO DO SUPABASE — LUX
// =========================================================

const LUX_SUPABASE_URL =
  "https://lardmkeyyifmgbjrcfhn.supabase.co";

const LUX_SUPABASE_ANON_KEY =
  "sb_publishable_U_Kpn40EXhDrj3Ju9By_Xg_elyY7iB2";


// =========================================================
// VERIFICAÇÃO DA BIBLIOTECA SUPABASE
// =========================================================

if (!window.supabase) {

  console.error(
    "Biblioteca Supabase não carregada."
  );

}


// =========================================================
// CLIENTE SUPABASE
// =========================================================

const luxSupabase =
  (
    window.supabase &&
    LUX_SUPABASE_URL.startsWith("https://") &&
    LUX_SUPABASE_ANON_KEY.startsWith("sb_publishable_")
  )

    ? window.supabase.createClient(
        LUX_SUPABASE_URL,
        LUX_SUPABASE_ANON_KEY
      )

    : null;


// =========================================================
// E-MAIL DO ADMINISTRADOR
// =========================================================

const LUX_ADMIN_EMAIL =
  "Luxcdam@gmail.com";
