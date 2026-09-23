/* =========================================================
   LUX ADVANCE — AUTH.JS V10
   Autenticação, cadastro, sessão e perfis
   ========================================================= */

(function () {

  "use strict";

  console.log("[LUX V10] auth.js carregado.");

  window.LUX_AUTH_VERSION = "V10";


  /* =========================================================
     CLIENTE SUPABASE
     ========================================================= */

  function requireClient() {

    const supabase = window.luxSupabase;

    if (!supabase) {

      console.error(
        "[LUX V10] Supabase não inicializado."
      );

      throw new Error(
        "Supabase não foi inicializado. Verifique o config.js."
      );
    }

    return supabase;
  }


  /* =========================================================
     PERFIL PRINCIPAL
     ========================================================= */

  async function getPerfil(userId) {

    const supabase = requireClient();

    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("perfis")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {

      console.error(
        "[LUX V10] Erro ao buscar perfil:",
        error
      );

      return null;
    }

    return data || null;
  }


  /* =========================================================
     PERFIL DA MODELO
     ========================================================= */

  async function getModeloPerfil(userId) {

    const supabase = requireClient();

    if (!userId) {
      return null;
    }

    const { data, error } = await supabase
      .from("modelo_perfis")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {

      console.error(
        "[LUX V10] Erro ao buscar modelo_perfis:",
        error
      );

      return null;
    }

    return data || null;
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
        "[LUX V10] Erro ao obter usuário:",
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

    const supabase = requireClient();

    let id = userId;

    if (!id) {

      const usuario =
        await usuarioAtual();

      if (!usuario) {
        return null;
      }

      id = usuario.id;
    }


    const perfil =
      await getPerfil(id);

    if (perfil?.tipo) {
      return perfil.tipo;
    }


    const modelo =
      await getModeloPerfil(id);

    if (modelo) {
      return "modelo";
    }

    return null;
  }


  /* =========================================================
     LOGIN
     ========================================================= */

  async function login(email, senha) {

    const supabase = requireClient();

    email = String(email || "")
      .trim()
      .toLowerCase();

    senha = String(senha || "");


    if (!email || !senha) {

      throw new Error(
        "Informe seu e-mail e sua senha."
      );
    }


    console.log(
      "[LUX V10] Tentando login:",
      email
    );


    const { data, error } =
      await supabase.auth.signInWithPassword({

        email: email,

        password: senha

      });


    /* =====================================================
       ERRO DE LOGIN
       ===================================================== */

    if (error) {

      console.error(
        "[LUX V10] Erro no login:",
        error
      );


      const mensagemOriginal =
        String(
          error.message || ""
        );


      const mensagemLower =
        mensagemOriginal.toLowerCase();


      if (
        mensagemLower.includes(
          "email not confirmed"
        ) ||
        mensagemLower.includes(
          "email not verified"
        ) ||
        mensagemLower.includes(
          "not confirmed"
        )
      ) {

        throw new Error(
          "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada e confirme o cadastro antes de entrar."
        );
      }


      throw new Error(
        mensagemOriginal ||
        "Não foi possível realizar o login."
      );
    }


    if (!data?.user) {

      throw new Error(
        "O Supabase não retornou o usuário."
      );
    }


    /* =====================================================
       BUSCA PERFIS
       ===================================================== */

    const perfil =
      await getPerfil(
        data.user.id
      );


    const modelo =
      await getModeloPerfil(
        data.user.id
      );


    /* =====================================================
       BLOQUEIO DE CONTA
       ===================================================== */

    const status =
      String(
        perfil?.status || ""
      )
      .trim()
      .toLowerCase();


    if (
      status === "bloqueado" ||
      status === "banido"
    ) {

      await supabase.auth.signOut();

      throw new Error(
        "Esta conta está bloqueada."
      );
    }


    /* =====================================================
       LOGIN CONCLUÍDO
       ===================================================== */

    console.log(
      "[LUX V10] Login realizado:",
      data.user.id
    );


    return {

      success: true,

      user:
        data.user,

      session:
        data.session || null,

      perfil:
        perfil,

      modeloPerfil:
        modelo

    };
  }


  /* =========================================================
     NORMALIZAÇÃO DA CATEGORIA
     ========================================================= */

  function normalizarCategoria(
    categoria
  ) {

    const valor =
      String(
        categoria || ""
      )
      .trim()
      .toLowerCase();


    if (
      valor === "feminino" ||
      valor === "feminina" ||
      valor === "mulher"
    ) {

      return "feminino";
    }


    if (
      valor === "masculino" ||
      valor === "masculina" ||
      valor === "homem"
    ) {

      return "masculino";
    }


    if (
      valor === "lgbtq" ||
      valor === "lgbt" ||
      valor === "lgbtq+"
    ) {

      return "lgbtq";
    }


    return valor;
  }


  /* =========================================================
     URL DE RETORNO DA CONFIRMAÇÃO
     ========================================================= */

  function obterRedirectLogin() {

    try {

      if (
        window.LUX_AUTH_REDIRECT_URL
      ) {

        return (
          window.LUX_AUTH_REDIRECT_URL
        );
      }


      return new URL(
        "./login.html",
        window.location.href
      ).href;

    } catch (erro) {

      console.warn(
        "[LUX V10] Não foi possível calcular redirect:",
        erro
      );

      return null;
    }
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


    console.log(
      "[LUX V10] Iniciando cadastro..."
    );


    tipo =
      String(
        tipo || ""
      )
      .trim()
      .toLowerCase();


    nome =
      String(
        nome || ""
      )
      .trim();


    email =
      String(
        email || ""
      )
      .trim()
      .toLowerCase();


    senha =
      String(
        senha || ""
      );


    extras =
      extras || {};


    /* =====================================================
       VALIDAÇÕES
       ===================================================== */

    if (!tipo) {

      throw new Error(
        "Tipo de usuário não informado."
      );
    }


    if (
      tipo !== "modelo" &&
      tipo !== "usuario"
    ) {

      throw new Error(
        "Tipo de usuário inválido."
      );
    }


    if (!nome) {

      throw new Error(
        "Informe o nome."
      );
    }


    if (!email) {

      throw new Error(
        "Informe o e-mail."
      );
    }


    if (
      !senha ||
      senha.length < 6
    ) {

      throw new Error(
        "A senha deve possuir pelo menos 6 caracteres."
      );
    }


    /* =====================================================
       DADOS ESPECÍFICOS DA MODELO
       ===================================================== */

    let categoria = null;


    if (tipo === "modelo") {

      categoria =
        normalizarCategoria(
          extras.categoria_catalogo
        );


      if (
        categoria !== "feminino" &&
        categoria !== "masculino" &&
        categoria !== "lgbtq"
      ) {

        throw new Error(
          "Selecione uma categoria válida."
        );
      }


      const idade =
        Number(
          extras.idade
        );


      if (
        !Number.isFinite(idade) ||
        idade < 18
      ) {

        throw new Error(
          "A modelo deve possuir 18 anos ou mais."
        );
      }


      if (
        extras.maioridade_confirmada !== true
      ) {

        throw new Error(
          "É necessário confirmar a maioridade."
        );
      }
    }


    /* =====================================================
       METADADOS
       ===================================================== */

    const metadata = {

      nome:
        nome,

      tipo:
        tipo,

      apelido:
        extras.apelido || null,

      whatsapp:
        extras.whatsapp || null,

      cpf:
        extras.cpf || null,

      data_nascimento:
        extras.data_nascimento || null,

      idade:
        extras.idade != null
          ? Number(extras.idade)
          : null,

      altura_cm:
        extras.altura_cm != null
          ? Number(extras.altura_cm)
          : null,

      cep:
        extras.cep || null,

      estado:
        extras.estado
          ? String(
              extras.estado
            )
            .trim()
            .toUpperCase()
          : null,

      cidade:
        extras.cidade || null,

      bairro:
        extras.bairro || null,

      endereco:
        extras.endereco || null,

      numero:
        extras.numero || null,

      complemento:
        extras.complemento || null,

      pais:
        extras.pais || "Brasil",

      cor_cabelo:
        extras.cor_cabelo || null,

      cor_olhos:
        extras.cor_olhos || null,

      idiomas:
        extras.idiomas || null,

      descricao:
        extras.descricao || null,

      categoria_catalogo:
        categoria,

      maioridade_confirmada:
        tipo === "modelo"
          ? true
          : false

    };


    console.log(
      "[LUX V10] Metadados:",
      metadata
    );


    /* =====================================================
       REDIRECT DO E-MAIL
       ===================================================== */

    const redirect =
      obterRedirectLogin();


    /* =====================================================
       CRIAÇÃO NO SUPABASE AUTH
       ===================================================== */

    let resultado;


    try {

      resultado =
        await supabase.auth.signUp({

          email:
            email,

          password:
            senha,

          options: {

            data:
              metadata,

            ...(redirect
              ? {
                  emailRedirectTo:
                    redirect
                }
              : {})

          }

        });

    } catch (erro) {

      console.error(
        "[LUX V10] Exceção no signUp:",
        erro
      );


      throw new Error(
        erro?.message ||
        "Erro de comunicação com o Supabase."
      );
    }


    const data =
      resultado?.data;


    const error =
      resultado?.error;


    /* =====================================================
       ERRO DO SUPABASE
       ===================================================== */

    if (error) {

      console.error(
        "[LUX V10] Erro retornado pelo Supabase:",
        error
      );


      let mensagem =
        error.message ||
        "Não foi possível criar a conta.";


      const mensagemLower =
        String(
          mensagem
        ).toLowerCase();


      if (
        mensagemLower.includes(
          "already registered"
        ) ||
        mensagemLower.includes(
          "already exists"
        ) ||
        error.code ===
          "user_already_exists"
      ) {

        mensagem =
          "Este e-mail já possui cadastro.";
      }


      if (
        error.status === 429
      ) {

        mensagem =
          "Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente.";
      }


      throw new Error(
        mensagem
      );
    }


    /* =====================================================
       USUÁRIO CRIADO
       ===================================================== */

    const user =
      data?.user;


    if (!user) {

      console.error(
        "[LUX V10] signUp não retornou usuário:",
        resultado
      );


      throw new Error(
        "O Supabase não retornou o usuário criado."
      );
    }


    console.log(
      "[LUX V10] Usuário criado:",
      user.id
    );


    /* =====================================================
       CONFIRMAÇÃO DE E-MAIL
       ===================================================== */

    if (!data?.session) {

      console.log(
        "[LUX V10] Confirmação de e-mail necessária."
      );


      return {

        success:
          true,

        id:
          user.id,

        user:
          user,

        session:
          null,

        perfil:
          null,

        modeloPerfil:
          null,

        confirmationRequired:
          true,

        mensagem:
          "Cadastro realizado. Confirme seu e-mail para ativar o acesso."

      };
    }


    /* =====================================================
       BUSCAR PERFIS APÓS CADASTRO
       ===================================================== */

    let perfil =
      null;

    let modeloPerfil =
      null;


    for (
      let tentativa = 1;
      tentativa <= 10;
      tentativa++
    ) {

      console.log(
        `[LUX V10] Procurando perfil ${tentativa}/10`
      );


      perfil =
        await getPerfil(
          user.id
        );


      if (
        tipo === "modelo"
      ) {

        modeloPerfil =
          await getModeloPerfil(
            user.id
          );
      }


      if (
        perfil &&
        (
          tipo !== "modelo" ||
          modeloPerfil
        )
      ) {

        break;
      }


      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            500
          )
      );
    }


    /* =====================================================
       RETORNO
       ===================================================== */

    return {

      success:
        true,

      id:
        user.id,

      user:
        user,

      session:
        data.session || null,

      perfil:
        perfil,

      modeloPerfil:
        modeloPerfil,

      confirmationRequired:
        false,

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
        "[LUX V10] Erro ao sair:",
        error
      );


      throw new Error(
        error.message ||
        "Não foi possível sair."
      );
    }


    window.location.href =
      "./login.html";
  }


  /* =========================================================
     EXPORTAÇÃO GLOBAL
     ========================================================= */

  window.login =
    login;

  window.entrar =
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

  window.requireClient =
    requireClient;

  window.normalizarCategoria =
    normalizarCategoria;


  console.log(
    "[LUX V10] Sistema de autenticação pronto."
  );

})();
