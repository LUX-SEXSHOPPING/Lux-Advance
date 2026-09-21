// =============================================================
// LUX-ADVANCE — PAINEL ADMINISTRATIVO
// MOTOR FUNCIONAL COMPLETO
// =============================================================

let listaPreCadastros = [];
let filtroStatus = "todos";
let indiceSelecionado = null;


// =============================================================
// INICIALIZAÇÃO
// =============================================================

document.addEventListener("DOMContentLoaded", async () => {

    await carregarListaPreCadastros();

    ativarBotoesFiltro();

    ativarModulosAdmin();

    atualizarResumo();

});


// =============================================================
// CARREGAR PRÉ-CADASTROS
// =============================================================

async function carregarListaPreCadastros() {

    const container =
        document.getElementById("lista-precadastros");

    try {

        const dadosSalvos =
            localStorage.getItem("fichasPreCadastro");

        listaPreCadastros =
            dadosSalvos
                ? JSON.parse(dadosSalvos)
                : [];

        if (!Array.isArray(listaPreCadastros)) {
            listaPreCadastros = [];
        }

        listaPreCadastros.forEach(item => {

            if (!item.status) {
                item.status = "pendente";
            }

        });

        aplicarFiltroERenderizar();

    } catch (erro) {

        console.error(
            "Erro ao carregar pré-cadastros:",
            erro
        );

        if (container) {

            container.innerHTML = `
                <div style="
                    grid-column:1/-1;
                    text-align:center;
                    padding:40px;
                    color:#999;
                ">
                    Não foi possível carregar os registros.
                </div>
            `;

        }

    }

}


// =============================================================
// FILTROS
// =============================================================

function ativarBotoesFiltro() {

    const botoes =
        document.querySelectorAll(".btn-filtro");

    botoes.forEach(botao => {

        botao.addEventListener("click", () => {

            botoes.forEach(item => {
                item.classList.remove("ativo");
            });

            botao.classList.add("ativo");

            filtroStatus =
                botao.dataset.filtro || "todos";

            aplicarFiltroERenderizar();

        });

    });

}


// =============================================================
// FILTRAR
// =============================================================

function aplicarFiltroERenderizar() {

    let dados =
        [...listaPreCadastros];

    if (filtroStatus !== "todos") {

        dados =
            dados.filter(item =>
                (item.status || "pendente") === filtroStatus
            );

    }

    desenharLista(dados);

    atualizarResumo();

}


// =============================================================
// DESENHAR LISTA
// =============================================================

function desenharLista(lista) {

    const container =
        document.getElementById(
            "lista-precadastros"
        );

    if (!container) return;


    if (!lista.length) {

        container.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:45px 20px;
                color:#888;
            ">

                <div style="
                    font-size:34px;
                    color:#f5d58c;
                    margin-bottom:12px;
                ">
                    ◇
                </div>

                <div style="
                    color:#aaa;
                    font-size:13px;
                ">
                    Nenhum registro encontrado.
                </div>

            </div>
        `;

        return;

    }


    container.innerHTML =
        lista.map(registro => {

            const indiceOriginal =
                listaPreCadastros.indexOf(registro);

            const status =
                registro.status || "pendente";

            return `

                <div class="card-registro">

                    <h4>
                        ${escaparHTML(
                            registro.nome || "Sem nome"
                        )}
                    </h4>

                    <p>
                        📱
                        ${escaparHTML(
                            registro.whatsapp || "—"
                        )}
                    </p>

                    <p>
                        📅
                        ${escaparHTML(
                            registro.dataEnvio || "—"
                        )}
                    </p>

                    <p>
                        Status:

                        <span class="status-${status}">
                            ${status.toUpperCase()}
                        </span>

                    </p>

                    <button
                        type="button"
                        class="btn btn-secundario"
                        onclick="abrirVerFichaPorIndice(${indiceOriginal})"
                    >
                        VER FICHA COMPLETA
                    </button>

                </div>

            `;

        }).join("");

}


// =============================================================
// ABRIR FICHA
// =============================================================

function abrirVerFichaPorIndice(indice) {

    if (
        indice === null ||
        indice === undefined ||
        !listaPreCadastros[indice]
    ) {
        return;
    }

    indiceSelecionado = indice;

    const dados =
        listaPreCadastros[indice];

    const corpo =
        document.getElementById(
            "corpo-ficha"
        );

    const modal =
        document.getElementById(
            "modal-ver-ficha"
        );

    if (!corpo || !modal) return;

    const fotos =
        Array.isArray(dados.fotos)
            ? dados.fotos
            : [];

    corpo.innerHTML = `

        <div style="
            display:grid;
            gap:14px;
        ">

            <p>
                <strong>Nome/Apelido:</strong><br>
                ${escaparHTML(dados.nome || "—")}
            </p>

            <p>
                <strong>WhatsApp:</strong><br>
                ${escaparHTML(dados.whatsapp || "—")}
            </p>

            <p>
                <strong>Idade:</strong><br>
                ${escaparHTML(dados.idade || "—")}
            </p>

            <p>
                <strong>Altura:</strong><br>
                ${escaparHTML(dados.altura || "—")}
            </p>

            <p>
                <strong>Cidade/UF:</strong><br>
                ${escaparHTML(dados.cidade || "—")}
            </p>

            <p>
                <strong>Informações:</strong><br>
                ${escaparHTML(dados.sobre || "—")}
            </p>

            <p>
                <strong>Status:</strong><br>
                ${escaparHTML(
                    dados.status || "pendente"
                ).toUpperCase()}
            </p>

            ${
                fotos.length
                ?
                `
                    <div>

                        <strong>Fotos:</strong>

                        <div style="
                            display:flex;
                            flex-wrap:wrap;
                            gap:10px;
                            margin-top:10px;
                        ">

                            ${fotos.map(url => `

                                <img
                                    src="${escaparAtributo(url)}"
                                    alt="Foto"
                                    style="
                                        width:120px;
                                        height:120px;
                                        object-fit:cover;
                                        border-radius:12px;
                                        border:1px solid rgba(245,213,140,.2);
                                    "
                                >

                            `).join("")}

                        </div>

                    </div>
                `
                :
                `
                    <p>
                        <strong>Fotos:</strong>
                        Nenhuma enviada.
                    </p>
                `
            }

            ${
                dados.video
                ?
                `
                    <div>

                        <strong>Vídeo:</strong>

                        <video
                            controls
                            style="
                                width:100%;
                                max-width:500px;
                                margin-top:10px;
                                border-radius:12px;
                            "
                            src="${escaparAtributo(
                                dados.video
                            )}"
                        ></video>

                    </div>
                `
                :
                `
                    <p>
                        <strong>Vídeo:</strong>
                        Nenhum enviado.
                    </p>
                `
            }

        </div>

    `;

    modal.style.display = "flex";

}


// =============================================================
// FECHAR FICHA
// =============================================================

function fecharModalFicha() {

    const modal =
        document.getElementById(
            "modal-ver-ficha"
        );

    if (modal) {
        modal.style.display = "none";
    }

    indiceSelecionado = null;

}


// =============================================================
// SALVAR
// =============================================================

async function salvarAlteracoes() {

    localStorage.setItem(
        "fichasPreCadastro",
        JSON.stringify(listaPreCadastros)
    );

    aplicarFiltroERenderizar();

}


// =============================================================
// APROVAR / REJEITAR
// =============================================================

document.addEventListener(
    "click",
    async evento => {

        if (
            evento.target.id ===
            "botao-aprovar"
        ) {

            if (
                indiceSelecionado === null ||
                !listaPreCadastros[indiceSelecionado]
            ) {
                return;
            }

            listaPreCadastros[
                indiceSelecionado
            ].status = "aprovado";

            await salvarAlteracoes();

            fecharModalFicha();

        }


        if (
            evento.target.id ===
            "botao-rejeitar"
        ) {

            if (
                indiceSelecionado === null ||
                !listaPreCadastros[indiceSelecionado]
            ) {
                return;
            }

            listaPreCadastros[
                indiceSelecionado
            ].status = "rejeitado";

            await salvarAlteracoes();

            fecharModalFicha();

        }

    }
);


// =============================================================
// RESUMO
// =============================================================

function atualizarResumo() {

    const total =
        listaPreCadastros.length;

    const pendentes =
        listaPreCadastros.filter(
            item =>
                (item.status || "pendente")
                === "pendente"
        ).length;

    const aprovados =
        listaPreCadastros.filter(
            item =>
                item.status === "aprovado"
        ).length;

    const rejeitados =
        listaPreCadastros.filter(
            item =>
                item.status === "rejeitado"
        ).length;

    atualizarElemento(
        "resumoTotal",
        total
    );

    atualizarElemento(
        "resumoPendentes",
        pendentes
    );

    atualizarElemento(
        "resumoAprovados",
        aprovados
    );

    atualizarElemento(
        "resumoRejeitados",
        rejeitados
    );

}


// =============================================================
// GESTÃO DOS MÓDULOS
// TOQUE MAIS PRECISO E PROTEGIDO NO CELULAR
// =============================================================

function ativarModulosAdmin() {

    const cards =
        document.querySelectorAll(
            ".admin-card"
        );

    cards.forEach(card => {

        let inicioX = 0;
        let inicioY = 0;
        let inicioTempo = 0;
        let movimento = false;
        let pressionando = false;


        card.addEventListener(
            "pointerdown",
            function(evento) {

                pressionando = true;

                inicioX =
                    evento.clientX;

                inicioY =
                    evento.clientY;

                inicioTempo =
                    Date.now();

                movimento = false;

            },
            {
                passive: true
            }
        );


        card.addEventListener(
            "pointermove",
            function(evento) {

                if (!pressionando) {
                    return;
                }

                const distanciaX =
                    Math.abs(
                        evento.clientX -
                        inicioX
                    );

                const distanciaY =
                    Math.abs(
                        evento.clientY -
                        inicioY
                    );


                if (
                    distanciaX > 15 ||
                    distanciaY > 15
                ) {

                    movimento = true;

                }

            },
            {
                passive: true
            }
        );


        card.addEventListener(
            "pointerup",
            function(evento) {

                if (!pressionando) {
                    return;
                }

                pressionando = false;


                const duracao =
                    Date.now() -
                    inicioTempo;


                const distanciaX =
                    Math.abs(
                        evento.clientX -
                        inicioX
                    );

                const distanciaY =
                    Math.abs(
                        evento.clientY -
                        inicioY
                    );


                if (
                    movimento ||
                    distanciaX > 15 ||
                    distanciaY > 15
                ) {

                    return;

                }


                if (
                    duracao > 600
                ) {

                    return;

                }


                if (
                    duracao < 40
                ) {

                    return;

                }


                const texto =
                    (
                        card.innerText || ""
                    )
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    );


                abrirModuloCorrespondente(
                    texto
                );

            }
        );


        card.addEventListener(
            "pointercancel",
            function() {

                pressionando = false;
                movimento = true;

            },
            {
                passive: true
            }
        );


        card.addEventListener(
            "pointerleave",
            function() {

                if (pressionando) {
                    movimento = true;
                }

            },
            {
                passive: true
            }
        );

    });

}


// =============================================================
// IDENTIFICAR MÓDULO
// =============================================================

function abrirModuloCorrespondente(texto) {

    if (
        texto.includes("gestao de modelos")
    ) {

        abrirGestaoModelos();

        return;
    }


    if (
        texto.includes("usuarios")
    ) {

        abrirModuloUsuarios();

        return;
    }


    if (
        texto.includes("reclamacoes")
    ) {

        abrirModuloReclamacoes();

        return;
    }


    if (
        texto.includes("planos lux")
    ) {

        abrirModuloPlanos();

        return;
    }


    if (
        texto.includes("pagamentos")
    ) {

        abrirModuloPagamentos();

        return;
    }


    if (
        texto.includes("assinaturas")
    ) {

        abrirModuloAssinaturas();

        return;
    }


    if (
        texto.includes("avaliacoes")
    ) {

        abrirModuloAvaliacoes();

        return;
    }


    if (
        texto.includes("doacoes")
    ) {

        abrirModuloDoacoes();

        return;
    }

}


// =============================================================
// GESTÃO DE MODELOS
// =============================================================

function abrirGestaoModelos() {

    fecharModuloAdmin();

    const painel =
        document.querySelector(
            ".panel"
        );

    if (painel) {

        painel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

}


// =============================================================
// CRIAR MODAL ADMIN
// =============================================================

function criarModalAdmin() {

    let modal =
        document.getElementById(
            "modal-modulo-admin"
        );

    if (modal) {
        return modal;
    }

    modal =
        document.createElement("div");

    modal.id =
        "modal-modulo-admin";

    modal.style.cssText = `
        position:fixed;
        inset:0;
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:18px;
        background:rgba(0,0,0,.88);
        backdrop-filter:blur(14px);
    `;

    modal.innerHTML = `

        <div
            id="conteudo-modulo-admin"
            style="
                width:min(900px,100%);
                max-height:90vh;
                overflow:auto;
                background:
                    linear-gradient(
                        145deg,
                        #160b12,
                        #080608
                    );
                border:1px solid rgba(245,213,140,.20);
                border-radius:20px;
                box-shadow:0 30px 100px rgba(0,0,0,.75);
                color:#eee;
            "
        >

        </div>

    `;

    document.body.appendChild(modal);

    modal.addEventListener(
        "click",
        function(evento) {

            if (
                evento.target === modal
            ) {
                fecharModuloAdmin();
            }

        }
    );

    return modal;

}


// =============================================================
// ABRIR CONTEÚDO DO MÓDULO
// =============================================================

function mostrarModulo(
    titulo,
    subtitulo,
    conteudo
) {

    const modal =
        criarModalAdmin();

    const area =
        document.getElementById(
            "conteudo-modulo-admin"
        );

    if (!area) return;

    area.innerHTML = `

        <div style="
            position:sticky;
            top:0;
            z-index:2;
            padding:20px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:15px;
            background:rgba(15,8,12,.98);
            border-bottom:1px solid rgba(255,255,255,.07);
        ">

            <div>

                <div style="
                    color:#ff4da6;
                    font-size:9px;
                    font-weight:800;
                    letter-spacing:2px;
                    margin-bottom:6px;
                ">
                    LUX-ADVANCE · ADMINISTRAÇÃO
                </div>

                <h2 style="
                    margin:0;
                    color:#f5d58c;
                    font-family:'Playfair Display',serif;
                    font-size:28px;
                ">
                    ${escaparHTML(titulo)}
                </h2>

                <p style="
                    margin-top:6px;
                    color:#938891;
                    font-size:11px;
                ">
                    ${escaparHTML(subtitulo)}
                </p>

            </div>

            <button
                type="button"
                onclick="fecharModuloAdmin()"
                style="
                    width:38px;
                    height:38px;
                    border:1px solid rgba(255,255,255,.10);
                    border-radius:50%;
                    background:rgba(255,255,255,.03);
                    color:#fff;
                    font-size:20px;
                "
            >
                ×
            </button>

        </div>


        <div style="
            padding:22px;
        ">

            ${conteudo}

        </div>

    `;

    modal.style.display = "flex";

}


// =============================================================
// USUÁRIOS
// =============================================================

function abrirModuloUsuarios() {

    const quantidade =
        localStorage.getItem(
            "usuarios"
        );

    mostrarModulo(
        "Usuários",
        "Contas e controle de acesso",
        `

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
        ">

            ${criarBloco(
                "CONTAS",
                quantidade || "0",
                "Registros locais identificados"
            )}

            ${criarBloco(
                "ACESSO",
                "Supabase",
                "Autenticação do sistema"
            )}

            ${criarBloco(
                "ADMIN",
                "Protegido",
                "Área administrativa"
            )}

        </div>


        <div style="
            margin-top:20px;
            padding:20px;
            border:1px solid rgba(245,213,140,.12);
            border-radius:14px;
            background:rgba(255,255,255,.02);
        ">

            <h3 style="
                color:#f5d58c;
                margin-bottom:10px;
            ">
                Controle de usuários
            </h3>

            <p style="
                color:#999;
                font-size:12px;
                line-height:1.7;
            ">
                Esta área está preparada para administrar
                contas de usuários autenticadas pelo Supabase.
            </p>

        </div>

        `
    );

}


// =============================================================
// RECLAMAÇÕES
// SUPABASE — FUNCIONAL
// =============================================================

async function carregarReclamacoesAdmin() {

    if (
        !window.luxSupabase
    ) {

        throw new Error(
            "Supabase não foi inicializado."
        );

    }


    const {
        data,
        error
    } = await window.luxSupabase
        .from("reclamacoes")
        .select(`
            id,
            usuario_id,
            nome,
            email,
            assunto,
            mensagem,
            status,
            criado_em,
            atualizado_em
        `)
        .order(
            "criado_em",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "Erro ao carregar reclamações:",
            error
        );

        throw error;

    }


    return Array.isArray(data)
        ? data
        : [];

}


// =============================================================
// TEXTO DO STATUS DA RECLAMAÇÃO
// =============================================================

function textoStatusReclamacao(status) {

    const mapa = {

        pendente:
            "PENDENTE",

        em_analise:
            "EM ANÁLISE",

        em_analise:
            "EM ANÁLISE",

        resolvida:
            "RESOLVIDA",

        arquivada:
            "ARQUIVADA",

        cancelada:
            "CANCELADA"

    };


    return mapa[
        String(status || "").toLowerCase()
    ]
    ||
    String(
        status ||
        "pendente"
    )
    .replace(/_/g, " ")
    .toUpperCase();

}


// =============================================================
// COR DO STATUS DA RECLAMAÇÃO
// =============================================================

function corStatusReclamacao(status) {

    const valor =
        String(
            status || "pendente"
        ).toLowerCase();


    if (
        valor === "resolvida"
    ) {

        return "#8ff0b0";

    }


    if (
        valor === "arquivada" ||
        valor === "cancelada"
    ) {

        return "#ff7d8d";

    }


    if (
        valor === "em_analise"
    ) {

        return "#f5d58c";

    }


    return "#ff4da6";

}


// =============================================================
// ESCAPAR VALOR PARA ATRIBUTO
// =============================================================

function escaparAtributoSeguro(valor) {

    return escaparHTML(
        String(valor || "")
    );

}


// =============================================================
// ATUALIZAR STATUS DA RECLAMAÇÃO
// =============================================================

async function atualizarStatusReclamacao(
    id,
    novoStatus
) {

    if (!id) {

        alert(
            "Não foi possível identificar a reclamação."
        );

        return;

    }


    if (
        !window.luxSupabase
    ) {

        alert(
            "Supabase não foi inicializado."
        );

        return;

    }


    const status =
        String(
            novoStatus || "pendente"
        ).trim();


    if (!status) {
        return;
    }


    const {
        error
    } = await window.luxSupabase
        .from("reclamacoes")
        .update({

            status:
                status,

            atualizado_em:
                new Date().toISOString()

        })
        .eq(
            "id",
            id
        );


    if (error) {

        console.error(
            "Erro ao atualizar reclamação:",
            error
        );

        alert(
            "Não foi possível atualizar a reclamação.\n\n" +
            error.message
        );

        return;

    }


    await abrirModuloReclamacoes();

}


// =============================================================
// ABRIR MÓDULO DE RECLAMAÇÕES
// =============================================================

async function abrirModuloReclamacoes() {

    mostrarModulo(
        "Reclamações",
        "Atendimento e ocorrências",
        `

        <div style="
            padding:35px 20px;
            text-align:center;
            color:#999;
        ">

            <div style="
                font-size:34px;
                color:#f5d58c;
                margin-bottom:12px;
            ">
                ◇
            </div>

            <div style="
                color:#aaa;
                font-size:13px;
            ">
                Carregando reclamações...
            </div>

        </div>

        `
    );


    try {

        const reclamacoes =
            await carregarReclamacoesAdmin();


        const total =
            reclamacoes.length;


        const pendentes =
            reclamacoes.filter(
                item =>
                    !item.status ||
                    item.status === "pendente"
            ).length;


        const emAnalise =
            reclamacoes.filter(
                item =>
                    item.status === "em_analise"
            ).length;


        const resolvidas =
            reclamacoes.filter(
                item =>
                    item.status === "resolvida"
            ).length;


        const registrosHTML =
            reclamacoes.length
            ?
            reclamacoes.map(
                reclamacao => {

                    const id =
                        reclamacao.id || "";


                    const usuarioId =
                        reclamacao.usuario_id || "—";


                    const nome =
                        reclamacao.nome ||
                        "Não informado";


                    const email =
                        reclamacao.email ||
                        "—";


                    const assunto =
                        reclamacao.assunto ||
                        "Sem assunto";


                    const mensagem =
                        reclamacao.mensagem ||
                        "Sem mensagem";


                    const status =
                        reclamacao.status ||
                        "pendente";


                    const criadoEm =
                        formatarDataAdmin(
                            reclamacao.criado_em
                        );


                    const atualizadoEm =
                        formatarDataAdmin(
                            reclamacao.atualizado_em
                        );


                    const cor =
                        corStatusReclamacao(
                            status
                        );


                    return `

                        <div style="
                            padding:20px;
                            border:1px solid rgba(245,213,140,.12);
                            border-radius:15px;
                            background:rgba(255,255,255,.025);
                            margin-bottom:14px;
                        ">

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                align-items:flex-start;
                                gap:12px;
                                flex-wrap:wrap;
                            ">

                                <div style="
                                    min-width:0;
                                    flex:1;
                                ">

                                    <div style="
                                        color:#f5d58c;
                                        font-family:'Playfair Display',serif;
                                        font-size:20px;
                                        margin-bottom:6px;
                                        word-break:break-word;
                                    ">
                                        ${escaparHTML(
                                            assunto
                                        )}
                                    </div>

                                    <div style="
                                        color:#8e838b;
                                        font-size:10px;
                                        word-break:break-word;
                                    ">
                                        ${escaparHTML(
                                            nome
                                        )}
                                    </div>

                                </div>


                                <div style="
                                    color:${cor};
                                    font-size:9px;
                                    font-weight:800;
                                    letter-spacing:1px;
                                    border:1px solid ${cor};
                                    border-radius:20px;
                                    padding:7px 10px;
                                    white-space:nowrap;
                                ">
                                    ${escaparHTML(
                                        textoStatusReclamacao(
                                            status
                                        )
                                    )}
                                </div>

                            </div>


                            <div style="
                                display:grid;
                                grid-template-columns:
                                    repeat(
                                        auto-fit,
                                        minmax(180px,1fr)
                                    );
                                gap:10px;
                                margin-top:16px;
                            ">

                                ${criarBloco(
                                    "NOME",
                                    nome,
                                    "Reclamante"
                                )}

                                ${criarBloco(
                                    "E-MAIL",
                                    email,
                                    "E-mail informado"
                                )}

                                ${criarBloco(
                                    "CRIADA EM",
                                    criadoEm,
                                    "Data do registro"
                                )}

                                ${criarBloco(
                                    "ATUALIZADA EM",
                                    atualizadoEm,
                                    "Última alteração"
                                )}

                            </div>


                            <div style="
                                margin-top:14px;
                                padding:16px;
                                border:1px solid rgba(255,255,255,.07);
                                border-radius:12px;
                                background:rgba(0,0,0,.18);
                            ">

                                <div style="
                                    color:#f5d58c;
                                    font-size:9px;
                                    font-weight:800;
                                    letter-spacing:1.5px;
                                    margin-bottom:8px;
                                ">
                                    MENSAGEM
                                </div>

                                <div style="
                                    color:#bbb;
                                    font-size:12px;
                                    line-height:1.8;
                                    white-space:pre-wrap;
                                    word-break:break-word;
                                ">
                                    ${escaparHTML(
                                        mensagem
                                    )}
                                </div>

                            </div>


                            <div style="
                                margin-top:14px;
                                padding-top:14px;
                                border-top:1px solid rgba(255,255,255,.06);
                            ">

                                <div style="
                                    color:#81757e;
                                    font-size:9px;
                                    font-weight:800;
                                    letter-spacing:1px;
                                    margin-bottom:7px;
                                ">
                                    USUÁRIO ID
                                </div>

                                <div style="
                                    color:#aaa;
                                    font-size:10px;
                                    word-break:break-all;
                                ">
                                    ${escaparHTML(
                                        usuarioId
                                    )}
                                </div>

                            </div>


                            <div style="
                                margin-top:16px;
                                display:flex;
                                align-items:center;
                                gap:10px;
                                flex-wrap:wrap;
                            ">

                                <label style="
                                    color:#999;
                                    font-size:10px;
                                    font-weight:700;
                                ">
                                    ALTERAR STATUS:
                                </label>


                                <select
                                    data-reclamacao-status="${escaparAtributoSeguro(id)}"
                                    onchange="
                                        atualizarStatusReclamacao(
                                            this.dataset.reclamacaoStatus,
                                            this.value
                                        )
                                    "
                                    style="
                                        min-height:40px;
                                        padding:8px 12px;
                                        border-radius:10px;
                                        border:1px solid rgba(245,213,140,.18);
                                        background:#120a0f;
                                        color:#eee;
                                        font-size:11px;
                                        outline:none;
                                    "
                                >

                                    <option
                                        value="pendente"
                                        ${status === "pendente" ? "selected" : ""}
                                    >
                                        Pendente
                                    </option>

                                    <option
                                        value="em_analise"
                                        ${status === "em_analise" ? "selected" : ""}
                                    >
                                        Em análise
                                    </option>

                                    <option
                                        value="resolvida"
                                        ${status === "resolvida" ? "selected" : ""}
                                    >
                                        Resolvida
                                    </option>

                                    <option
                                        value="arquivada"
                                        ${status === "arquivada" ? "selected" : ""}
                                    >
                                        Arquivada
                                    </option>

                                    <option
                                        value="cancelada"
                                        ${status === "cancelada" ? "selected" : ""}
                                    >
                                        Cancelada
                                    </option>

                                </select>

                            </div>

                        </div>

                    `;

                }
            ).join("")
            :
            `

                <div style="
                    padding:45px 20px;
                    text-align:center;
                    border:1px dashed rgba(245,213,140,.16);
                    border-radius:15px;
                    color:#8e838b;
                ">

                    <div style="
                        font-size:34px;
                        color:#f5d58c;
                        margin-bottom:12px;
                    ">
                        ◇
                    </div>

                    <div style="
                        color:#aaa;
                        font-size:13px;
                        margin-bottom:7px;
                    ">
                        Nenhuma reclamação registrada.
                    </div>

                    <div style="
                        font-size:10px;
                        line-height:1.6;
                    ">
                        Não existem registros disponíveis
                        na tabela de reclamações.
                    </div>

                </div>

            `;


        mostrarModulo(
            "Reclamações",
            "Atendimento e ocorrências · Supabase",
            `

            <div style="
                display:flex;
                justify-content:flex-end;
                margin-bottom:14px;
            ">

                <button
                    type="button"
                    onclick="abrirModuloReclamacoes()"
                    style="
                        border:1px solid rgba(245,213,140,.20);
                        background:rgba(245,213,140,.05);
                        color:#f5d58c;
                        padding:10px 14px;
                        border-radius:10px;
                        font-size:10px;
                        font-weight:800;
                        letter-spacing:.5px;
                    "
                >
                    ↻ ATUALIZAR
                </button>

            </div>


            <div style="
                display:grid;
                grid-template-columns:
                    repeat(
                        auto-fit,
                        minmax(170px,1fr)
                    );
                gap:12px;
                margin-bottom:22px;
            ">

                ${criarBloco(
                    "TOTAL",
                    String(total),
                    "Reclamações registradas"
                )}

                ${criarBloco(
                    "PENDENTES",
                    String(pendentes),
                    "Aguardando atendimento"
                )}

                ${criarBloco(
                    "EM ANÁLISE",
                    String(emAnalise),
                    "Em acompanhamento"
                )}

                ${criarBloco(
                    "RESOLVIDAS",
                    String(resolvidas),
                    "Atendimentos concluídos"
                )}

            </div>


            <div style="
                margin-bottom:12px;
            ">

                <h3 style="
                    color:#f5d58c;
                    margin:0 0 5px;
                ">
                    Central de reclamações
                </h3>

                <p style="
                    color:#8e838b;
                    font-size:10px;
                    margin:0;
                    line-height:1.6;
                ">
                    Registros carregados diretamente
                    do Supabase.
                </p>

            </div>


            ${registrosHTML}

            `
        );


    } catch (erro) {

        console.error(
            "Erro no módulo de reclamações:",
            erro
        );


        mostrarModulo(
            "Reclamações",
            "Atendimento e ocorrências",
            `

            <div style="
                padding:30px 20px;
                border:1px solid rgba(255,77,166,.18);
                border-radius:15px;
                background:rgba(255,77,166,.025);
            ">

                <div style="
                    color:#ff4da6;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    ERRO AO CARREGAR
                </div>

                <div style="
                    color:#ccc;
                    font-size:13px;
                    line-height:1.7;
                ">
                    Não foi possível carregar as
                    reclamações do Supabase.
                </div>

                <div style="
                    margin-top:12px;
                    color:#8e838b;
                    font-size:10px;
                    line-height:1.6;
                    word-break:break-word;
                ">
                    ${escaparHTML(
                        erro.message ||
                        String(erro)
                    )}
                </div>


                <button
                    type="button"
                    onclick="abrirModuloReclamacoes()"
                    style="
                        margin-top:18px;
                        border:1px solid rgba(245,213,140,.20);
                        background:rgba(245,213,140,.05);
                        color:#f5d58c;
                        padding:11px 15px;
                        border-radius:10px;
                        font-size:10px;
                        font-weight:800;
                    "
                >
                    ↻ TENTAR NOVAMENTE
                </button>

            </div>

            `
        );

    }

}


// =============================================================
// PLANOS
// =============================================================

function abrirModuloPlanos() {

    mostrarModulo(
        "Planos LUX",
        "ESSENCE · DESFIRE · ELITE · ROYAL · DIAMOND",
        `

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
            gap:12px;
        ">

            ${criarBloco(
                "LUX-ESSENCE",
                "GRÁTIS",
                "2 fotos + 1 vídeo"
            )}

            ${criarBloco(
                "LUX-DESFIRE",
                "R$ 29,90",
                "Plano mensal"
            )}

            ${criarBloco(
                "LUX-ELITE",
                "R$ 59,90",
                "Plano mensal"
            )}

            ${criarBloco(
                "LUX-ROYAL",
                "R$ 99,90",
                "Plano mensal"
            )}

            ${criarBloco(
                "LUX-DIAMOND",
                "R$ 149,90",
                "Inclui ROYAL · segurança presencial · logística"
            )}

        </div>

        `
    );

}


// =============================================================
// PAGAMENTOS
// =============================================================

function abrirModuloPagamentos() {

    mostrarModulo(
        "Pagamentos",
        "Controle financeiro",
        `

        <div style="
            display:grid;
            gap:14px;
        ">

            ${criarBloco(
                "MERCADO PAGO",
                "INTEGRAÇÃO",
                "Processamento de pagamentos"
            )}

            ${criarBloco(
                "PIX",
                "ATIVO",
                "Método de pagamento"
            )}

            <div style="
                padding:20px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:14px;
            ">

                <h3 style="
                    color:#f5d58c;
                    margin-bottom:8px;
                ">
                    Controle financeiro
                </h3>

                <p style="
                    color:#999;
                    font-size:12px;
                    line-height:1.7;
                ">
                    Esta área será utilizada para
                    acompanhamento dos pagamentos
                    realizados no sistema.
                </p>

            </div>

        </div>

        `
    );

}


// =============================================================
// ASSINATURAS
// =============================================================

function abrirModuloAssinaturas() {

    mostrarModulo(
        "Assinaturas",
        "Planos e status de assinatura",
        `

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
        ">

            ${criarBloco(
                "ESSENCE",
                "GRÁTIS",
                "Plano básico"
            )}

            ${criarBloco(
                "DESFIRE",
                "R$ 29,90",
                "Assinatura mensal"
            )}

            ${criarBloco(
                "ELITE",
                "R$ 59,90",
                "Assinatura mensal"
            )}

            ${criarBloco(
                "ROYAL",
                "R$ 99,90",
                "Assinatura mensal"
            )}

            ${criarBloco(
                "DIAMOND",
                "R$ 149,90",
                "Inclui ROYAL · acompanhamento presencial · logística"
            )}

        </div>


        <div style="
            margin-top:20px;
            padding:20px;
            border:1px solid rgba(245,213,140,.12);
            border-radius:14px;
            background:rgba(245,213,140,.025);
        ">

            <h3 style="
                color:#f5d58c;
                margin-bottom:10px;
            ">
                Controle de assinaturas
            </h3>

            <p style="
                color:#999;
                font-size:12px;
                line-height:1.7;
            ">
                Aqui serão exibidos os planos contratados,
                status das assinaturas e informações
                relacionadas à recorrência.
            </p>

        </div>

        `
    );

}


// =============================================================
// AVALIAÇÕES
// =============================================================

function abrirModuloAvaliacoes() {

    mostrarModulo(
        "Avaliações",
        "Notas e reputação dos perfis",
        `

        <div style="
            display:grid;
            gap:14px;
        ">

            ${criarBloco(
                "SISTEMA",
                "1 ★",
                "Avaliação dos perfis"
            )}

            <div style="
                padding:20px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:14px;
            ">

                <h3 style="
                    color:#f5d58c;
                    margin-bottom:10px;
                ">
                    Reputação
                </h3>

                <p style="
                    color:#999;
                    font-size:12px;
                    line-height:1.7;
                ">
                    O painel administrativo poderá
                    acompanhar as avaliações atribuídas
                    aos perfis das modelos.
                </p>

            </div>

        </div>

        `
    );

}


// =============================================================
// DOAÇÕES — LOCALSTORAGE
// =============================================================

function obterDoacoesAdmin() {

    try {

        const dados =
            localStorage.getItem("luxDoacoes");

        if (!dados) {
            return [];
        }

        const lista =
            JSON.parse(dados);

        return Array.isArray(lista)
            ? lista
            : [];

    } catch (erro) {

        console.error(
            "Erro ao carregar doações:",
            erro
        );

        return [];

    }

}


// =============================================================
// FORMATAR MOEDA
// =============================================================

function formatarMoedaAdmin(valor) {

    const numero =
        Number(valor);

    if (!Number.isFinite(numero)) {
        return "R$ 0,00";
    }

    return numero.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


// =============================================================
// FORMATAR DATA
// =============================================================

function formatarDataAdmin(valor) {

    if (!valor) {
        return "—";
    }

    try {

        const data =
            new Date(valor);

        if (Number.isNaN(data.getTime())) {
            return String(valor);
        }

        return data.toLocaleString(
            "pt-BR",
            {
                dateStyle: "short",
                timeStyle: "short"
            }
        );

    } catch (erro) {

        return String(valor);

    }

}


// =============================================================
// STATUS DA DOAÇÃO
// =============================================================

function textoStatusDoacao(status) {

    const mapa = {

        pix_gerado:
            "PIX GERADO",

        comprovante_solicitado:
            "COMPROVANTE SOLICITADO",

        comprovante_recebido:
            "COMPROVANTE RECEBIDO",

        pago:
            "PAGO",

        confirmado:
            "CONFIRMADO",

        cancelado:
            "CANCELADO",

        pendente:
            "PENDENTE"

    };

    return mapa[status]
        || String(status || "PENDENTE")
            .replace(/_/g, " ")
            .toUpperCase();

}


// =============================================================
// COR DO STATUS
// =============================================================

function corStatusDoacao(status) {

    if (
        status === "pago" ||
        status === "confirmado" ||
        status === "comprovante_recebido"
    ) {

        return "#8ff0b0";

    }

    if (
        status === "cancelado"
    ) {

        return "#ff7d8d";

    }

    if (
        status === "comprovante_solicitado"
    ) {

        return "#f5d58c";

    }

    return "#ff4da6";

}


// =============================================================
// DOAÇÕES
// =============================================================

function abrirModuloDoacoes() {

    const doacoes =
        obterDoacoesAdmin();

    const totalRegistros =
        doacoes.length;

    const totalArrecadado =
        doacoes.reduce(
            (total, item) => {

                const valor =
                    Number(item.valor);

                return total +
                    (
                        Number.isFinite(valor)
                            ? valor
                            : 0
                    );

            },
            0
        );

    const pixGerados =
        doacoes.filter(
            item =>
                !item.status ||
                item.status === "pix_gerado"
        ).length;

    const comprovantesSolicitados =
        doacoes.filter(
            item =>
                item.status ===
                "comprovante_solicitado"
        ).length;


    const listaOrdenada =
        [...doacoes].sort(
            (a, b) => {

                const dataA =
                    new Date(
                        a.data ||
                        a.atualizadoEm ||
                        0
                    ).getTime();

                const dataB =
                    new Date(
                        b.data ||
                        b.atualizadoEm ||
                        0
                    ).getTime();

                return dataB - dataA;

            }
        );


    const registrosHTML =
        listaOrdenada.length
        ?
        listaOrdenada.map(item => {

            const status =
                item.status ||
                "pix_gerado";

            const nome =
                item.nome ||
                "Não informado";

            const email =
                item.email ||
                "—";

            const whatsapp =
                item.whatsapp ||
                "—";

            const valor =
                formatarMoedaAdmin(
                    item.valor
                );

            const data =
                formatarDataAdmin(
                    item.data ||
                    item.atualizadoEm
                );

            const id =
                item.id ||
                "—";

            const comprovante =
                item.comprovante ||
                "pendente";

            return `

                <div style="
                    padding:18px;
                    border:1px solid rgba(245,213,140,.12);
                    border-radius:15px;
                    background:rgba(255,255,255,.025);
                    margin-bottom:12px;
                ">

                    <div style="
                        display:flex;
                        justify-content:space-between;
                        align-items:flex-start;
                        gap:12px;
                        flex-wrap:wrap;
                    ">

                        <div>

                            <div style="
                                color:#f5d58c;
                                font-family:'Playfair Display',serif;
                                font-size:20px;
                                margin-bottom:5px;
                            ">
                                ${escaparHTML(nome)}
                            </div>

                            <div style="
                                color:#8e838b;
                                font-size:10px;
                                word-break:break-word;
                            ">
                                ID: ${escaparHTML(id)}
                            </div>

                        </div>


                        <div style="
                            color:${corStatusDoacao(status)};
                            font-size:9px;
                            font-weight:800;
                            letter-spacing:1px;
                            border:1px solid ${corStatusDoacao(status)};
                            border-radius:20px;
                            padding:7px 10px;
                        ">
                            ${escaparHTML(
                                textoStatusDoacao(status)
                            )}
                        </div>

                    </div>


                    <div style="
                        display:grid;
                        grid-template-columns:
                            repeat(auto-fit,minmax(160px,1fr));
                        gap:10px;
                        margin-top:16px;
                    ">

                        ${criarBloco(
                            "VALOR",
                            valor,
                            "Valor registrado"
                        )}

                        ${criarBloco(
                            "WHATSAPP",
                            whatsapp,
                            "Contato informado"
                        )}

                        ${criarBloco(
                            "COMPROVANTE",
                            String(comprovante).toUpperCase(),
                            "Situação do comprovante"
                        )}

                    </div>


                    <div style="
                        margin-top:12px;
                        padding-top:12px;
                        border-top:1px solid rgba(255,255,255,.06);
                        color:#8e838b;
                        font-size:10px;
                        line-height:1.7;
                    ">

                        <div>
                            <strong style="color:#bbb;">
                                E-mail:
                            </strong>
                            ${escaparHTML(email)}
                        </div>

                        <div>
                            <strong style="color:#bbb;">
                                Data:
                            </strong>
                            ${escaparHTML(data)}
                        </div>

                    </div>

                </div>

            `;

        }).join("")
        :
        `

            <div style="
                padding:45px 20px;
                text-align:center;
                border:1px dashed rgba(245,213,140,.16);
                border-radius:15px;
                color:#8e838b;
            ">

                <div style="
                    font-size:34px;
                    color:#f5d58c;
                    margin-bottom:12px;
                ">
                    ◇
                </div>

                <div style="
                    color:#aaa;
                    font-size:13px;
                    margin-bottom:7px;
                ">
                    Nenhuma contribuição registrada.
                </div>

                <div style="
                    font-size:10px;
                    line-height:1.6;
                ">
                    As contribuições geradas pelo
                    doar-pix.html aparecerão aqui
                    neste mesmo dispositivo.
                </div>

            </div>

        `;


    mostrarModulo(
        "Doações",
        "PIX · Registros e acompanhamento",
        `

        <div style="
            display:flex;
            justify-content:flex-end;
            margin-bottom:14px;
        ">

            <button
                type="button"
                onclick="abrirModuloDoacoes()"
                style="
                    border:1px solid rgba(245,213,140,.20);
                    background:rgba(245,213,140,.05);
                    color:#f5d58c;
                    padding:10px 14px;
                    border-radius:10px;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:.5px;
                "
            >
                ↻ ATUALIZAR
            </button>

        </div>


        <div style="
            display:grid;
            grid-template-columns:
                repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
        ">

            ${criarBloco(
                "PIX",
                "ATIVO",
                "Sistema de contribuição"
            )}

            ${criarBloco(
                "MÍNIMO",
                "R$ 0,50",
                "Valor mínimo"
            )}

            ${criarBloco(
                "REGISTROS",
                String(totalRegistros),
                "Contribuições registradas"
            )}

            ${criarBloco(
                "TOTAL",
                formatarMoedaAdmin(
                    totalArrecadado
                ),
                "Soma dos registros"
            )}

            ${criarBloco(
                "PIX GERADOS",
                String(pixGerados),
                "Aguardando confirmação"
            )}

            ${criarBloco(
                "COMPROVANTES",
                String(comprovantesSolicitados),
                "Solicitados pelo atendimento"
            )}

        </div>


        <div style="
            margin-top:22px;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
                margin-bottom:12px;
                flex-wrap:wrap;
            ">

                <div>

                    <h3 style="
                        color:#f5d58c;
                        margin:0 0 5px;
                    ">
                        Registros de contribuições
                    </h3>

                    <p style="
                        color:#8e838b;
                        font-size:10px;
                        margin:0;
                    ">
                        Últimos registros encontrados neste dispositivo.
                    </p>

                </div>

            </div>


            ${registrosHTML}

        </div>


        <div style="
            margin-top:20px;
            padding:16px;
            border:1px solid rgba(255,77,166,.12);
            border-radius:14px;
            background:rgba(255,77,166,.025);
        ">

            <div style="
                color:#ff4da6;
                font-size:9px;
                font-weight:800;
                letter-spacing:1px;
                margin-bottom:7px;
            ">
                ATENÇÃO
            </div>

            <div style="
                color:#999;
                font-size:10px;
                line-height:1.7;
            ">
                Os registros atuais são armazenados
                localmente no navegador através do
                localStorage. Eles ainda não representam
                uma confirmação bancária ou de pagamento.
                A confirmação financeira real será integrada
                posteriormente ao backend/Supabase.
            </div>

        </div>

        `
    );

}


// =============================================================
// BLOCO VISUAL
// =============================================================

function criarBloco(
    titulo,
    valor,
    descricao
) {

    return `

        <div style="
            padding:18px;
            border:1px solid rgba(245,213,140,.13);
            border-radius:14px;
            background:rgba(255,255,255,.025);
        ">

            <div style="
                color:#81757e;
                font-size:9px;
                font-weight:800;
                letter-spacing:1.5px;
                margin-bottom:9px;
            ">
                ${escaparHTML(titulo)}
            </div>

            <div style="
                color:#f5d58c;
                font-family:'Playfair Display',serif;
                font-size:24px;
                margin-bottom:7px;
            ">
                ${escaparHTML(valor)}
            </div>

            <div style="
                color:#8e838b;
                font-size:10px;
                line-height:1.5;
            ">
                ${escaparHTML(descricao)}
            </div>

        </div>

    `;

}


// =============================================================
// FECHAR MÓDULO
// =============================================================

function fecharModuloAdmin() {

    const modal =
        document.getElementById(
            "modal-modulo-admin"
        );

    if (modal) {
        modal.remove();
    }

}


// =============================================================
// FECHAR MODAL DA FICHA AO CLICAR FORA
// =============================================================

document.addEventListener(
    "click",
    evento => {

        const modal =
            document.getElementById(
                "modal-ver-ficha"
            );

        if (
            modal &&
            evento.target === modal
        ) {

            fecharModalFicha();

        }

    }
);


// =============================================================
// ESC
// =============================================================

document.addEventListener(
    "keydown",
    evento => {

        if (evento.key !== "Escape") {
            return;
        }

        fecharModalFicha();

        fecharModuloAdmin();

    }
);


// =============================================================
// UTILITÁRIOS
// =============================================================

function atualizarElemento(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);

    if (elemento) {
        elemento.textContent = valor;
    }

}


function escaparHTML(valor) {

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escaparAtributo(valor) {

    return escaparHTML(valor);

}


// =============================================================
// IMPRESSÃO
// =============================================================

function imprimirFicha() {

    if (
        indiceSelecionado === null
    ) {
        return;
    }

    window.print();

}
