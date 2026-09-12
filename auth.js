/* =========================================================
   LUX — SISTEMA DE AUTENTICAÇÃO
   ========================================================= */

(function () {

  "use strict";


  /* =========================================================
     VERIFICAÇÃO DO CLIENTE SUPABASE
     ========================================================= */

  function requireClient() {

    if (!window.luxSupabase) {

      throw new Error(
        "Supabase não foi inicializado. Verifique config.js."
      );

    }

    return window.luxSupabase;
  }


  /* =========================================================
     TRATAMENTO DE ERROS
     ========================================================= */

  function friendlyAuthError(error) {

    if (!error) {
      return "Ocorreu um erro inesperado.";
    }

    const message =
      error.message ||
      error.error_description ||
      String(error);

    const lower = message.toLowerCase();

    if (
      lower.includes("user already registered") ||
      lower.includes("already registered")
    ) {
      return "Este e-mail já está cadastrado.";
    }

    if (
      lower.includes("invalid login credentials")
    ) {
      return "E-mail ou senha incorretos.";
    }

    if (
      lower.includes("email not confirmed")
    ) {
      return "Seu e-mail ainda não foi confirmado.";
    }

    if (
      lower.includes("password should be at least")
    ) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    if (
      lower.includes("invalid email")
    ) {
      return "Digite um e-mail válido.";
    }

    if (
      lower.includes("rate limit")
    ) {
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    }

    if (
      lower.includes("failed to fetch")
    ) {
      return "Não foi possível conectar ao servidor. Verifique sua internet.";
    }

    return message;
  }


  /* =========================================================
     CADASTRO
     ========================================================= */

  async function cadastrar(
    tipo,
    nome,
    email,
    senha,
    dadosExtras = {}
  ) {

    try {

      const supabase = requireClient();

      tipo = tipo === "modelo"
        ? "modelo"
        : "usuario";

      nome = String(nome || "").trim();
      email = String(email || "").trim().toLowerCase();
      senha = String(senha || "");

      if (!nome) {
        throw new Error("Digite seu nome.");
      }

      if (!email) {
        throw new Error("Digite seu e-mail.");
      }

      if (senha.length < 6) {
        throw new Error(
          "A senha precisa ter pelo menos 6 caracteres."
        );
      }


      /* -------------------------------------------------------
         METADATA
         O trigger do SUPABASE.sql lê esses dados.
         ------------------------------------------------------- */

      const metadata = {
        nome: nome,
        tipo: tipo
      };


      /* Dados adicionais para modelos */

      if (tipo === "modelo") {

        metadata.maioridade_confirmada =
          dadosExtras.maioridade_confirmada === true;

        if (dadosExtras.idade !== undefined) {
          metadata.idade = String(dadosExtras.idade);
        }

        if (dadosExtras.cidade) {
          metadata.cidade = String(dadosExtras.cidade);
        }

        if (dadosExtras.pais) {
          metadata.pais = String(dadosExtras.pais);
        }

        if (dadosExtras.cor_cabelo) {
          metadata.cor_cabelo =
            String(dadosExtras.cor_cabelo);
        }

        if (dadosExtras.cor_olhos) {
          metadata.cor_olhos =
            String(dadosExtras.cor_olhos);
        }

        if (dadosExtras.altura_cm) {
          metadata.altura_cm =
            String(dadosExtras.altura_cm);
        }

        if (dadosExtras.idiomas) {
          metadata.idiomas =
            String(dadosExtras.idiomas);
        }

        if (dadosExtras.descricao) {
          metadata.descricao =
            String(dadosExtras.descricao).slice(0, 800);
        }

        if (dadosExtras.foto_url) {
          metadata.foto_url =
            String(dadosExtras.foto_url);
        }
      }


      /* -------------------------------------------------------
         CRIA USUÁRIO NO SUPABASE AUTH
         ------------------------------------------------------- */

      const { data, error } =
        await supabase.auth.signUp({

          email: email,

          password: senha,

          options: {
            data: metadata
          }

        });


      if (error) {
        throw error;
      }


      if (!data || !data.user) {

        throw new Error(
          "O Supabase não retornou o usuário criado."
        );

      }


      /*
       O trigger handle_novo_usuario()
       cria automaticamente public.perfis.
      */

      const emailConfirmationRequired =
        !!data.user &&
        !data.session;


      return {

        success: true,

        user: data.user,

        session: data.session,

        emailConfirmationRequired:
          emailConfirmationRequired

      };

    } catch (error) {

      console.error(
        "Erro no cadastro LUX:",
        error
      );

      return {

        success: false,

        error: friendlyAuthError(error)

      };

    }

  }


  /* =========================================================
     ALIAS DE SEGURANÇA
     Evita o erro "Cadastrar is not defined".
     ========================================================= */

  window.cadastrar = cadastrar;
  window.Cadastrar = cadastrar;


  /* =========================================================
     LOGIN
     ========================================================= */

  async function login(email, senha) {

    try {

      const supabase = requireClient();

      email = String(email || "")
        .trim()
        .toLowerCase();

      senha = String(senha || "");

      if (!email || !senha) {

        throw new Error(
          "Digite seu e-mail e sua senha."
        );

      }

      const { data, error } =
        await supabase.auth.signInWithPassword({

          email: email,

          password: senha

        });


      if (error) {
        throw error;
      }


      if (!data || !data.user) {

        throw new Error(
          "Não foi possível iniciar a sessão."
        );

      }


      const perfil =
        await getPerfil(data.user.id);


      if (!perfil) {

        throw new Error(
          "Sua conta foi criada, mas o perfil ainda não está disponível. Aguarde alguns instantes e tente novamente."
        );

      }


      if (perfil.status === "bloqueado") {

        await supabase.auth.signOut();

        throw new Error(
          "Sua conta está bloqueada."
        );

      }


      if (perfil.tipo === "admin") {

        window.location.href =
          "painel.html";

        return {
          success: true,
          perfil: perfil
        };

      }


      if (perfil.tipo === "modelo") {

        if (perfil.status === "pendente") {

          window.location.href =
            "painel-modelo.html";

          return {
            success: true,
            perfil: perfil
          };

        }

        window.location.href =
          "painel-modelo.html";

        return {
          success: true,
          perfil: perfil
        };

      }


      window.location.href =
        "painel-usuario.html";


      return {

        success: true,

        perfil: perfil

      };

    } catch (error) {

      console.error(
        "Erro no login LUX:",
        error
      );

      return {

        success: false,

        error: friendlyAuthError(error)

      };

    }

  }


  window.login = login;
  window.Login = login;


  /* =========================================================
     BUSCAR PERFIL
     ========================================================= */

  async function getPerfil(userId) {

    try {

      const supabase = requireClient();

      let id = userId;

      if (!id) {

        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();

        if (!user) {
          return null;
        }

        id = user.id;
      }


      const {
        data,
        error
      } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", id)
        .maybeSingle();


      if (error) {

        console.error(
          "Erro ao buscar perfil:",
          error
        );

        return null;

      }


      return data || null;

    } catch (error) {

      console.error(error);

      return null;

    }

  }


  window.getPerfil = getPerfil;


  /* =========================================================
     TIPO DO USUÁRIO
     ========================================================= */

  async function getTipoUsuario() {

    const perfil =
      await getPerfil();

    return perfil
      ? perfil.tipo
      : null;

  }


  window.getTipoUsuario =
    getTipoUsuario;


  /* =========================================================
     USUÁRIO ATUAL
     ========================================================= */

  async function usuarioAtual() {

    try {

      const supabase =
        requireClient();

      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();

      return user || null;

    } catch (error) {

      console.error(error);

      return null;

    }

  }


  window.usuarioAtual =
    usuarioAtual;


  /* =========================================================
     SAIR
     ========================================================= */

  async function sair() {

    try {

      const supabase =
        requireClient();

      await supabase.auth.signOut();

    } catch (error) {

      console.error(error);

    }

    window.location.href =
      "login.html";

  }


  window.sair = sair;


  /* =========================================================
     PROTEGER PÁGINA
     ========================================================= */

  async function proteger(
    tiposPermitidos = []
  ) {

    try {

      const supabase =
        requireClient();

      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();


      if (!user) {

        window.location.href =
          "login.html";

        return null;

      }


      const perfil =
        await getPerfil(user.id);


      if (!perfil) {

        window.location.href =
          "login.html";

        return null;

      }


      if (
        Array.isArray(tiposPermitidos) &&
        tiposPermitidos.length > 0 &&
        !tiposPermitidos.includes(
          perfil.tipo
        )
      ) {

        if (perfil.tipo === "admin") {

          window.location.href =
            "painel.html";

        } else if (
          perfil.tipo === "modelo"
        ) {

          window.location.href =
            "painel-modelo.html";

        } else {

          window.location.href =
            "painel-usuario.html";

        }

        return null;

      }


      return {

        user: user,

        perfil: perfil

      };

    } catch (error) {

      console.error(error);

      window.location.href =
        "login.html";

      return null;

    }

  }


  window.proteger =
    proteger;


  /* =========================================================
     URL DE RECUPERAÇÃO
     ========================================================= */

  function urlRecuperacaoSenha() {

    const base =
      window.location.origin +
      window.location.pathname
        .substring(
          0,
          window.location.pathname.lastIndexOf("/") + 1
        );

    return base + "nova-senha.html";

  }


  window.urlRecuperacaoSenha =
    urlRecuperacaoSenha;


  /* =========================================================
     SOLICITAR RECUPERAÇÃO DE SENHA
     ========================================================= */

  async function solicitarRecuperacaoSenha(
    email
  ) {

    try {

      const supabase =
        requireClient();

      email = String(email || "")
        .trim()
        .toLowerCase();


      if (!email) {

        throw new Error(
          "Digite seu e-mail."
        );

      }


      const {
        error
      } =
        await supabase.auth
          .resetPasswordForEmail(
            email,
            {
              redirectTo:
                urlRecuperacaoSenha()
            }
          );


      if (error) {
        throw error;
      }


      return {

        success: true

      };

    } catch (error) {

      console.error(error);

      return {

        success: false,

        error:
          friendlyAuthError(error)

      };

    }

  }


  window.solicitarRecuperacaoSenha =
    solicitarRecuperacaoSenha;


  /* =========================================================
     ATUALIZAR SENHA
     ========================================================= */

  async function atualizarSenha(
    novaSenha
  ) {

    try {

      const supabase =
        requireClient();

      if (
        !novaSenha ||
        novaSenha.length < 6
      ) {

        throw new Error(
          "A nova senha precisa ter pelo menos 6 caracteres."
        );

      }


      const {
        data,
        error
      } =
        await supabase.auth.updateUser({
          password: novaSenha
        });


      if (error) {
        throw error;
      }


      return {

        success: true,

        data: data

      };

    } catch (error) {

      console.error(error);

      return {

        success: false,

        error:
          friendlyAuthError(error)

      };

    }

  }


  window.atualizarSenha =
    atualizarSenha;


  /* =========================================================
     ESCAPE HTML
     ========================================================= */

  function escapeHTML(valor) {

    return String(valor ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  window.escapeHTML =
    escapeHTML;


})();
