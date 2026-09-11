function requireClient() {
  if (!luxSupabase) throw new Error("Supabase não configurado. Verifique config.js.");
  return luxSupabase;
}

function friendlyAuthError(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("user already registered")) return "Este e-mail já está cadastrado.";
  return error?.message || "Não foi possível concluir a operação.";
}

async function cadastrar(tipo, nome, email, senha) {
  const db = requireClient();
  const { data, error } = await db.auth.signUp({
    email,
    password: senha,
    options: { data: { tipo, nome } }
  });
  if (error) throw new Error(friendlyAuthError(error));
  
  // Cria perfil no banco de dados
  if (data.user) {
    await criarPerfilUsuario(data.user.id, tipo, nome, email);
  }
  
  return data.user;
}

async function criarPerfilUsuario(userId, tipo, nome, email) {
  const db = requireClient();
  
  if (tipo === "modelo") {
    // Cria perfil exclusivo para modelo
    const { error } = await db.from("perfis").insert({
      id: userId,
      tipo: "modelo",
      nome: nome,
      email: email,
      status: "pendente",
      data_cadastro: new Date().toISOString(),
      fotos: [],
      video: null,
      bio: "",
      altura: "",
      idade: 0,
      cidade: "",
      disponivel: false,
      approved_at: null
    });
    
    if (error) console.error("Erro ao criar perfil modelo:", error);
    
    // Envia notificação por email para admin
    await enviarEmailNovoModelo(nome, email);
  } else {
    // Cria perfil para usuário comum
    const { error } = await db.from("perfis").insert({
      id: userId,
      tipo: "usuario",
      nome: nome,
      email: email,
      status: "ativo",
      data_cadastro: new Date().toISOString()
    });
    
    if (error) console.error("Erro ao criar perfil usuário:", error);
  }
}

async function enviarEmailNovoModelo(nome, email) {
  const db = requireClient();
  
  try {
    // Usa a função Edge Function do Supabase para enviar email
    const response = await db.functions.invoke("enviar-email-novo-modelo", {
      body: {
        nome_modelo: nome,
        email_modelo: email,
        admin_email: LUX_ADMIN_EMAIL,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log("Email de notificação enviado:", response);
  } catch (erro) {
    console.error("Erro ao enviar email:", erro);
    // Não falha o cadastro se o email não for enviado
  }
}

async function login(email, senha) {
  const db = requireClient();
  const { data, error } = await db.auth.signInWithPassword({ email, password: senha });
  if (error) throw new Error(friendlyAuthError(error));
  return data.user;
}

async function getPerfil(id) {
  const db = requireClient();
  const { data, error } = await db.from("perfis").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

async function getTipoUsuario(id) {
  const p = await getPerfil(id);
  if (p.tipo === "modelo" && !["aprovado", "ativo"].includes(p.status)) {
    throw new Error("Seu cadastro de modelo está aguardando aprovação da administração.");
  }
  return p.tipo;
}

async function usuarioAtual() {
  const db = requireClient();
  const { data: { user } } = await db.auth.getUser();
  return user;
}

async function sair() {
  const db = requireClient();
  await db.auth.signOut();
  location.href = "login.html";
}

async function proteger(tipoEsperado) {
  const user = await usuarioAtual();
  if (!user) { location.href = "login.html"; return null; }
  
  const tipo = await getTipoUsuario(user.id);
  
  if (tipo !== tipoEsperado) {
    location.href = tipo === "modelo" ? "painel-modelo.html" : "painel-usuario.html";
    return null;
  }
  
  return user;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}
