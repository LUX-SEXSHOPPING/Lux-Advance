/* =========================================================
   LUX — AUTENTICAÇÃO
   V3 ATUALIZADA
   ========================================================= */


/* =========================================================
   CLIENTE SUPABASE
   ========================================================= */

function requireClient() {

  const client = window.luxSupabase;

  if (!client) {

    throw new Error(
      "Supabase não foi inicializado. Verifique o config.js."
    );

  }

  return client;
}


/* =========================================================
   PERFIL DO USUÁRIO
   ========================================================= */

async function getPerfil(userId) {

  const supabase = requireClient();

  const { data, error } = await supabase
    .from("modelo_perfis")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}


/* =========================================================
   USUÁRIO ATUAL
   ========================================================= */

async function usuarioAtual() {

  const supabase = requireClient();

  const { data, error } =
    await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data?.user || null;
}


/* =========================================================
   TIPO DO USUÁRIO
   ========================================================= */

async function getTipoUsuario(userId) {

  const perfil = await getPerfil(userId);

  return perfil?.tipo || null;
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(email, senha) {

  const supabase = requireClient();

  email = String(email || "").trim();

  if (!email || !senha) {

    throw new Error(
      "Informe o e-mail e a senha."
    );

  }


  const { data, error } =
    await supabase.auth.signInWithPassword({

      email,
      password: senha

    });


  if (error) {

    console.error(
      "Erro Supabase:",
      error
    );

    if (
      error.message?.toLowerCase()
        .includes("invalid login credentials")
    ) {

      throw new Error(
        "E-mail ou senha incorretos."
      );

    }

    throw new Error(
      error.message ||
      "Não foi possível realizar o login."
    );

  }


  const user = data?.user;

  const session = data?.session;


  if (!user) {

    throw new Error(
      "Usuário não encontrado."
    );

  }


  if (!session) {

    throw new Error(
      "Sessão não criada. Tente novamente."
    );

  }


  /* =====================================================
     BUSCA O PERFIL
     ===================================================== */

  const perfil =
    await getPerfil(user.id);


  if (!perfil) {

    await supabase.auth.signOut();

    throw new Error(
      "Sua conta foi criada, mas o perfil ainda não está disponível."
    );

  }


  /* =====================================================
     CONTA BLOQUEADA
     ===================================================== */

  if (
    perfil.status === "bloqueado" ||
    perfil.status === "banido"
  ) {

    await supabase.auth.signOut();

    throw new Error(
      "Esta conta está bloqueada."
    );

  }


  /* =====================================================
     RETORNO
     ===================================================== */

  return {

    success: true,

    user,

    session,

    perfil

  };

}


/* =========================================================
   CADASTRO
   ========================================================= */

async function cadastrar(
  tipo,
  nome,
  email,
  senha,
  extras = {}
) {

  const supabase = requireClient();

  tipo = String(tipo || "")
    .trim()
    .toLowerCase();

  nome = String(nome || "").trim();

  email = String(email || "").trim();


  /* =====================================================
     VALIDAÇÕES
     ===================================================== */

  if (!nome) {

    throw new Error(
      "Informe seu nome."
    );

  }


  if (!email) {

    throw new Error(
      "Informe seu e-mail."
    );

  }


  if (!senha || senha.length < 6) {

    throw new Error(
      "A senha deve possuir pelo menos 6 caracteres."
    );

  }


  if (
    tipo !== "modelo" &&
    tipo !== "usuario"
  ) {

    throw new Error(
      "Tipo de cadastro inválido."
    );

  }


  /* =====================================================
     CRIA USUÁRIO AUTH
     ===================================================== */

  const {
    data,
    error
  } = await supabase.auth.signUp({

    email,

    password: senha,

    options: {

      data: {

        nome,

        tipo

      }

    }

  });


  if (error) {

    console.error(
      "Erro ao cadastrar:",
      error
    );

    const msg =
      error.message?.toLowerCase() || "";


    if (
      msg.includes("already registered") ||
      msg.includes("already exists")
    ) {

      throw new Error(
        "Este e-mail já está cadastrado."
      );

    }


    throw new Error(
      error.message ||
      "Não foi possível criar a conta."
    );

  }


  const user = data?.user;


  if (!user) {

    throw new Error(
      "Não foi possível criar o usuário."
    );

  }


  /* =====================================================
     CRIA PERFIL
     ===================================================== */

  const perfil = {

    id: user.id,

    tipo,

    nome,

    email,

    ...extras

  };


  const {
    data: perfilCriado,
    error: perfilError
  } = await supabase
    .from("modelo_perfis")
    .insert(perfil)
    .select()
    .single();


  if (perfilError) {

    console.error(
      "Erro ao criar perfil:",
      perfilError
    );

    /*
     * Não apagamos o usuário Auth automaticamente.
     * Isso evita problemas caso a confirmação de e-mail
     * esteja ativada no Supabase.
     */

    throw new Error(
      "A conta foi criada, mas houve um problema ao criar o perfil. Entre em contato com o administrador."
    );

  }


  /* =====================================================
     MODELO — STATUS INICIAL
     ===================================================== */

  if (tipo === "modelo") {

    return {

      success: true,

      user,

      perfil: perfilCriado,

      mensagem:
        "Cadastro realizado. Seu perfil ficará aguardando análise."

    };

  }


  /* =====================================================
     USUÁRIO NORMAL
     ===================================================== */

  return {

    success: true,

    user,

    perfil: perfilCriado,

    mensagem:
      "Cadastro realizado com sucesso."

  };

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  const supabase = requireClient();

  const { error } =
    await supabase.auth.signOut();

  if (error) {

    console.error(
      "Erro ao sair:",
      error
    );

    throw error;

  }

}


/* =========================================================
   EXPORTAÇÕES GLOBAIS
   ========================================================= */

window.login =
  login;

window.cadastrar =
  cadastrar;

window.logout =
  logout;

window.usuarioAtual =
  usuarioAtual;

window.getPerfil =
  getPerfil;

window.getTipoUsuario =
  getTipoUsuario;
