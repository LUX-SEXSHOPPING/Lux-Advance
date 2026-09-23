/* =========================================================
   LUX — CONFIGURAÇÃO SUPABASE
   VERSÃO 4 — INICIALIZAÇÃO FORÇADA
   ========================================================= */

(function () {

  "use strict";

  console.log("[LUX CONFIG V4] Iniciando config.js...");

  /* =======================================================
     DADOS DO SUPABASE
     ======================================================= */

  const LUX_SUPABASE_URL =
    "https://lardmkeyyifmgbjrcfhn.supabase.co";

  const LUX_SUPABASE_ANON_KEY =
    "sb_publishable_U_Kpn40EXhDrj3Ju9By_Xg_elyY7iB2";


  /* =======================================================
     VERIFICAR BIBLIOTECA
     ======================================================= */

  if (!window.supabase) {

    console.error(
      "[LUX CONFIG V4] Biblioteca Supabase NÃO foi carregada."
    );

    window.luxSupabase = null;

    window.LUX_CONFIG_ERRO =
      "Biblioteca Supabase não carregada.";

    return;
  }


  /* =======================================================
     CRIAR CLIENTE
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
            detectSessionInUrl: true
          }
        }
      );


    /* =====================================================
       DISPONIBILIZAR GLOBALMENTE
       ===================================================== */

    window.luxSupabase = cliente;

    window.LUX_SUPABASE_URL =
      LUX_SUPABASE_URL;


    window.LUX_SUPABASE_ANON_KEY =
      LUX_SUPABASE_ANON_KEY;


    window.LUX_CONFIG_ERRO =
      null;


    console.log(
      "[LUX CONFIG V4] Supabase inicializado com sucesso."
    );


  } catch (erro) {

    console.error(
      "[LUX CONFIG V4] Erro ao criar cliente Supabase:",
      erro
    );

    window.luxSupabase = null;

    window.LUX_CONFIG_ERRO =
      erro.message || "Erro desconhecido.";

  }


  /* =======================================================
     ADMINISTRADOR
     ======================================================= */

  window.LUX_ADMIN_EMAIL =
    "luxcdam@gmail.com";


  /* =======================================================
     MARCADOR DE VERSÃO
     ======================================================= */

  window.LUX_CONFIG_VERSION =
    "V4";


})();
