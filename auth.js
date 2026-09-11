function requireClient() {
  if (!luxSupabase) throw new Error("Supabase não configurado. Verifique js/config.js.");
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
  return data.user;
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
  location.href = "../login.html";
}

async function proteger(tipoEsperado) {
  const user = await usuarioAtual();
  if (!user) { location.href = "../login.html"; return null; }
  const tipo = await getTipoUsuario(user.id);
  if (tipo !== tipoEsperado) {
    location.href = tipo === "modelo" ? "../modelo/painel.html" : "../usuario/painel.html";
    return null;
  }
  return user;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}


async function solicitarRecuperacao(email) {
  const db = requireClient();
  const redirectUrl = new URL('nova-senha.html', window.location.href).href;
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl
  });
  if (error) throw new Error(friendlyAuthError(error));
}

async function atualizarSenha(novaSenha) {
  const db = requireClient();
  const { data, error } = await db.auth.updateUser({ password: novaSenha });
  if (error) throw new Error(friendlyAuthError(error));
  return data.user;
}
