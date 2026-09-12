/* =========================================================
   LUX — AUTENTICAÇÃO
   V3 CORRIGIDA
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
   PERFIL PRINCIPAL
   ========================================================= */

async function getPerfil(userId) {

  const supabase = requireClient();

  const { data, error } = await supabase
    .from("perfis")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar perfil:", error);
    throw error;
  }

  return data;
}


/* =========================================================
   DADOS DA MODELO
   ========================================================= */

async function getModeloPerfil(userId) {

  const supabase = requireClient();

  const { data, error } = await supabase
    .from("modelo_perfis")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao buscar modelo_perfis:",
      error
    );

    return null;
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
    console.error(
      "Erro ao identificar usuário:",
      error
    );

    return null;
  }

  return data?.user || null;
}


/* =========================================================
   TIPO DO USUÁRIO
   ========================================================= */

async function getTipoUsuario(userId) {

  const perfil = await getPerfil(userId);

  if (!perfil) {
    return null;
  }

  return perfil.tipo || null;
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


  /* =====================================================
     AUTENTICAÇÃO
     ===================================================== */

  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({

    email,
    password: senha

  });


  if (error) {

    console.error(
      "Erro Supabase:",
      error
    );

    const msg =
      error.message?.toLowerCase() || "";

    if (
      msg.includes("invalid login credentials")
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
     BUSCA PERFIL PRINCIPAL
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
     VERIFICA STATUS
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
     RETORNO COMPATÍVEL COM login.html
     ===================================================== */

  return {

    id: user.id,

    user,

    session,

    perfil,

    success: true

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
     PERFIL PRINCIPAL
     ===================================================== */

  const perfilBase = {

    id: user.id,

    tipo,

    nome,

    status:
      tipo === "modelo"
        ? "pendente"
        : "ativo"

  };


  const {
    data: perfilCriado,
    error: perfilError
  } = await supabase
    .from("perfis")
    .insert(perfilBase)
    .select()
    .single();


  if (perfilError) {

    console.error(
      "Erro ao criar perfil:",
      perfilError
    );

    throw new Error(
      "A conta foi criada, mas houve um problema ao criar o perfil. Entre em contato com o administrador."
    );

  }


  /* =====================================================
     MODELO
     ===================================================== */

  if (tipo === "modelo") {

    /*
     * Os dados específicos da modelo são enviados
     * separadamente para modelo_perfis.
     */

    const modeloPerfil = {

      id: user.id,

      ...extras

    };


    const {
      error: modeloError
    } = await supabase
      .from("modelo_perfis")
      .insert(modeloPerfil);


    if (modeloError) {

      console.error(
        "Erro ao criar modelo_perfis:",
        modeloError
      );

      /*
       * O perfil principal já existe.
       * Não apagamos a conta Auth.
       */

      throw new Error(
        "Sua conta foi criada, mas houve um problema ao criar os dados do modelo. Entre em contato com o administrador."
      );

    }


    return {

      success: true,

      id: user.id,

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

    id: user.id,

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

window.getModeloPerfil =
  getModeloPerfil;

window.getTipoUsuario =
  getTipoUsuario;
