/* =========================================================
   LUX — CONFIGURAÇÃO SUPABASE
   ========================================================= */

const LUX_SUPABASE_URL =
  "https://lardmkeyyifmgbjrcfhn.supabase.co";

const LUX_SUPABASE_ANON_KEY =
  "sb_publishable_U_Kpn40EXhDrj3Ju9By_Xg_elyY7iB2";


/* =========================================================
   INICIALIZAÇÃO
   ========================================================= */

if (!window.supabase) {

  console.error(
    "Biblioteca Supabase não foi carregada."
  );

  window.luxSupabase = null;

} else {

  try {

    window.luxSupabase =
      window.supabase.createClient(
        LUX_SUPABASE_URL,
        LUX_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

    console.log(
      "LUX: Supabase inicializado com sucesso."
    );

  } catch (erro) {

    console.error(
      "Erro ao inicializar Supabase:",
      erro
    );

    window.luxSupabase = null;

  }

}


/* =========================================================
   ADMINISTRADOR
   ========================================================= */

const LUX_ADMIN_EMAIL =
  "Luxcdam@gmail.com";
