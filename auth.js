// ============================================
// LUX ADVANCE — AUTENTICAÇÃO
// ============================================

async function login(email, senha) {
    try {
        if (!email || !senha) {
            throw new Error("Informe seu e-mail e sua senha.");
        }

        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email.trim(),
            password: senha
        });

        if (error) {
            throw new Error(error.message);
        }

        if (!data || !data.user || !data.session) {
            throw new Error("Não foi possível iniciar a sessão.");
        }

        // Confirma que a sessão realmente ficou salva
        const { data: sessaoAtual, error: erroSessao } =
            await supabaseClient.auth.getSession();

        if (erroSessao || !sessaoAtual?.session) {
            await supabaseClient.auth.signOut();
            throw new Error("A sessão não foi estabelecida corretamente.");
        }

        const usuario = data.user;

        // Busca o perfil do usuário
        const perfil = await getPerfil(usuario.id);

        if (!perfil) {
            await supabaseClient.auth.signOut();
            throw new Error(
                "Seu cadastro não possui um perfil válido."
            );
        }

        // Verifica se a conta está bloqueada
        if (
            perfil.status === "bloqueado" ||
            perfil.bloqueado === true
        ) {
            await supabaseClient.auth.signOut();
            throw new Error(
                "Sua conta está bloqueada. Entre em contato com a administração."
            );
        }

        // IMPORTANTE:
        // O redirecionamento NÃO acontece aqui.
        // O login.html será responsável por isso.
        return {
            success: true,
            user: usuario,
            session: sessaoAtual.session,
            perfil: perfil
        };

    } catch (error) {
        console.error("Erro no login:", error);

        return {
            success: false,
            error: error?.message || "Erro ao fazer login."
        };
    }
}


// ============================================
// BUSCAR PERFIL
// ============================================

async function getPerfil(userId = null) {
    try {
        let id = userId;

        if (!id) {
            const {
                data: { user },
                error
            } = await supabaseClient.auth.getUser();

            if (error || !user) {
                return null;
            }

            id = user.id;
        }

        const { data, error } = await supabaseClient
            .from("perfis")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            console.error("Erro ao buscar perfil:", error);
            return null;
        }

        return data;

    } catch (error) {
        console.error("Erro em getPerfil:", error);
        return null;
    }
}


// ============================================
// TIPO DO USUÁRIO
// ============================================

async function getTipoUsuario(userId = null) {
    const perfil = await getPerfil(userId);

    if (!perfil) {
        return null;
    }

    return perfil.tipo || null;
}


// ============================================
// USUÁRIO LOGADO
// ============================================

async function getUsuarioAtual() {
    try {
        const {
            data: { user },
            error
        } = await supabaseClient.auth.getUser();

        if (error || !user) {
            return null;
        }

        return user;

    } catch (error) {
        console.error("Erro ao obter usuário:", error);
        return null;
    }
}


// ============================================
// LOGOUT
// ============================================

async function logout() {
    try {
        await supabaseClient.auth.signOut();

        window.location.replace("login.html");

    } catch (error) {
        console.error("Erro ao sair:", error);
        window.location.replace("login.html");
    }
}
