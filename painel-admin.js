// ============================================================
// LUX-ADVANCE — PAINEL ADMINISTRATIVO
// CONECTADO AO SUPABASE
// ============================================================

let modelos = [];
let usuarios = [];
let reclamacoes = [];
let avaliacoes = [];
let pagamentosPlanos = [];
let pedidos = [];
let planosUsuario = [];
let doacoes = [];

let filtroStatus = "todos";
let modeloSelecionado = null;
let dadosCarregados = false;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await protegerPainel();
        await carregarDados();
        montarPainelCompleto();
        ativarEventos();
    } catch (erro) {
        console.error("Erro ao iniciar painel:", erro);
        mostrarErroGlobal(
            "Não foi possível carregar o painel administrativo."
        );
    }
});


// ============================================================
// SEGURANÇA — SOMENTE ADMIN
// ============================================================

async function protegerPainel() {

    if (!window.luxSupabase) {
        throw new Error(
            "Supabase não foi inicializado. Verifique o config.js."
        );
    }

    const {
        data: { session },
        error
    } = await window.luxSupabase.auth.getSession();

    if (error) {
        console.error(error);
        window.location.replace("./acesso-admin.html");
        return;
    }

    if (!session || !session.user) {
        window.location.replace("./acesso-admin.html");
        return;
    }

    const emailUsuario =
        String(session.user.email || "")
            .trim()
            .toLowerCase();

    const emailAdministrador =
        String(window.LUX_ADMIN_EMAIL || "")
            .trim()
            .toLowerCase();

    if (
        !emailAdministrador ||
        emailUsuario !== emailAdministrador
    ) {
        await window.luxSupabase.auth.signOut();
        window.location.replace("./acesso-admin.html");
        return;
    }

    const statusOnline =
        document.getElementById("statusOnline");

    if (statusOnline) {
        statusOnline.textContent =
            "● ADMINISTRADOR CONECTADO";
    }
}


// ============================================================
// CARREGAMENTO GERAL
// ============================================================

async function carregarDados() {

    const sb = window.luxSupabase;

    const resultados = await Promise.all([

        sb
            .from("modelo_perfis")
            .select("*")
            .order("criado_em", { ascending: false }),

        sb
            .from("perfis")
            .select("*")
            .order("created_at", { ascending: false }),

        sb
            .from("reclamacoes")
            .select("*")
            .order("criado_em", { ascending: false }),

        sb
            .from("avaliacoes_modelos")
            .select("*")
            .order("created_at", { ascending: false }),

        sb
            .from("pagamentos_planos")
            .select("*")
            .order("created_at", { ascending: false }),

        sb
            .from("pedidos")
            .select("*")
            .order("criado_em", { ascending: false }),

        sb
            .from("planos_usuario")
            .select("*")
            .order("criado_em", { ascending: false }),

        sb
            .from("doacoes")
            .select("*")
            .order("criado_em", { ascending: false })
    ]);

    const nomesTabelas = [
        "modelo_perfis",
        "perfis",
        "reclamacoes",
        "avaliacoes_modelos",
        "pagamentos_planos",
        "pedidos",
        "planos_usuario",
        "doacoes"
    ];

    resultados.forEach((resultado, indice) => {

        if (resultado.error) {

            console.error(
                `Erro na tabela ${nomesTabelas[indice]}:`,
                resultado.error
            );

            throw new Error(
                `Erro ao consultar ${nomesTabelas[indice]}: ${resultado.error.message}`
            );
        }
    });

    modelos = resultados[0].data || [];
    usuarios = resultados[1].data || [];
    reclamacoes = resultados[2].data || [];
    avaliacoes = resultados[3].data || [];
    pagamentosPlanos = resultados[4].data || [];
    pedidos = resultados[5].data || [];
    planosUsuario = resultados[6].data || [];
    doacoes = resultados[7].data || [];

    dadosCarregados = true;

    console.log("LUX ADMIN — dados carregados:", {
        modelos: modelos.length,
        usuarios: usuarios.length,
        reclamacoes: reclamacoes.length,
        avaliacoes: avaliacoes.length,
        pagamentosPlanos: pagamentosPlanos.length,
        pedidos: pedidos.length,
        planosUsuario: planosUsuario.length,
        doacoes: doacoes.length
    });
}


// ============================================================
// MONTAGEM DO PAINEL
// ============================================================

function montarPainelCompleto() {

    atualizarResumo();

    renderizarModelos();

    criarAreaAdministrativa();

    renderizarUsuarios();
    renderizarReclamacoes();
    renderizarPlanos();
    renderizarAssinaturas();
    renderizarPagamentos();
    renderizarPedidos();
    renderizarAvaliacoes();
    renderizarDoacoes();
}


// ============================================================
// RESUMO
// ============================================================

function atualizarResumo() {

    const total =
        document.getElementById("resumoTotal");

    const pendentes =
        document.getElementById("resumoPendentes");

    const aprovados =
        document.getElementById("resumoAprovados");

    const rejeitados =
        document.getElementById("resumoRejeitados");

    if (total) {
        total.textContent = modelos.length;
    }

    if (pendentes
