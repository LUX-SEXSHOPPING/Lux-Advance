// ============================================================
// LUX-ADVANCE
// PAINEL ADMINISTRATIVO
// VERSÃO CORRIGIDA E OTIMIZADA
// ============================================================

let listaPreCadastros = [];
let filtroStatus = "todos";
let indiceSelecionado = null;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", async function () {

    console.log("LUX-ADVANCE | Painel administrativo iniciado.");

    ativarBotoesFiltro();

    await carregarListaPreCadastros();

});


// ============================================================
// CARREGAR PRÉ-CADASTROS
// ============================================================

async function carregarListaPreCadastros() {

    const container =
        document.getElementById("lista-precadastros");

    if (!container) {

        console.error(
            "LUX: elemento #lista-precadastros não encontrado."
        );

        return;

    }


    container.innerHTML = `
        <div
            style="
                grid-column:1/-1;
                padding:50px 20px;
                text-align:center;
                color:#999;
            "
        >
            Carregando registros...
        </div>
    `;


    try {

        /*
         * Mantemos o sistema atual.
         * Os pré-cadastros continuam sendo
         * recuperados do localStorage.
         */

        const dadosSalvos =
            localStorage.getItem("fichasPreCadastro");


        if (!dadosSalvos) {

            listaPreCadastros = [];

        } else {

            const dados =
                JSON.parse(dadosSalvos);

            listaPreCadastros =
                Array.isArray(dados)
                    ? dados
                    : [];

        }


        atualizarResumo();

        aplicarFiltroERenderizar();


    } catch (erro) {

        console.error(
            "LUX: erro ao carregar pré-cadastros:",
            erro
        );


        listaPreCadastros = [];

        atualizarResumo();


        container.innerHTML = `
            <div
                style="
                    grid-column:1/-1;
                    padding:45px 20px;
                    text-align:center;
                "
            >

                <div
                    style="
                        color:#ff718d;
                        font-weight:700;
                        margin-bottom:8px;
                    "
                >
                    Não foi possível carregar os registros.
                </div>

                <div
                    style="
                        color:#888;
                        font-size:13px;
                    "
                >
                    Verifique os dados cadastrados
                    e tente novamente.
                </div>

            </div>
        `;

    }

}


// ============================================================
// RESUMO
// ============================================================

function atualizarResumo() {

    const total =
        listaPreCadastros.length;


    const pendentes =
        listaPreCadastros.filter(
            item =>
                normalizarStatus(item.status)
                === "pendente"
        ).length;


    const aprovados =
        listaPreCadastros.filter(
            item =>
                normalizarStatus(item.status)
                === "aprovado"
        ).length;


    const rejeitados =
        listaPreCadastros.filter(
            item =>
                normalizarStatus(item.status)
                === "rejeitado"
        ).length;


    atualizarNumero(
        "resumoTotal",
        total
    );


    atualizarNumero(
        "resumoPendentes",
        pendentes
    );


    atualizarNumero(
        "resumoAprovados",
        aprovados
    );


    atualizarNumero(
        "resumoRejeitados",
        rejeitados
    );

}


// ============================================================
// ATUALIZAR NÚMERO
// ============================================================

function atualizarNumero(id, valor) {

    const elemento =
        document.getElementById(id);


    if (elemento) {

        elemento.textContent =
            String(valor);

    }

}


// ============================================================
// NORMALIZAR STATUS
// ============================================================

function normalizarStatus(status) {

    if (!status) {

        return "pendente";

    }


    return String(status)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


// ============================================================
// FILTROS
// ============================================================

function ativarBotoesFiltro() {

    const botoes =
        document.querySelectorAll(
            ".btn-filtro"
        );


    botoes.forEach(function (botao) {

        botao.addEventListener(
            "click",
            function () {

                const filtro =
                    botao.dataset.filtro
                    || "todos";


                filtroStatus =
                    filtro;


                botoes.forEach(
                    function (item) {

                        item.classList.remove(
                            "ativo"
                        );

                    }
                );


                botao.classList.add(
                    "ativo"
                );


                aplicarFiltroERenderizar();

            }
        );

    });

}


// ============================================================
// FILTRAR E RENDERIZAR
// ============================================================

function aplicarFiltroERenderizar() {

    let dados =
        [...listaPreCadastros];


    if (filtroStatus !== "todos") {

        dados =
            dados.filter(function (item) {

                return (
                    normalizarStatus(
                        item.status
                    )
                    === filtroStatus
                );

            });

    }


    desenharLista(dados);

}


// ============================================================
// DESENHAR LISTA
// ============================================================

function desenharLista(lista) {

    const container =
        document.getElementById(
            "lista-precadastros"
        );


    if (!container) {

        return;

    }


    /*
     * NENHUM REGISTRO
     */

    if (!lista.length) {

        let mensagem =
            "Nenhum registro encontrado.";


        if (
            filtroStatus === "pendente"
        ) {

            mensagem =
                "Nenhuma modelo pendente.";

        }


        if (
            filtroStatus === "aprovado"
        ) {

            mensagem =
                "Nenhuma modelo aprovada.";

        }


        if (
            filtroStatus === "rejeitado"
        ) {

            mensagem =
                "Nenhuma modelo rejeitada.";

        }


        container.innerHTML = `

            <div
                style="
                    grid-column:1/-1;
                    padding:55px 20px;
                    text-align:center;
                "
            >

                <div
                    style="
                        width:58px;
                        height:58px;
                        margin:0 auto 16px;
                        border-radius:50%;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        border:1px solid rgba(248,213,138,.20);
                        color:#f8d58a;
                        font-size:24px;
                    "
                >
                    ✦
                </div>

                <div
                    style="
                        color:#e8dfe5;
                        font-size:16px;
                        font-weight:600;
                        margin-bottom:7px;
                    "
                >
                    ${mensagem}
                </div>

                <div
                    style="
                        color:#777;
                        font-size:12px;
                    "
                >
                    Os registros aparecerão
                    automaticamente nesta área.
                </div>

            </div>

        `;

        return;

    }


    /*
     * EXISTEM REGISTROS
     */

    container.innerHTML =
        lista.map(function (item) {

            const indice =
                listaPreCadastros.indexOf(
                    item
                );


            const status =
                normalizarStatus(
                    item.status
                );


            const nome =
                escaparHTML(
                    item.nome
                    || item.apelido
                    || "Sem nome"
                );


            const whatsapp =
                escaparHTML(
                    item.whatsapp
                    || item.telefone
                    || "—"
                );


            const cidade =
                escaparHTML(
                    item.cidade
                    || "—"
                );


            const data =
                escaparHTML(
                    item.dataEnvio
                    || item.created_at
                    || "—"
                );


            return `

                <article class="card-registro">

                    <h4>
                        ${nome}
                    </h4>


                    <p>
                        📱 ${whatsapp}
                    </p>


                    <p>
                        📍 ${cidade}
                    </p>


                    <p>
                        📅 ${data}
                    </p>


                    <p>
                        Status:

                        <strong
                            class="status-${status}"
                        >
                            ${status.toUpperCase()}
                        </strong>
                    </p>


                    <button
                        type="button"
                        class="btn"
                        onclick="abrirVerFicha(${indice})"
                    >
                        VER FICHA
                    </button>

                </article>

            `;

        }).join("");

}


// ============================================================
// SEGURANÇA BÁSICA DE HTML
// ============================================================

function escaparHTML(valor) {

    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// ABRIR FICHA
// ============================================================

function abrirVerFicha(indice) {

    if (
        indice === null ||
        indice === undefined
    ) {

        return;

    }


    const dados =
        listaPreCadastros[indice];


    if (!dados) {

        return;

    }


    indiceSelecionado =
        indice;


    const corpo =
        document.getElementById(
            "corpo-ficha"
        );


    if (!corpo) {

        return;

    }


    const nome =
        escaparHTML(
            dados.nome
            || dados.apelido
            || "Sem nome"
        );


    const whatsapp =
        escaparHTML(
            dados.whatsapp
            || dados.telefone
            || "—"
        );


    const idade =
        escaparHTML(
            dados.idade
            || "—"
        );


    const altura =
        escaparHTML(
            dados.altura
            || "—"
        );


    const cidade =
        escaparHTML(
            dados.cidade
            || "—"
        );


    const sobre =
        escaparHTML(
            dados.sobre
            || dados.descricao
            || "—"
        );


    const status =
        normalizarStatus(
            dados.status
        );


    let fotosHTML =
        `
            <p>
                <strong>Fotos:</strong>
                Nenhuma foto enviada.
            </p>
        `;


    if (
        Array.isArray(dados.fotos)
        &&
        dados.fotos.length
    ) {

        fotosHTML = `

            <p>
                <strong>Fotos:</strong>
            </p>

            <div
                style="
                    display:grid;
                    grid-template-columns:
                        repeat(auto-fit,minmax(120px,1fr));
                    gap:10px;
                "
            >

                ${
                    dados.fotos
                        .map(function (url) {

                            return `
                                <img
                                    src="${escaparHTML(url)}"
                                    alt="Foto"
                                    style="
                                        width:100%;
                                        aspect-ratio:1;
                                        object-fit:cover;
                                        border-radius:12px;
                                        border:
                                          1px solid
                                          rgba(248,213,138,.15);
                                    "
                                >
                            `;

                        })
                        .join("")
                }

            </div>

        `;

    }


    let videoHTML =
        `
            <p>
                <strong>Vídeo:</strong>
                Nenhum vídeo enviado.
            </p>
        `;


    if (dados.video) {

        videoHTML = `

            <p>
                <strong>Vídeo:</strong>
            </p>

            <video
                controls
                style="
                    width:100%;
                    max-height:360px;
                    border-radius:12px;
                "
                src="${escaparHTML(dados.video)}"
            ></video>

        `;

    }


    corpo.innerHTML = `

        <div
            style="
                display:grid;
                gap:14px;
            "
        >

            <div
                style="
                    padding:17px;
                    border-radius:14px;
                    background:rgba(255,255,255,.025);
                    border:1px solid rgba(255,255,255,.07);
                "
            >

                <div
                    style="
                        color:#f8d58a;
                        font-family:Playfair Display,serif;
                        font-size:24px;
                        margin-bottom:8px;
                    "
                >
                    ${nome}
                </div>

                <div
                    style="
                        color:#888;
                        font-size:12px;
                        text-transform:uppercase;
                        letter-spacing:1px;
                    "
                >
                    Status:
                    <strong
                        class="status-${status}"
                    >
                        ${status}
                    </strong>
                </div>

            </div>


            <p>
                <strong>WhatsApp:</strong>
                ${whatsapp}
            </p>


            <p>
                <strong>Idade:</strong>
                ${idade}
            </p>


            <p>
                <strong>Altura:</strong>
                ${altura}
            </p>


            <p>
                <strong>Cidade/UF:</strong>
                ${cidade}
            </p>


            <p>
                <strong>Informações:</strong><br>
                ${sobre}
            </p>


            ${fotosHTML}


            ${videoHTML}

        </div>

    `;


    const modal =
        document.getElementById(
            "modal-ver-ficha"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// ============================================================
// FECHAR MODAL
// ============================================================

function fecharModalFicha() {

    const modal =
        document.getElementById(
            "modal-ver-ficha"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    indiceSelecionado =
        null;

}


// ============================================================
// SALVAR
// ============================================================

async function salvarAlteracoes() {

    try {

        localStorage.setItem(
            "fichasPreCadastro",
            JSON.stringify(
                listaPreCadastros
            )
        );


        atualizarResumo();

        aplicarFiltroERenderizar();


    } catch (erro) {

        console.error(
            "Erro ao salvar alterações:",
            erro
        );

    }

}


// ============================================================
// APROVAR / REJEITAR
// ============================================================

document.addEventListener(
    "click",
    async function (evento) {


        if (
            evento.target.id
            === "botao-aprovar"
        ) {

            if (
                indiceSelecionado === null
            ) {

                return;

            }


            listaPreCadastros[
                indiceSelecionado
            ].status =
                "aprovado";


            await salvarAlteracoes();


            fecharModalFicha();


            return;

        }


        if (
            evento.target.id
            === "botao-rejeitar"
        ) {

            if (
                indiceSelecionado === null
            ) {

                return;

            }


            listaPreCadastros[
                indiceSelecionado
            ].status =
                "rejeitado";


            await salvarAlteracoes();


            fecharModalFicha();


        }

    }
);


// ============================================================
// IMPRIMIR
// ============================================================

function imprimirFicha() {

    if (
        indiceSelecionado === null
    ) {

        return;

    }


    window.print();

}


// ============================================================
// FECHAR MODAL CLICANDO FORA
// ============================================================

window.addEventListener(
    "click",
    function (evento) {

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


// ============================================================
// EXPOR FUNÇÕES
// PARA OS BOTÕES DO HTML
// ============================================================

window.abrirVerFicha =
    abrirVerFicha;

window.fecharModalFicha =
    fecharModalFicha;

window.imprimirFicha =
    imprimirFicha;
