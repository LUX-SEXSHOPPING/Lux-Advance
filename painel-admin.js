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
// =============================================================

function ativarModulosAdmin() {

    const cards =
        document.querySelectorAll(
            ".admin-card"
        );

    cards.forEach(card => {

        card.addEventListener(
            "click",
            function() {

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

    const destino =
        document.getElementById(
            "lista-precadastros"
        );

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
// =============================================================

function abrirModuloReclamacoes() {

    mostrarModulo(
        "Reclamações",
        "Atendimento e ocorrências",
        `

        <div style="
            display:grid;
            gap:12px;
        ">

            ${criarBloco(
                "STATUS",
                "CENTRAL",
                "Área de atendimento"
            )}

            <div style="
                padding:20px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:14px;
                background:rgba(255,255,255,.02);
            ">

                <h3 style="
                    color:#f5d58c;
                    margin-bottom:10px;
                ">
                    Central de reclamações
                </h3>

                <p style="
                    color:#999;
                    font-size:12px;
                    line-height:1.7;
                ">
                    As reclamações poderão ser acompanhadas
                    por usuário, login, e-mail, assunto,
                    mensagem, status, data de criação e
                    atualização.
                </p>

            </div>

        </div>

        `
    );

}


// =============================================================
// PLANOS
// =============================================================

function abrirModuloPlanos() {

    mostrarModulo(
        "Planos LUX",
        "ESSENCE · DESFIRE · ELITE · ROYAL",
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
// DOAÇÕES
// =============================================================

function abrirModuloDoacoes() {

    mostrarModulo(
        "Doações",
        "Registros e acompanhamento",
        `

        <div style="
            display:grid;
            grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
            gap:12px;
        ">

            ${criarBloco(
                "PIX",
                "ATIVO",
                "Sistema de doação"
            )}

            ${criarBloco(
                "MÍNIMO",
                "R$ 5,00",
                "Valor mínimo"
            )}

            ${criarBloco(
                "CONTROLE",
                "ADMIN",
                "Acompanhamento"
            )}

        </div>


        <div style="
            margin-top:20px;
            padding:20px;
            border:1px solid rgba(255,255,255,.07);
            border-radius:14px;
        ">

            <h3 style="
                color:#f5d58c;
                margin-bottom:10px;
            ">
                Controle de doações
            </h3>

            <p style="
                color:#999;
                font-size:12px;
                line-height:1.7;
            ">
                Área destinada ao acompanhamento
                dos registros de doações recebidas.
            </p>

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
