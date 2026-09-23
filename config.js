/* =========================================================
   LUX — CONFIGURAÇÃO SUPABASE
   V5 — CONFIGURAÇÃO CENTRAL
   ========================================================= */

(function () {

  "use strict";

  console.log("[LUX CONFIG V5] Iniciando...");

  /* =======================================================
     CONFIGURAÇÃO DO SUPABASE
     ======================================================= */

  const LUX_SUPABASE_URL =
    "https://lardmkeyyifmgbjrcfhn.supabase.co";

  const LUX_SUPABASE_ANON_KEY =
    "sb_publishable_U_Kpn40EXhDrj3Ju9By_Xg_elyY7iB2";

  const LUX_ADMIN_EMAIL =
    "luxcdam@gmail.com";


  /* =======================================================
     CONFIGURAÇÕES GLOBAIS
     ======================================================= */

  window.LUX_SUPABASE_URL =
    LUX_SUPABASE_URL;

  window.LUX_SUPABASE_ANON_KEY =
    LUX_SUPABASE_ANON_KEY;

  window.LUX_ADMIN_EMAIL =
    LUX_ADMIN_EMAIL;

  window.LUX_CONFIG_VERSION =
    "V5";

  window.LUX_CONFIG_ERRO =
    null;


  /* =======================================================
     VERIFICAÇÃO DA BIBLIOTECA
     ======================================================= */

  if (!window.supabase) {

    console.error(
      "[LUX CONFIG V5] Biblioteca Supabase não carregada."
    );

    window.luxSupabase = null;

    window.LUX_CONFIG_ERRO =
      "Biblioteca Supabase não carregada.";

    return;
  }


  /* =======================================================
     INICIALIZAÇÃO
     ======================================================= */

  try {

    const cliente =
      window.supabase.createClient(
        LUX_SUPABASE_URL,
        LUX_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "pkce"
          }
        }
      );


    window.luxSupabase =
      cliente;


    /* =====================================================
       URL DE RETORNO DO LOGIN
       ===================================================== */

    window.LUX_AUTH_REDIRECT_URL =
      new URL(
        "./login.html",
        window.location.href
      ).href;


    console.log(
      "[LUX CONFIG V5] Supabase inicializado com sucesso."
    );

    console.log(
      "[LUX CONFIG V5] Redirect:",
      window.LUX_AUTH_REDIRECT_URL
    );


  } catch (erro) {

    console.error(
      "[LUX CONFIG V5] Erro ao criar cliente:",
      erro
    );

    window.luxSupabase =
      null;

    window.LUX_CONFIG_ERRO =
      erro &&
      erro.message
        ? erro.message
        : "Erro desconhecido ao inicializar o Supabase.";
  }


})();
