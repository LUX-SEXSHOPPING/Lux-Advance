/* =========================================================
   LUX — AUTENTICAÇÃO
   V3
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

    console.error(
      "Erro ao buscar perfil:",
      error
    );

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

  const perfil =
    await getPerfil(userId);

  if (perfil?.tipo === "modelo") {

    return "modelo";
  }


  /*
   * Compatibilidade:
   *
   * Caso exista um registro em
   * modelo_perfis, a conta também
   * será reconhecida como modelo.
   */

  const modeloPerfil =
    await getModeloPerfil(userId);

  if (modeloPerfil) {

    return "modelo";
  }


  if (perfil?.tipo) {

    return perfil.tipo;
  }


  return null;
}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(email, senha) {

  const supabase = requireClient();

  email =
    String(email || "").trim();


  if (!email || !senha) {

    throw new Error(
      "Informe o e-mail e a senha."
    );
  }


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
      msg.includes(
        "invalid login credentials"
      )
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


  const user =
    data?.user;

  const session =
    data?.session;


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


  const perfil =
    await getPerfil(user.id);


  const modeloPerfil =
    await getModeloPerfil(user.id);


  if (!perfil && !modeloPerfil) {

    await supabase.auth.signOut();

    throw new Error(
      "Sua conta foi criada, mas o perfil ainda não está disponível."
    );
  }


  if (
    perfil &&
    (
      perfil.status === "bloqueado" ||
      perfil.status === "banido"
    )
  ) {

    await supabase.auth.signOut();

    throw new Error(
      "Esta conta está bloqueada."
    );
  }


  /*
   * Determina o tipo real da conta.
   */

  let tipo = null;


  if (
    perfil?.tipo === "modelo" ||
    modeloPerfil
  ) {

    tipo = "modelo";

  } else if (perfil?.tipo) {

    tipo = perfil.tipo;
  }


  return {

    id: user.id,

    user,

    session,

    perfil,

    modeloPerfil,

    tipo,

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

  const supabase =
    requireClient();


  tipo =
    String(tipo || "")
      .trim()
      .toLowerCase();


  nome =
    String(nome || "")
      .trim();


  email =
    String(email || "")
      .trim();


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


  /* =======================================================
     DADOS EXTRAS
     ======================================================= */

  const idade =
    Number(extras.idade) || null;


  const alturaCm =
    Number(extras.altura_cm) || null;


  const cidade =
    String(
      extras.cidade || ""
    ).trim();


  const pais =
    String(
      extras.pais || "Brasil"
    ).trim();


  const corCabelo =
    String(
      extras.cor_cabelo || ""
    ).trim();


  const corOlhos =
    String(
      extras.cor_olhos || ""
    ).trim();


  const idiomas =
    String(
      extras.idiomas || ""
    ).trim();


  const descricao =
    String(
      extras.descricao || ""
    ).trim();


  const maioridadeConfirmada =
    extras.maioridade_confirmada === true;


  /* =======================================================
     METADADOS DO USUÁRIO AUTH
     
     Os campos abaixo não existem atualmente em
     modelo_perfis, então ficam nos metadados da conta.
     ======================================================= */

  const metadata = {

    nome,

    tipo,

    apelido:
      String(
        extras.apelido || ""
      ).trim(),

    whatsapp:
      String(
        extras.whatsapp || ""
      ).trim(),

    idade,

    altura_cm:
      alturaCm,

    cidade,

    estado:
      String(
        extras.estado || ""
      ).trim(),

    pais,

    endereco:
      String(
        extras.endereco || ""
      ).trim(),

    cor_cabelo:
      corCabelo,

    cor_olhos:
      corOlhos,

    idiomas,

    descricao,

    maioridade_confirmada:
      maioridadeConfirmada

  };


  /* =======================================================
     CRIA CONTA AUTH
     ======================================================= */

  const {
    data,
    error
  } = await supabase.auth.signUp({

    email,

    password: senha,

    options: {

      data: metadata

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
      msg.includes(
        "already registered"
      ) ||
      msg.includes(
        "already exists"
      )
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


  const user =
    data?.user;


  if (!user) {

    throw new Error(
      "Não foi possível criar o usuário."
    );
  }


  /* =======================================================
     PERFIL PRINCIPAL
     ======================================================= */

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


    /*
     * Se o perfil não puder ser criado,
     * não escondemos o erro.
     */

    throw new Error(
      "A conta foi criada, mas houve um problema ao criar o perfil. Entre em contato com o administrador."
    );
  }


  /* =======================================================
     CADASTRO ESPECÍFICO DA MODELO
     ======================================================= */

  if (tipo === "modelo") {


    if (!idade || idade < 18) {

      throw new Error(
        "A idade da modelo deve ser informada e ser igual ou superior a 18 anos."
      );
    }


    if (!maioridadeConfirmada) {

      throw new Error(
        "É necessário confirmar a maioridade."
      );
    }


    /*
     * IMPORTANTE:
     *
     * Estes são somente campos que existem
     * atualmente na tabela modelo_perfis.
     */

    const modeloPerfil = {

      id: user.id,

      nome_exibicao:
        nome,

      idade:

        idade,

      cidade:
        cidade || null,

      pais:
        pais || "Brasil",

      cor_cabelo:
        corCabelo || null,

      cor_olhos:
        corOlhos || null,

      altura_cm:
        alturaCm,

      idiomas:
        idiomas || null,

      descricao:
        descricao || null,

      maioridade_confirmada:
        true,

      verificacao_status:
        "pendente",

      plano:
        "ESSENCE"

    };


    const {
      data: modeloCriado,
      error: modeloError
    } = await supabase
      .from("modelo_perfis")
      .insert(modeloPerfil)
      .select()
      .single();


    if (modeloError) {

      console.error(
        "Erro ao criar modelo_perfis:",
        modeloError
      );


      throw new Error(
        "Sua conta foi criada, mas houve um problema ao criar os dados do modelo. Entre em contato com o administrador."
      );
    }


    return {

      success: true,

      id: user.id,

      user,

      perfil:
        perfilCriado,

      modeloPerfil:
        modeloCriado,

      mensagem:
        "Cadastro realizado. Seu perfil ficará aguardando análise."

    };
  }


  /* =======================================================
     CADASTRO DE USUÁRIO
     ======================================================= */

  return {

    success: true,

    id: user.id,

    user,

    perfil:
      perfilCriado,

    mensagem:
      "Cadastro realizado com sucesso."

  };
}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout() {

  const supabase =
    requireClient();


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
