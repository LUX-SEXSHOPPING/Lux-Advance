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
   CLIENTE SUPABASE
   ========================================================= */

const luxSupabase =
  window.supabase
    ? window.supabase.createClient(
        LUX_SUPABASE_URL,
        LUX_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      )
    : null;


/* =========================================================
   DISPONIBILIZAR SUPABASE NO PROJETO
   ========================================================= */

window.luxSupabase = luxSupabase;


/* =========================================================
   ADMINISTRADOR LUX
   ========================================================= */

const LUX_ADMIN_EMAIL =
  "luxcdam@gmail.com";

window.LUX_ADMIN_EMAIL =
  LUX_ADMIN_EMAIL;
