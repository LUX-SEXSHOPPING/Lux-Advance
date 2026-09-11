function requireClient() {

  if (!luxSupabase) {
    throw new Error(
      "Supabase não configurado. Verifique config.js."
    );
  }

  return luxSupabase;
}


/* =========================================================
   MENSAGENS DE ERRO
   ========================================================= */

function friendlyAuthError(error) {

  const msg =
    (error?.message || "").toLowerCase();

  if (
    msg.includes("invalid login credentials")
  ) {
    return "E-mail ou senha incorretos.";
  }

  if (
    msg.includes("email not confirmed")
  ) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (
    msg.includes("user already registered")
  ) {
    return "Este e-mail já está cadastrado.";
  }

  if (
    msg.includes("password should be at least")
  ) {
    return "A senha deve ter pelo menos 6 caracteres.";
  }

  return (
    error?.message ||
    "Não foi possível concluir a operação."
  );
}


/* =========================================================
   CADASTRO
   ========================================================= */

async function cadastrar(
  tipo,
  nome,
  email,
  senha
) {

  const db = requireClient();

  const {
    data,
    error
  } = await db.auth.signUp({

    email,

    password: senha,

    options: {
      data: {
        tipo,
        nome
      }
    }

  });

  if (error) {

    throw new Error(
      friendlyAuthError(error)
    );

  }

  if (data.user) {

    try {

      await criarPerfilUsuario(
        data.user.id,
        tipo,
        nome,
        email
      );

    } catch (erro) {

      console.error(
        "Erro ao criar perfil:",
        erro
      );

    }

  }

  return data.user;
}


/* =========================================================
   CRIAÇÃO DO PERFIL
   ========================================================= */

async function criarPerfilUsuario(
  userId,
  tipo,
  nome,
  email
) {

  const db = requireClient();


  /* =====================================================
     MODELO
     ===================================================== */

  if (tipo === "modelo") {

    const {
      error
    } = await db
      .from("perfis")
      .insert({

        id: userId,

        tipo: "modelo",

        nome: nome,

        email: email,

        status: "pendente",

        data_cadastro:
          new Date().toISOString(),

        fotos: [],

        video: null,

        bio: "",

        altura: "",

        idade: 0,

        cidade: "",

        disponivel: false,

        approved_at: null

      });


    if (error) {

      console.error(
        "Erro ao criar perfil modelo:",
        error
      );

    }


    /* NOTIFICAÇÃO ADMIN */

    try {

      await enviarEmailNovoModelo(
        nome,
        email
      );

    } catch (erro) {

      console.error(
        "Erro na notificação:",
        erro
      );

    }

  }


  /* =====================================================
     USUÁRIO
     ===================================================== */

  else {

    const {
      error
    } = await db
      .from("perfis")
      .insert({

        id: userId,

        tipo: "usuario",

        nome: nome,

        email: email,

        status: "ativo",

        data_cadastro:
          new Date().toISOString()

      });


    if (error) {

      console.error(
        "Erro ao criar perfil usuário:",
        error
      );

    }

  }

}


/* =========================================================
   NOTIFICAÇÃO DE NOVO MODELO
   ========================================================= */

async function enviarEmailNovoModelo(
  nome,
  email
) {

  const db = requireClient();

  try {

    const response =
      await db.functions.invoke(
        "enviar-email-novo-modelo",
        {

          body: {

            nome_modelo: nome,

            email_modelo: email,

            admin_email:
              LUX_ADMIN_EMAIL,

            timestamp:
              new Date().toISOString()

          }

        }
      );

    console.log(
      "Email de notificação enviado:",
      response
    );

  } catch (erro) {

    console.error(
      "Erro ao enviar email:",
      erro
    );

  }

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(
  email,
  senha
) {

  const db = requireClient();

  const {
    data,
    error
  } =
    await db.auth.signInWithPassword({

      email,

      password: senha

    });


  if (error) {

    throw new Error(
      friendlyAuthError(error)
    );

  }


  return data.user;
}


/* =========================================================
   PERFIL
   ========================================================= */

async function getPerfil(id) {

  const db = requireClient();

  const {
    data,
    error
  } =
    await db
      .from("perfis")
      .select("*")
      .eq("id", id)
      .single();


  if (error) {

    throw error;

  }


  return data;
}


/* =========================================================
   TIPO DE USUÁRIO
   ========================================================= */

async function getTipoUsuario(id) {

  const p =
    await getPerfil(id);


  if (
    p.tipo === "modelo" &&
    ![
      "aprovado",
      "ativo"
    ].includes(p.status)
  ) {

    throw new Error(
      "Seu cadastro de modelo está aguardando aprovação da administração."
    );

  }


  return p.tipo;
}


/* =========================================================
   USUÁRIO ATUAL
   ========================================================= */

async function usuarioAtual() {

  const db = requireClient();

  const {
    data: {
      user
    }
  } =
    await db.auth.getUser();


  return user;
}


/* =========================================================
   SAIR
   ========================================================= */

async function sair() {

  const db = requireClient();

  await db.auth.signOut();

  location.href =
    "login.html";
}


/* =========================================================
   PROTEÇÃO DE PÁGINAS
   ========================================================= */

async function proteger(
  tipoEsperado
) {

  const user =
    await usuarioAtual();


  if (!user) {

    location.href =
      "login.html";

    return null;

  }


  const tipo =
    await getTipoUsuario(
      user.id
    );


  if (tipo !== tipoEsperado) {

    if (tipo === "modelo
