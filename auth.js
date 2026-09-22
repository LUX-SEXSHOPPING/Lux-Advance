/* =========================================================
   LUX — AUTENTICAÇÃO
   V5 — CADASTRO DE MODELOS / USUÁRIOS
   ========================================================= */


function requireClient() {

  const client =
    window.luxSupabase;


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

async function getPerfil(
  userId
) {

  const {
    data,
    error
  } =
    await requireClient()
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
   PERFIL DA MODELO
   ========================================================= */

async function getModeloPerfil(
  userId
) {

  const {
    data,
    error
  } =
    await requireClient()
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

  const {
    data,
    error
  } =
    await requireClient()
      .auth
      .getUser();


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

async function getTipoUsuario(
  userId
) {

  const perfil =
    await getPerfil(
      userId
    );


  if (
    perfil?.tipo ===
    "modelo"
  ) {

    return "modelo";

  }


  const modeloPerfil =
    await getModeloPerfil(
      userId
    );


  if (modeloPerfil) {

    return "modelo";

  }


  return perfil?.tipo ||
    null;

}


/* =========================================================
   LOGIN
   ========================================================= */

async function login(
  email,
  senha
) {

  const supabase =
    requireClient();


  email =
    String(
      email || ""
    ).trim();


  if (
    !email ||
    !senha
  ) {

    throw new Error(
      "Informe o e-mail e a senha."
    );

  }


  const {
    data,
    error
  } =
    await supabase
      .auth
      .signInWithPassword({

        email,

        password:
          senha

      });


  if (error) {

    console.error(
      "Erro Supabase:",
      error
    );


    const msg =
      String(
        error.message ||
        ""
      ).toLowerCase();


    if(
      msg.includes(
        "invalid login credentials"
      )
    ){

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


  if(!user){

    throw new Error(
      "Usuário não encontrado."
    );

  }


  if(!session){

    throw new Error(
      "Sessão não criada. Tente novamente."
    );

  }


  const perfil =
    await getPerfil(
      user.id
    );


  const modeloPerfil =
    await getModeloPerfil(
      user.id
    );


  if(
    !perfil &&
    !modeloPerfil
  ){

    await supabase
      .auth
      .signOut();


    throw new Error(
      "Sua conta foi criada, mas o perfil ainda não está disponível."
    );

  }


  if(
    perfil &&
    (
      perfil.status ===
      "bloqueado" ||

      perfil.status ===
      "banido"
    )
  ){

    await supabase
      .auth
      .signOut();


    throw new Error(
      "Esta conta está bloqueada."
    );

  }


  const tipo =
    (
      perfil?.tipo ===
      "modelo" ||

      modeloPerfil
    )
      ? "modelo"
      : (
          perfil?.tipo ||
          null
        );


  return {

    id:
      user.id,

    user,

    session,

    perfil,

    modeloPerfil,

    tipo,

    success:
      true

  };

}


/* =========================================================
   NORMALIZA CATEGORIA
   ========================================================= */

function normalizarCategoria(
  valor
) {

  let categoria =
    String(
      valor ?? ""
    )
      .trim()
      .toLowerCase();


  if(
    [
      "feminino",
      "modelo feminino",
      "female"
    ].includes(
      categoria
    )
  ){

    return "feminino";

  }


  if(
    [
      "masculino",
      "modelo masculino",
      "male"
    ].includes(
      categoria
    )
  ){

    return "masculino";

  }


  if(
    [
      "lgbtq",
      "lgbtq+",
      "modelo lgbtq",
      "modelo lgbtq+"
    ].includes(
      categoria
    )
  ){

    return "lgbtq";

  }


  return "";

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
    String(
      tipo || ""
    )
      .trim()
      .toLowerCase();


  nome =
    String(
      nome || ""
    ).trim();


  email =
    String(
      email || ""
    )
      .trim()
      .toLowerCase();


  if(!nome){

    throw new Error(
      "Informe seu nome."
    );

  }


  if(!email){

    throw new Error(
      "Informe seu e-mail."
    );

  }


  if(
    !senha ||
    senha.length < 6
  ){

    throw new Error(
      "A senha deve possuir pelo menos 6 caracteres."
    );

  }


  if(
    ![
      "modelo",
      "usuario"
    ].includes(
      tipo
    )
  ){

    throw new Error(
      "Tipo de cadastro inválido."
    );

  }


  const idade =
    Number(
      extras.idade
    ) || null;


  const alturaCm =
    Number(
      extras.altura_cm
    ) || null;


  const categoriaCatalogo =
    normalizarCategoria(

      extras.categoria_catalogo ??
      extras.categoriaCatalogo ??
      extras.categoria

    );


  const maioridadeConfirmada =
    extras.maioridade_confirmada ===
    true;


  /* =======================================================
     VALIDAÇÕES DA MODELO
     ======================================================= */

  if(
    tipo ===
    "modelo"
  ){

    if(!categoriaCatalogo){

      throw new Error(
        "Selecione uma categoria válida para aparecer no catálogo."
      );

    }


    if(
      !idade ||
      idade < 18
    ){

      throw new Error(
        "A idade da modelo deve ser igual ou superior a 18 anos."
      );

    }


    if(
      !maioridadeConfirmada
    ){

      throw new Error(
        "É necessário confirmar a maioridade."
      );

    }


    if(
      !String(
        extras.cpf ||
        ""
      ).trim()
    ){

      throw new Error(
        "O CPF é obrigatório."
      );

    }


    if(
      !String(
        extras.data_nascimento ||
        ""
      ).trim()
    ){

      throw new Error(
        "A data de nascimento é obrigatória."
      );

    }

  }


  function texto(
    valor,
    fallback = ""
  ){

    return String(
      valor ??
      fallback
    ).trim();

  }


  /* =======================================================
     METADADOS AUTH
     ======================================================= */

  const metadata = {

    nome,

    tipo,

    apelido:
      texto(
        extras.apelido
      ),

    whatsapp:
      texto(
        extras.whatsapp
      ),

    cpf:
      texto(
        extras.cpf
      ),

    data_nascimento:
      texto(
        extras.data_nascimento
      ),

    idade,

    altura_cm:
      alturaCm,

    cep:
      texto(
        extras.cep
      ),

    estado:
      texto(
        extras.estado
      ).toUpperCase(),

    cidade:
      texto(
        extras.cidade
      ),

    bairro:
      texto(
        extras.bairro
      ),

    endereco:
      texto(
        extras.endereco
      ),

    numero:
      texto(
        extras.numero
      ),

    complemento:
      texto(
        extras.complemento
      ),

    pais:
      texto(
        extras.pais,
        "Brasil"
      ) ||
      "Brasil",

    cor_cabelo:
      texto(
        extras.cor_cabelo
      ),

    cor_olhos:
      texto(
        extras.cor_olhos
      ),

    idiomas:
      texto(
        extras.idiomas
      ),

    descricao:
      texto(
        extras.descricao
      ),

    categoria_catalogo:
      categoriaCatalogo,

    maioridade_confirmada:
      maioridadeConfirmada

  };


  /* =======================================================
     CRIA USUÁRIO AUTH
     ======================================================= */

  const {
    data,
    error
  } =
    await supabase
      .auth
      .signUp({

        email,

        password:
          senha,

        options: {

          data:
            metadata

        }

      });


  if(error){

    console.error(
      "Erro ao cadastrar:",
      error
    );


    const msg =
      String(
        error.message ||
        ""
      ).toLowerCase();


    if(
      msg.includes(
        "already registered"
      ) ||

      msg.includes(
        "already exists"
      )
    ){

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


  if(!user){

    throw new Error(
      "Não foi possível criar o usuário."
    );

  }


  /*
    Se houver sessão, atualizamos os registros pela API.

    Se não houver sessão, o trigger do Supabase cria
    os registros usando os metadados acima.
  */


  if(
    data?.session
  ){

    /* =====================================================
       PERFIL PRINCIPAL
       ===================================================== */

    const {
      data:
        perfilCriado,

      error:
        perfilError

    } =
      await supabase
        .from("perfis")
        .upsert(

          {

            id:
              user.id,

            tipo,

            nome,

            status:
              tipo ===
              "modelo"
                ? "pendente"
                : "ativo"

          },

          {
            onConflict:
              "id"
          }

        )
        .select()
        .single();


    if(perfilError){

      console.error(
        "Erro ao criar/atualizar perfil:",
        perfilError
      );


      throw new Error(
        "A conta foi criada, mas houve um problema ao criar o perfil: " +
        perfilError.message
      );

    }


    /* =====================================================
       MODELO
       ===================================================== */

    if(
      tipo ===
      "modelo"
    ){

      const modeloPerfil = {

        id:
          user.id,

        nome_exibicao:
          nome,

        apelido:
          texto(
            extras.apelido
          ) ||
          null,

        whatsapp:
          texto(
            extras.whatsapp
          ) ||
          null,

        cpf:
          texto(
            extras.cpf
          ) ||
          null,

        data_nascimento:
          texto(
            extras.data_nascimento
          ) ||
          null,

        idade,

        altura_cm:
          alturaCm,

        cep:
          texto(
            extras.cep
          ) ||
          null,

        estado:
          texto(
            extras.estado
          ).toUpperCase() ||
          null,

        cidade:
          texto(
            extras.cidade
          ) ||
          null,

        bairro:
          texto(
            extras.bairro
          ) ||
          null,

        endereco:
          texto(
            extras.endereco
          ) ||
          null,

        numero:
          texto(
            extras.numero
          ) ||
          null,

        complemento:
          texto(
            extras.complemento
          ) ||
          null,

        pais:
          texto(
            extras.pais,
            "Brasil"
          ) ||
          "Brasil",

        cor_cabelo:
          texto(
            extras.cor_cabelo
          ) ||
          null,

        cor_olhos:
          texto(
            extras.cor_olhos
          ) ||
          null,

        idiomas:
          texto(
            extras.idiomas
          ) ||
          null,

        descricao:
          texto(
            extras.descricao
          ) ||
          null,

        maioridade_confirmada:
          true,

        verificacao_status:
          "pendente",

        plano:
          "ESSENCE",

        categoria_catalogo:
          categoriaCatalogo

      };


      const {
        data:
          modeloCriado,

        error:
          modeloError

      } =
        await supabase
          .from(
            "modelo_perfis"
          )
          .upsert(

            modeloPerfil,

            {
              onConflict:
                "id"
            }

          )
          .select()
          .single();


      if(modeloError){

        console.error(
          "Erro ao criar/atualizar modelo_perfis:",
          modeloError
        );


        throw new Error(
          "Sua conta foi criada, mas houve um problema ao salvar os dados da modelo: " +
          modeloError.message
        );

      }


      return {

        success:
          true,

        id:
          user.id,

        user,

        session:
          data.session,

        perfil:
          perfilCriado,

        modeloPerfil:
          modeloCriado,

        mensagem:
          "Cadastro realizado. Seu perfil ficará aguardando análise."

      };

    }


    return {

      success:
        true,

      id:
        user.id,

      user,

      session:
        data.session,

      perfil:
        perfilCriado,

      mensagem:
        "Cadastro realizado com sucesso."

    };

  }


  /* =====================================================
     SEM SESSÃO — CONFIRMAÇÃO DE E-MAIL
     ===================================================== */

  return {

    success:
      true,

    id:
      user.id,

    user,

    session:
      null,

    perfil:
      null,

    modeloPerfil:
      null,

    mensagem:
      tipo === "modelo"

        ? "Cadastro realizado. Confirme seu e-mail, se solicitado. Seu perfil ficará aguardando análise."

        : "Cadastro realizado. Confirme seu e-mail, se solicitado."

  };

}


/* =========================================================
   LOGOUT
   ========================================================= */

async function logout(){

  const {
    error
  } =
    await requireClient()
      .auth
      .signOut();


  if(error){

    console.error(
      "Erro ao sair:",
      error
    );

    throw error;

  }

}


/* =========================================================
   EXPORTAÇÕES
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
