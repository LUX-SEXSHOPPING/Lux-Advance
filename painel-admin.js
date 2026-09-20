// =============================================================
// LUX-ADVANCE — PAINEL ADMINISTRATIVO
// FUNCIONALIDADE DOS MÓDULOS
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

    const container = document.getElementById("lista-precadastros");

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
                    padding:30px;
                ">
                    <p>
                        Não foi possível carregar os registros.
                    </p>
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
// FILTRAR E RENDERIZAR
// =============================================================

function aplicarFiltroERenderizar() {

    let dados = [...listaPreCadastros];

    dados = dados.map(item => {

        if (!item.status) {
            item.status = "pendente";
        }

        return item;

    });


    if (filtroStatus !== "todos") {

        dados = dados.filter(item =>
            item.status === filtroStatus
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
                padding:35px 20px;
                opacity:.75;
            ">
                <div style="
                    font-size:32px;
                    margin-bottom:10px;
                ">
                    ◇
                </div>

                <p>
                    Nenhum registro encontrado.
                </p>
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
                            registro.nome ||
                            "Sem nome"
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
                        style="margin-top:8px"
                        data-indice="${indiceOriginal}"
                        onclick="abrirVerFichaPorIndice(${indiceOriginal})"
                    >
                        Ver ficha completa
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

        <p>
            <strong>Nome/Apelido:</strong>
            ${escaparHTML(
                dados.nome || "—"
            )}
        </p>

        <p>
            <strong>WhatsApp:</strong>
            ${escaparHTML(
                dados.whatsapp || "—"
            )}
        </p>

        <p>
            <strong>Idade:</strong>
            ${escaparHTML(
                dados.idade || "—"
            )}
            ${dados.idade ? "anos" : ""}
        </p>

        <p>
            <strong>Altura:</strong>
            ${escaparHTML(
                dados.altura || "—"
            )}
        </p>

        <p>
            <strong>Cidade/UF:</strong>
            ${escaparHTML(
                dados.cidade || "—"
            )}
        </p>

        <p>
            <strong>Informações:</strong>
            <br>

            ${escaparHTML(
                dados.sobre || "—"
            )}
        </p>

        ${
            fotos.length
            ?

            `
                <p>
                    <strong>Fotos:</strong>
                </p>

                <div style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:10px;
                ">

                    ${fotos.map(url => `
                        <img
                            src="${escaparAtributo(url)}"
                            alt="Foto do perfil"
                            style="
                                width:120px;
                                height:120px;
                                object-fit:cover;
                                border-radius:10px;
                            "
                        >
                    `).join("")}

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
                <p>
                    <strong>Vídeo:</strong>
                </p>

                <video
                    controls
                    style="
                        width:100%;
                        max-width:500px;
                        border-radius:10px;
                    "
                    src="${escaparAtributo(
                        dados.video
                    )}"
                ></video>
            `

            :

            `
                <p>
                    <strong>Vídeo:</strong>
                    Nenhum enviado.
                </p>
            `
        }

    `;


    modal.style.display = "flex";

}


// =============================================================
// FECHAR MODAL
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
// SALVAR ALTERAÇÕES
// =============================================================

async function salvarAlteracoes() {

    localStorage.setItem(
        "fichasPreCadastro",
        JSON.stringify(
            listaPreCadastros
        )
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
                !listaPreCadastros[
                    indiceSelecionado
                ]
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
                !listaPreCadastros[
                    indiceSelecionado
                ]
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
// MÓDULOS DO PAINEL
// =============================================================

function ativarModulosAdmin() {

    const cards =
        document.querySelectorAll(
            ".modulo-card, .admin-card, [data-modulo]"
        );


    cards.forEach(card => {

        card.style.cursor = "pointer";


        card.addEventListener(
            "click",
            evento => {

                if (
                    evento.target.closest(
                        "button, a"
                    )
                ) {
                    return;
                }


                const titulo =
                    (
                        card.innerText || ""
                    ).toLowerCase();


                // -----------------------------------------
                // GESTÃO DE MODELOS
                // -----------------------------------------

                if (
                    titulo.includes(
                        "gestão de modelos"
                    ) ||
                    titulo.includes(
                        "gestao de modelos"
                    )
                ) {

                    const destino =
                        document.getElementById(
                            "lista-precadastros"
                        );


                    if (destino) {

                        destino.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                    return;
                }


                // -----------------------------------------
                // USUÁRIOS
                // -----------------------------------------

                if (
                    titulo.includes(
                        "usuários"
                    ) ||
                    titulo.includes(
                        "usuarios"
                    )
                ) {

                    abrirModuloAdmin(
                        "Usuários",
                        "A área de usuários foi selecionada."
                    );

                    return;
                }


                // -----------------------------------------
                // RECLAMAÇÕES
                // -----------------------------------------

                if (
                    titulo.includes(
                        "reclamações"
                    ) ||
                    titulo.includes(
                        "reclamacoes"
                    )
                ) {

                    abrirModuloAdmin(
                        "Reclamações",
                        "A área de reclamações foi selecionada."
                    );

                    return;
                }


                // -----------------------------------------
                // PLANOS
                // -----------------------------------------

                if (
                    titulo.includes(
                        "planos lux"
                    )
                ) {

                    abrirModuloAdmin(
                        "Planos LUX",
                        "A área de planos foi selecionada."
                    );

                    return;
                }


                // -----------------------------------------
                // PAGAMENTOS
                // -----------------------------------------

                if (
                    titulo.includes(
                        "pagamentos"
                    )
                ) {

                    abrirModuloAdmin(
                        "Pagamentos",
                        "A área de pagamentos foi selecionada."
                    );

                    return;
                }


                // -----------------------------------------
                // ASSINATURAS
                // -----------------------------------------

                if (
                    titulo.includes(
                        "assinaturas"
                    )
                ) {

                    abrirModuloAdmin(
                        "Assinaturas",
                        "A área de assinaturas foi selecionada."
                    );

                    return;
                }


                // -----------------------------------------
                // AVALIAÇÕES
                // -----------------------------------------

                if (
                    titulo.includes(
                        "avaliações"
                    ) ||
                    titulo.includes(
                        "avaliacoes"
                    )
                ) {

                    abrirModuloAdmin(
                        "Avaliações",
                        "A área de avaliações foi selecionada."
                    );

                    return;
                }


                // -----------------------------------------
                // DOAÇÕES
                // -----------------------------------------

                if (
                    titulo.includes(
                        "doações"
                    ) ||
                    titulo.includes(
                        "doacoes"
                    )
                ) {

                    abrirModuloAdmin(
                        "Doações",
                        "A área de doações foi selecionada."
                    );

                }

            }
        );

    });

}


// =============================================================
// MODAL DE MÓDULO
// =============================================================

function abrirModuloAdmin(
    titulo,
    mensagem
) {

    let modal =
        document.getElementById(
            "modal-modulo-admin"
        );


    if (!modal) {

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
            padding:20px;
            background:rgba(0,0,0,.78);
            backdrop-filter:blur(8px);
        `;


        modal.innerHTML = `

            <div style="
                width:100%;
                max-width:480px;
                padding:30px;
                border:1px solid rgba(248,213,138,.25);
                border-radius:18px;
                background:#120b0e;
                color:#fff;
                box-shadow:0 25px 80px rgba(0,0,0,.6);
            ">

                <div style="
                    color:#f8d58a;
                    font-size:12px;
                    letter-spacing:3px;
                    margin-bottom:12px;
                ">
                    LUX-ADVANCE
                </div>

                <h2
                    id="titulo-modulo-admin"
                    style="
                        margin:0 0 12px;
                        color:#f8d58a;
                    "
                ></h2>

                <p
                    id="texto-modulo-admin"
                    style="
                        color:#bbb;
                        line-height:1.6;
                    "
                ></p>

                <button
                    type="button"
                    id="fechar-modulo-admin"
                    style="
                        margin-top:20px;
                        padding:12px 20px;
                        border-radius:10px;
                        border:1px solid #f8d58a;
                        background:transparent;
                        color:#f8d58a;
                        cursor:pointer;
                    "
                >
                    FECHAR
                </button>

            </div>

        `;


        document.body.appendChild(modal);


        document
            .getElementById(
                "fechar-modulo-admin"
            )
            .addEventListener(
                "click",
                () => {
                    modal.remove();
                }
            );

    }


    document.getElementById(
        "titulo-modulo-admin"
    ).textContent = titulo;


    document.getElementById(
        "texto-modulo-admin"
    ).textContent = mensagem;


    modal.style.display = "flex";

}


// =============================================================
// FECHAR MODAL AO CLICAR FORA
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

        if (evento.key === "Escape") {

            fecharModalFicha();

            const modal =
                document.getElementById(
                    "modal-modulo-admin"
                );

            if (modal) {
                modal.remove();
            }

        }

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
