/* ============================================================
   LUX-ADVANCE
   PAINEL ADMINISTRATIVO
   MOTOR FUNCIONAL
   VERSÃO INTEGRADA
   ============================================================ */

(function () {

    "use strict";

    let registrosModelos = [];
    let filtroAtual = "todos";
    let fichaAtual = null;


    /* =========================================================
       SUPABASE
    ========================================================= */

    function supabaseDisponivel() {

        return (
            window.luxSupabase &&
            typeof window.luxSupabase.from === "function"
        );

    }


    /* =========================================================
       INICIALIZAÇÃO
    ========================================================= */

    document.addEventListener(
        "DOMContentLoaded",
        async function () {

            try {

                if (!supabaseDisponivel()) {

                    mostrarErro(
                        "Supabase não foi inicializado."
                    );

                    return;

                }

                await carregarModelos();

                configurarFiltros();

                atualizarDashboard();

            } catch (erro) {

                console.error(
                    "Erro ao iniciar painel:",
                    erro
                );

                mostrarErro(
                    "Não foi possível carregar os dados administrativos."
                );

            }

        }
    );


    /* =========================================================
       CARREGAR PRÉ-CADASTROS
    ========================================================= */

    async function carregarModelos() {

        const lista =
            document.getElementById(
                "lista-precadastros"
            );

        if (!lista) {
            return;
        }


        lista.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:50px 20px;
                text-align:center;
                color:#777;
            ">
                Carregando registros...
            </div>
        `;


        const resposta =
            await window.luxSupabase
            .from("pre_cadastros_modelos")
            .select("*")
            .order(
                "criado_em",
                {
                    ascending:false
                }
            );


        if (resposta.error) {

            console.error(
                "Erro ao carregar modelos:",
                resposta.error
            );

            lista.innerHTML = `
                <div style="
                    grid-column:1/-1;
                    padding:40px 20px;
                    text-align:center;
                    color:#ff718d;
                ">
                    Erro ao carregar os cadastros.
                    <br>
                    <small>
                        ${escapeHTML(
                            resposta.error.message || ""
                        )}
                    </small>
                </div>
            `;

            return;

        }


        registrosModelos =
            resposta.data || [];


        renderizarModelos();

        atualizarDashboard();

    }


    /* =========================================================
       RENDERIZAR MODELOS
    ========================================================= */

    function renderizarModelos() {

        const lista =
            document.getElementById(
                "lista-precadastros"
            );

        if (!lista) {
            return;
        }


        let dados =
            registrosModelos.filter(
                function (registro) {

                    if (
                        filtroAtual === "todos"
                    ) {

                        return true;

                    }

                    return normalizarStatus(
                        registro.status
                    ) === filtroAtual;

                }
            );


        if (!dados.length) {

            lista.innerHTML = `
                <div style="
                    grid-column:1/-1;
                    padding:50px 20px;
                    text-align:center;
                    color:#777;
                ">
                    Nenhum cadastro encontrado.
                </div>
            `;

            return;

        }


        lista.innerHTML =
            dados
            .map(
                criarCardModelo
            )
            .join("");


        lista
            .querySelectorAll(
                "[data-abrir-ficha]"
            )
            .forEach(
                function (botao) {

                    botao.addEventListener(
                        "click",
                        function () {

                            const id =
                                botao.getAttribute(
                                    "data-abrir-ficha"
                                );

                            abrirFicha(id);

                        }
                    );

                }
            );

    }


    /* =========================================================
       CARD DO MODELO
    ========================================================= */

    function criarCardModelo(
        registro
    ) {

        const status =
            normalizarStatus(
                registro.status
            );


        const nome =
            registro.nome ||
            registro.nickname ||
            "Cadastro sem nome";


        const cidade =
            registro.cidade ||
            "Não informada";


        const whatsapp =
            registro.whatsapp ||
            "Não informado";


        const email =
            registro.email ||
            "Não informado";


        const statusTexto =
            formatarStatus(
                status
            );


        const statusClasse =
            status === "aprovado"
                ? "status-aprovado"
                : status === "rejeitado"
                    ? "status-rejeitado"
                    : "status-pendente";


        return `

            <article
                class="card-registro"
            >

                <h4>
                    ${escapeHTML(nome)}
                </h4>


                <p>
                    <strong>
                        Nickname:
                    </strong>

                    ${escapeHTML(
                        registro.nickname ||
                        "Não informado"
                    )}
                </p>


                <p>
                    <strong>
                        Cidade:
                    </strong>

                    ${escapeHTML(cidade)}
                </p>


                <p>
                    <strong>
                        WhatsApp:
                    </strong>

                    ${escapeHTML(whatsapp)}
                </p>


                <p>
                    <strong>
                        E-mail:
                    </strong>

                    ${escapeHTML(email)}
                </p>


                <p>
                    <strong>
                        Status:
                    </strong>

                    <span
                        class="${statusClasse}"
                    >
                        ${escapeHTML(statusTexto)}
                    </span>
                </p>


                <button
                    type="button"
                    class="btn"
                    data-abrir-ficha="${escapeHTML(
                        registro.id
                    )}"
                >
                    VER FICHA
                </button>

            </article>

        `;

    }


    /* =========================================================
       FILTROS
    ========================================================= */

    function configurarFiltros() {

        document
            .querySelectorAll(
                ".btn-filtro"
            )
            .forEach(
                function (botao) {

                    botao.addEventListener(
                        "click",
                        function () {

                            document
                                .querySelectorAll(
                                    ".btn-filtro"
                                )
                                .forEach(
                                    function (item) {

                                        item.classList.remove(
                                            "ativo"
                                        );

                                    }
                                );


                            botao.classList.add(
                                "ativo"
                            );


                            filtroAtual =
                                botao.getAttribute(
                                    "data-filtro"
                                ) ||
                                "todos";


                            renderizarModelos();

                        }
                    );

                }
            );

    }


    /* =========================================================
       ATIVAR FILTRO TODOS
       ========================================================= */

    function ativarFiltroTodos() {

        filtroAtual = "todos";


        document
            .querySelectorAll(
                ".btn-filtro"
            )
            .forEach(
                function (botao) {

                    const filtro =
                        botao.getAttribute(
                            "data-filtro"
                        );

                    if (
                        filtro === "todos"
                    ) {

                        botao.classList.add(
                            "ativo"
                        );

                    } else {

                        botao.classList.remove(
                            "ativo"
                        );

                    }

                }
            );

    }


    /* =========================================================
       DASHBOARD
    ========================================================= */

    function atualizarDashboard() {

        const total =
            registrosModelos.length;


        const pendentes =
            registrosModelos.filter(
                function (item) {

                    return (
                        normalizarStatus(
                            item.status
                        ) === "pendente"
                    );

                }
            ).length;


        const aprovados =
            registrosModelos.filter(
                function (item) {

                    return (
                        normalizarStatus(
                            item.status
                        ) === "aprovado"
                    );

                }
            ).length;


        const rejeitados =
            registrosModelos.filter(
                function (item) {

                    return (
                        normalizarStatus(
                            item.status
                        ) === "rejeitado"
                    );

                }
            ).length;


        definirTexto(
            "resumoTotal",
            total
        );

        definirTexto(
            "resumoPendentes",
            pendentes
        );

        definirTexto(
            "resumoAprovados",
            aprovados
        );

        definirTexto(
            "resumoRejeitados",
            rejeitados
        );

    }


    /* =========================================================
       ABRIR FICHA
    ========================================================= */

    async function abrirFicha(
        id
    ) {

        const registro =
            registrosModelos.find(
                function (item) {

                    return String(item.id) ===
                        String(id);

                }
            );


        if (!registro) {

            alert(
                "Cadastro não encontrado."
            );

            return;

        }


        fichaAtual =
            registro;


        const modal =
            document.getElementById(
                "modal-ver-ficha"
            );


        const corpo =
            document.getElementById(
                "corpo-ficha"
            );


        if (!modal || !corpo) {
            return;
        }


        corpo.innerHTML =
            criarFichaHTML(
                registro
            );


        modal.style.display =
            "flex";


        const aprovar =
            document.getElementById(
                "botao-aprovar"
            );


        const rejeitar =
            document.getElementById(
                "botao-rejeitar"
            );


        if (aprovar) {

            aprovar.onclick =
                function () {

                    alterarStatusModelo(
                        "aprovado"
                    );

                };

        }


        if (rejeitar) {

            rejeitar.onclick =
                function () {

                    alterarStatusModelo(
                        "rejeitado"
                    );

                };

        }

    }


    /* =========================================================
       FICHA COMPLETA
    ========================================================= */

    function criarFichaHTML(
        registro
    ) {

        return `

            <div style="
                display:grid;
                gap:10px;
            ">

                ${campoFicha(
                    "Nome",
                    registro.nome
                )}

                ${campoFicha(
                    "Nickname",
                    registro.nickname
                )}

                ${campoFicha(
                    "WhatsApp",
                    registro.whatsapp
                )}

                ${campoFicha(
                    "Idade",
                    registro.idade
                )}

                ${campoFicha(
                    "Altura",
                    registro.altura
                )}

                ${campoFicha(
                    "Cidade",
                    registro.cidade
                )}

                ${campoFicha(
                    "E-mail",
                    registro.email
                )}

                ${campoFicha(
                    "Endereço",
                    registro.endereco
                )}

                ${campoFicha(
                    "Observações",
                    registro.observacoes
                )}

                ${campoFicha(
                    "Status",
                    formatarStatus(
                        normalizarStatus(
                            registro.status
                        )
                    )
                )}

                ${campoFicha(
                    "Criado em",
                    formatarData(
                        registro.criado_em
                    )
                )}

                ${campoFicha(
                    "Atualizado em",
                    formatarData(
                        registro.atualizado_em
                    )
                )}

            </div>

        `;

    }


    function campoFicha(
        titulo,
        valor
    ) {

        return `

            <div style="
                padding:14px;
                border:1px solid rgba(255,255,255,.07);
                border-radius:10px;
                background:rgba(255,255,255,.02);
            ">

                <div style="
                    margin-bottom:5px;
                    color:#8f858d;
                    font-size:9px;
                    font-weight:800;
                    letter-spacing:1.3px;
                    text-transform:uppercase;
                ">
                    ${escapeHTML(titulo)}
                </div>

                <div style="
                    color:#eee7eb;
                    font-size:12px;
                    line-height:1.6;
                    word-break:break-word;
                ">
                    ${escapeHTML(
                        valor === null ||
                        valor === undefined ||
                        valor === ""
                            ? "Não informado"
                            : String(valor)
                    )}
                </div>

            </div>

        `;

    }


    /* =========================================================
       ALTERAR STATUS
    ========================================================= */

    async function alterarStatusModelo(
        novoStatus
    ) {

        if (!fichaAtual) {
            return;
        }


        const nome =
            fichaAtual.nome ||
            fichaAtual.nickname ||
            "esta modelo";


        const confirmar =
            window.confirm(
                "Deseja realmente " +
                (
                    novoStatus === "aprovado"
                        ? "APROVAR"
                        : "REJEITAR"
                ) +
                " o cadastro de " +
                nome +
                "?"
            );


        if (!confirmar) {
            return;
        }


        try {

            const agora =
                new Date().toISOString();


            const resposta =
                await window.luxSupabase
                .from(
                    "pre_cadastros_modelos"
                )
                .update({
                    status:novoStatus,
                    atualizado_em:agora
                })
                .eq(
                    "id",
                    fichaAtual.id
                );


            if (resposta.error) {

                console.error(
                    resposta.error
                );

                alert(
                    "Não foi possível atualizar o cadastro.\n\n" +
                    resposta.error.message
                );

                return;

            }


            fichaAtual.status =
                novoStatus;

            fichaAtual.atualizado_em =
                agora;


            const indice =
                registrosModelos.findIndex(
                    function (item) {

                        return String(item.id) ===
                            String(fichaAtual.id);

                    }
                );


            if (indice !== -1) {

                registrosModelos[indice] =
                    {
                        ...registrosModelos[indice],
                        status:novoStatus,
                        atualizado_em:agora
                    };

            }


            /*
             * IMPORTANTE:
             * depois de aprovar/rejeitar,
             * voltamos para TODOS.
             *
             * Assim um modelo rejeitado
             * não desaparece simplesmente
             * porque estava no filtro PENDENTE.
             */

            ativarFiltroTodos();

            fecharModalFicha();

            renderizarModelos();

            atualizarDashboard();


            alert(
                novoStatus === "aprovado"
                    ? "Cadastro aprovado com sucesso."
                    : "Cadastro rejeitado com sucesso e mantido no painel."
            );


        } catch (erro) {

            console.error(
                erro
            );

            alert(
                "Erro inesperado ao atualizar o cadastro."
            );

        }

    }


    /* =========================================================
       FECHAR MODAL
    ========================================================= */

    window.fecharModalFicha =
        function () {

            const modal =
                document.getElementById(
                    "modal-ver-ficha"
                );


            if (modal) {

                modal.style.display =
                    "none";

            }


            fichaAtual =
                null;

        };


    /* =========================================================
       IMPRIMIR FICHA
    ========================================================= */

    window.imprimirFicha =
        function () {

            if (!fichaAtual) {
                return;
            }


            const conteudo =
                criarFichaHTML(
                    fichaAtual
                );


            const janela =
                window.open(
                    "",
                    "_blank",
                    "width=900,height=700"
                );


            if (!janela) {

                alert(
                    "O navegador bloqueou a janela de impressão."
                );

                return;

            }


            janela.document.write(`
                <!DOCTYPE html>

                <html lang="pt-BR">

                <head>

                    <meta charset="UTF-8">

                    <title>
                        Ficha LUX
                    </title>

                    <style>

                        body{
                            font-family:Arial,sans-serif;
                            padding:30px;
                            color:#111;
                        }

                        h1{
                            margin-bottom:25px;
                        }

                    </style>

                </head>

                <body>

                    <h1>
                        LUX — Ficha Administrativa
                    </h1>

                    ${conteudo}

                </body>

                </html>
            `);


            janela.document.close();

            janela.focus();

            setTimeout(
                function () {

                    janela.print();

                },
                400
            );

        };


    /* =========================================================
       MÓDULOS ADMINISTRATIVOS
       ========================================================= */

    window.abrirModuloAdmin =
        async function (
            titulo,
            texto
        ) {

            const chave =
                titulo
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(
                        /[\u0300-\u036f]/g,
                        ""
                    );


            if (
                chave.includes(
                    "avaliacoes"
                )
            ) {

                await abrirAvaliacoes();

                return;

            }


            if (
                chave.includes(
                    "reclamacoes"
                )
            ) {

                await abrirReclamacoes();

                return;

            }


            if (
                chave.includes(
                    "assinaturas"
                )
            ) {

                await abrirAssinaturas();

                return;

            }


            if (
                chave.includes(
                    "planos"
                )
            ) {

                await abrirPlanos();

                return;

            }


            if (
                chave.includes(
                    "doacoes"
                )
            ) {

                await abrirDoacoes();

                return;

            }


            abrirModalInformativo(
                titulo,
                texto
            );

        };


    /* =========================================================
       AVALIAÇÕES
       ========================================================= */

    async function abrirAvaliacoes() {

        const resposta =
            await window.luxSupabase
            .from(
                "avaliacoes_modelos_admin"
            )
            .select("*")
            .order(
                "criado_em",
                {
                    ascending:false
                }
            );


        if (resposta.error) {

            abrirModalInformativo(
                "AVALIAÇÕES",
                resposta.error.message
            );

            return;

        }


        const dados =
            resposta.data || [];


        let html = `

            <div style="
                max-height:65vh;
                overflow:auto;
            ">

        `;


        if (!dados.length) {

            html += `
                <div style="
                    padding:30px;
                    text-align:center;
                    color:#888;
                ">
                    Nenhuma avaliação cadastrada.
                </div>
            `;

        } else {

            dados.forEach(
                function (item) {

                    const nota =
                        Number(
                            item.estrelas ??
                            item.nota ??
                            0
                        ) || 0;


                    const notaLimitada =
                        Math.max(
                            0,
                            Math.min(
                                5,
                                nota
                            )
                        );


                    const estrelas =
                        "★".repeat(
                            notaLimitada
                        ) +
                        "☆".repeat(
                            5 - notaLimitada
                        );


                    html += `

                        <div style="
                            margin-bottom:10px;
                            padding:15px;
                            border:1px solid rgba(255,255,255,.07);
                            border-radius:12px;
                        ">

                            <div style="
                                color:#f5d58c;
                                font-size:20px;
                                letter-spacing:2px;
                            ">
                                ${estrelas}
                            </div>

                            <div style="
                                margin-top:8px;
                                color:#ddd;
                                line-height:1.6;
                            ">
                                ${escapeHTML(
                                    item.comentario ||
                                    "Sem comentário."
                                )}
                            </div>

                            <div style="
                                margin-top:8px;
                                color:#777;
                                font-size:10px;
                            ">
                                ${formatarData(
                                    item.criado_em
                                )}
                            </div>

                        </div>

                    `;

                }
            );

        }


        html += `
            </div>
        `;


        abrirModalHTML(
            "AVALIAÇÕES",
            html
        );

    }


    /* =========================================================
       RECLAMAÇÕES
       ========================================================= */

    async function abrirReclamacoes() {

        const resposta =
            await window.luxSupabase
            .from(
                "reclamacoes_admin"
            )
            .select("*")
            .order(
                "criado_em",
                {
                    ascending:false
                }
            );


        if (resposta.error) {

            abrirModalInformativo(
                "RECLAMAÇÕES",
                resposta.error.message
            );

            return;

        }


        const dados =
            resposta.data || [];


        let html = `

            <div style="
                max-height:65vh;
                overflow:auto;
            ">

        `;


        if (!dados.length) {

            html += `
                <div style="
                    padding:30px;
                    text-align:center;
                    color:#888;
                ">
                    Nenhuma reclamação cadastrada.
                </div>
            `;

        } else {

            dados.forEach(
                function (item) {

                    html += `

                        <div style="
                            margin-bottom:12px;
                            padding:16px;
                            border:1px solid rgba(255,255,255,.07);
                            border-radius:12px;
                        ">

                            <strong style="
                                color:#f5d58c;
                            ">
                                ${escapeHTML(
                                    item.assunto ||
                                    "Sem assunto"
                                )}
                            </strong>

                            <p style="
                                margin-top:9px;
                                color:#bbb;
                                line-height:1.6;
                            ">
                                ${escapeHTML(
                                    item.mensagem ||
                                    ""
                                )}
                            </p>

                            <p style="
                                margin-top:8px;
                                color:#777;
                                font-size:10px;
                            ">
                                ${escapeHTML(
                                    item.email ||
                                    "E-mail não informado"
                                )}
                            </p>

                            <p style="
                                margin-top:5px;
                                color:#999;
                                font-size:10px;
                            ">
                                Status:
                                ${escapeHTML(
                                    item.status ||
                                    "aberta"
                                )}
                            </p>

                        </div>

                    `;

                }
            );

        }


        html += `
            </div>
        `;


        abrirModalHTML(
            "RECLAMAÇÕES",
            html
        );

    }


    /* =========================================================
       ASSINATURAS REAIS
       ========================================================= */

    async function abrirAssinaturas() {

        const resposta =
            await window.luxSupabase
            .from(
                "assinaturas_admin"
            )
            .select("*")
            .order(
                "criado_em",
                {
                    ascending:false
                }
            );


        if (resposta.error) {

            abrirModalInformativo(
                "ASSINATURAS",
                resposta.error.message
            );

            return;

        }


        const dados =
            resposta.data || [];


        const dadosComModelos =
            await relacionarModelosAssinaturas(
                dados
            );


        let html = `

            <div style="
                max-height:70vh;
                overflow:auto;
            ">

        `;


        if (!dadosComModelos.length) {

            html += `
                <div style="
                    padding:30px;
                    text-align:center;
                    color:#888;
                ">
                    Nenhuma assinatura cadastrada.
                </div>
            `;

        } else {

            dadosComModelos.forEach(
                function (item) {

                    const plano =
                        obterPlanoNome(
                            item
                        );


                    const modelo =
                        obterNomeModelo(
                            item
                        );


                    const valor =
                        obterValor(
                            item
                        );


                    const status =
                        item.status ||
                        "pendente";


                    html += `

                        <div style="
                            margin-bottom:12px;
                            padding:17px;
                            border:1px solid rgba(245,213,140,.13);
                            border-radius:14px;
                            background:rgba(255,255,255,.015);
                        ">

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:10px;
                                flex-wrap:wrap;
                            ">

                                <strong style="
                                    color:#f5d58c;
                                    font-size:15px;
                                ">
                                    ${escapeHTML(
                                        modelo
                                    )}
                                </strong>

                                <span style="
                                    color:#fff;
                                    font-weight:700;
                                ">
                                    ${escapeHTML(
                                        plano
                                    )}
                                </span>

                            </div>


                            <div style="
                                margin-top:10px;
                                color:#bbb;
                            ">
                                Valor:
                                <strong style="
                                    color:#fff;
                                ">
                                    R$ ${valor}
                                </strong>
                            </div>


                            <div style="
                                margin-top:7px;
                                color:#999;
                            ">
                                Status:
                                <strong style="
                                    color:#f5d58c;
                                ">
                                    ${escapeHTML(
                                        formatarStatusAssinatura(
                                            status
                                        )
                                    )}
                                </strong>
                            </div>


                            <div style="
                                margin-top:7px;
                                color:#777;
                                font-size:10px;
                            ">
                                ${formatarData(
                                    item.criado_em
                                )}
                            </div>

                        </div>

                    `;

                }
            );

        }


        html += `
            </div>
        `;


        abrirModalHTML(
            "ASSINATURAS — MODELOS COM PLANOS",
            html
        );

    }


    /* =========================================================
       RELACIONAR ASSINATURAS COM MODELOS
       ========================================================= */

    async function relacionarModelosAssinaturas(
        assinaturas
    ) {

        if (!assinaturas.length) {
            return [];
        }


        let modelos = [];


        try {

            const resposta =
                await window.luxSupabase
                .from(
                    "pre_cadastros_modelos"
                )
                .select("*");


            if (!resposta.error) {

                modelos =
                    resposta.data || [];

            }

        } catch (erro) {

            console.warn(
                "Não foi possível consultar pré-cadastros:",
                erro
            );

        }


        return assinaturas.map(
            function (assinatura) {

                const modeloId =
                    assinatura.modelo_id ||
                    assinatura.modelo_user_id ||
                    assinatura.user_id ||
                    assinatura.usuario_id;


                const modelo =
                    modelos.find(
                        function (item) {

                            return String(item.id) ===
                                String(modeloId);

                        }
                    );


                if (
                    modelo &&
                    !assinatura.nome_modelo
                ) {

                    assinatura.nome_modelo =
                        modelo.nome ||
                        modelo.nickname ||
                        "Modelo";

                    assinatura.nickname_modelo =
                        modelo.nickname ||
                        "";

                }


                return assinatura;

            }
        );

    }


    /* =========================================================
       PLANOS
       MOSTRA QUEM COMPROU CADA PLANO
       ========================================================= */

    async function abrirPlanos() {

        const resposta =
            await window.luxSupabase
            .from(
                "assinaturas_admin"
            )
            .select("*")
            .order(
                "criado_em",
                {
                    ascending:false
                }
            );


        if (resposta.error) {

            abrirModalInformativo(
                "PLANOS",
                resposta.error.message
            );

            return;

        }


        const assinaturas =
            resposta.data || [];


        const dados =
            await relacionarModelosAssinaturas(
                assinaturas
            );


        const planos =
            [
                {
                    codigo:"LUX-ESSENCE",
                    nome:"LUX-ESSENCE",
                    valor:"GRATUITO",
                    descricao:"Sua presença começa aqui."
                },
                {
                    codigo:"LUX-DESFIRE",
                    nome:"LUX-DESFIRE",
                    valor:"R$ 29,90/mês",
                    descricao:"Perfil verificado e recursos ampliados."
                },
                {
                    codigo:"LUX-ELITE",
                    nome:"LUX-ELITE",
                    valor:"R$ 59,90/mês",
                    descricao:"Recursos avançados e suporte."
                },
                {
                    codigo:"LUX-ROYAL",
                    nome:"LUX-ROYAL",
                    valor:"R$ 99,90/mês",
                    descricao:"Exclusividade e destaque."
                },
                {
                    codigo:"LUX-DIAMOND",
                    nome:"LUX-DIAMOND",
                    valor:"R$ 149,90/mês",
                    descricao:"Plano Diamond — nível máximo de exclusividade."
                }
            ];


        let html = `

            <div style="
                max-height:70vh;
                overflow:auto;
            ">

        `;


        planos.forEach(
            function (planoAtual) {

                const codigoNormalizado =
                    normalizarPlano(
                        planoAtual.codigo
                    );


                const clientes =
                    dados.filter(
                        function (assinatura) {

                            return (
                                normalizarPlano(
                                    assinatura.plano_codigo ||
                                    assinatura.plano ||
                                    assinatura.plano_nome ||
                                    assinatura.nome_plano
                                ) ===
                                codigoNormalizado
                            );

                        }
                    );


                html += `

                    <section style="
                        margin-bottom:18px;
                        padding:18px;
                        border:1px solid rgba(245,213,140,.14);
                        border-radius:15px;
                    ">

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            gap:10px;
                            flex-wrap:wrap;
                            align-items:center;
                        ">

                            <strong style="
                                color:#f5d58c;
                                font-size:16px;
                            ">
                                ${escapeHTML(
                                    planoAtual.nome
                                )}
                            </strong>

                            <span style="
                                color:#fff;
                                font-weight:700;
                            ">
                                ${escapeHTML(
                                    planoAtual.valor
                                )}
                            </span>

                        </div>


                        <div style="
                            margin-top:6px;
                            color:#888;
                            font-size:11px;
                        ">
                            ${escapeHTML(
                                planoAtual.descricao
                            )}
                        </div>


                        <div style="
                            margin-top:14px;
                        ">

                `;


                if (!clientes.length) {

                    html += `

                        <div style="
                            padding:12px;
                            border-radius:9px;
                            background:rgba(255,255,255,.025);
                            color:#777;
                            font-size:11px;
                        ">
                            Nenhuma modelo com este plano.
                        </div>

                    `;

                } else {

                    clientes.forEach(
                        function (assinatura) {

                            const modelo =
                                obterNomeModelo(
                                    assinatura
                                );


                            const status =
                                assinatura.status ||
                                "pendente";


                            html += `

                                <div style="
                                    margin-top:8px;
                                    padding:13px;
                                    border-radius:10px;
                                    background:rgba(255,255,255,.025);
                                    border:1px solid rgba(255,255,255,.05);
                                ">

                                    <div style="
                                        color:#eee;
                                        font-weight:700;
                                    ">
                                        ${escapeHTML(
                                            modelo
                                        )}
                                    </div>


                                    <div style="
                                        margin-top:5px;
                                        color:#999;
                                        font-size:10px;
                                    ">
                                        Status:
                                        ${escapeHTML(
                                            formatarStatusAssinatura(
                                                status
                                            )
                                        )}
                                    </div>


                                    <div style="
                                        margin-top:4px;
                                        color:#777;
                                        font-size:10px;
                                    ">
                                        ${formatarData(
                                            assinatura.criado_em
                                        )}
                                    </div>

                                </div>

                            `;

                        }
                    );

                }


                html += `

                        </div>

                    </section>

                `;

            }
        );


        html += `
            </div>
        `;


        abrirModalHTML(
            "PLANOS — MODELOS CADASTRADAS",
            html
        );

    }


    /* =========================================================
       DOAÇÕES REAIS DO SUPABASE
       ========================================================= */

    async function abrirDoacoes() {

        const resposta =
            await window.luxSupabase
            .from(
                "doacoes"
            )
            .select("*")
            .order(
                "criado_em",
                {
                    ascending:false
                }
            );


        if (resposta.error) {

            console.error(
                "Erro ao carregar doações:",
                resposta.error
            );


            abrirModalInformativo(
                "DOAÇÕES",
                "Não foi possível carregar as doações do Supabase.\n\n" +
                resposta.error.message
            );

            return;

        }


        const todas =
            resposta.data || [];


        /*
         * Mostramos apenas pagamentos confirmados.
         */

        const confirmadas =
            todas.filter(
                function (item) {

                    return doacaoConfirmada(
                        item
                    );

                }
            );


        let total =
            0;


        confirmadas.forEach(
            function (item) {

                total +=
                    obterValorNumerico(
                        item.valor ??
                        item.valor_doacao ??
                        item.quantia ??
                        item.amount ??
                        0
                    );

            }
        );


        let html = `

            <div style="
                max-height:70vh;
                overflow:auto;
            ">

                <div style="
                    display:grid;
                    grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
                    gap:10px;
                    margin-bottom:16px;
                ">

                    <div style="
                        padding:16px;
                        border:1px solid rgba(245,213,140,.13);
                        border-radius:12px;
                    ">

                        <div style="
                            color:#888;
                            font-size:10px;
                            text-transform:uppercase;
                            letter-spacing:1px;
                        ">
                            Confirmadas
                        </div>

                        <strong style="
                            display:block;
                            margin-top:6px;
                            color:#f5d58c;
                            font-size:22px;
                        ">
                            ${confirmadas.length}
                        </strong>

                    </div>


                    <div style="
                        padding:16px;
                        border:1px solid rgba(245,213,140,.13);
                        border-radius:12px;
                    ">

                        <div style="
                            color:#888;
                            font-size:10px;
                            text-transform:uppercase;
                            letter-spacing:1px;
                        ">
                            Total confirmado
                        </div>

                        <strong style="
                            display:block;
                            margin-top:6px;
                            color:#fff;
                            font-size:20px;
                        ">
                            R$ ${formatarMoeda(total)}
                        </strong>

                    </div>

                </div>

        `;


        if (!confirmadas.length) {

            html += `

                <div style="
                    padding:30px;
                    text-align:center;
                    color:#888;
                ">
                    Nenhuma doação confirmada encontrada.
                </div>

            `;

        } else {

            confirmadas.forEach(
                function (item) {

                    const valor =
                        obterValorNumerico(
                            item.valor ??
                            item.valor_doacao ??
                            item.quantia ??
                            item.amount ??
                            0
                        );


                    const nome =
                        item.nome ||
                        item.nome_doador ||
                        item.doador_nome ||
                        item.usuario_nome ||
                        item.email ||
                        "Doador não identificado";


                    const email =
                        item.email ||
                        item.doador_email ||
                        item.usuario_email ||
                        "";


                    const idPagamento =
                        item.pagamento_id ||
                        item.payment_id ||
                        item.mp_payment_id ||
                        item.id_transacao ||
                        item.transacao_id ||
                        "";


                    html += `

                        <div style="
                            margin-bottom:12px;
                            padding:16px;
                            border:1px solid rgba(255,255,255,.07);
                            border-radius:12px;
                            background:rgba(255,255,255,.015);
                        ">

                            <div style="
                                display:flex;
                                justify-content:space-between;
                                gap:10px;
                                flex-wrap:wrap;
                            ">

                                <strong style="
                                    color:#f5d58c;
                                ">
                                    ${escapeHTML(
                                        nome
                                    )}
                                </strong>

                                <strong style="
                                    color:#fff;
                                ">
                                    R$ ${formatarMoeda(valor)}
                                </strong>

                            </div>


                            ${
                                email
                                    ? `
                                        <div style="
                                            margin-top:7px;
                                            color:#999;
                                            font-size:10px;
                                        ">
                                            ${escapeHTML(email)}
                                        </div>
                                      `
                                    : ""
                            }


                            ${
                                idPagamento
                                    ? `
                                        <div style="
                                            margin-top:7px;
                                            color:#777;
                                            font-size:10px;
                                            word-break:break-all;
                                        ">
                                            Pagamento:
                                            ${escapeHTML(
                                                idPagamento
                                            )}
                                        </div>
                                      `
                                    : ""
                            }


                            <div style="
                                margin-top:7px;
                                color:#777;
                                font-size:10px;
                            ">
                                Confirmada em:
                                ${formatarData(
                                    item.confirmado_em ||
                                    item.updated_at ||
                                    item.atualizado_em ||
                                    item.criado_em
                                )}
                            </div>

                        </div>

                    `;

                }
            );

        }


        html += `
            </div>
        `;


        abrirModalHTML(
            "DOAÇÕES — PAGAMENTOS CONFIRMADOS",
            html
        );

    }


    /* =========================================================
       IDENTIFICAR DOAÇÃO CONFIRMADA
       ========================================================= */

    function doacaoConfirmada(
        item
    ) {

        const status =
            String(
                item.status ||
                item.situacao ||
                item.estado ||
                item.payment_status ||
                item.status_pagamento ||
                ""
            )
            .trim()
            .toLowerCase();


        return (
            status === "confirmado" ||
            status === "confirmada" ||
            status === "approved" ||
            status === "aprovado" ||
            status === "paid" ||
            status === "pago" ||
            status === "completed" ||
            status === "completo"
        );

    }


    /* =========================================================
       OBTER NOME DA MODELO
       ========================================================= */

    function obterNomeModelo(
        item
    ) {

        return (
            item.nome_modelo ||
            item.modelo_nome ||
            item.nome ||
            item.nickname_modelo ||
            item.nickname ||
            "Modelo não identificada"
        );

    }


    /* =========================================================
       OBTER PLANO
       ========================================================= */

    function obterPlanoNome(
        item
    ) {

        return (
            item.plano_nome ||
            item.plano ||
            item.nome_plano ||
            item.plano_codigo ||
            "Plano não informado"
        );

    }


    /* =========================================================
       OBTER VALOR
       ========================================================= */

    function obterValor(
        item
    ) {

        const numero =
            obterValorNumerico(
                item.valor ??
                item.valor_mensal ??
                item.preco ??
                0
            );


        return formatarMoeda(
            numero
        );

    }


    function obterValorNumerico(
        valor
    ) {

        if (
            typeof valor ===
            "number"
        ) {

            return valor;

        }


        const texto =
            String(
                valor ||
                "0"
            )
            .replace(
                /R\$/gi,
                ""
            )
            .trim();


        /*
         * Trata valores brasileiros:
         * 29,90
         */

        if (
            texto.includes(",")
        ) {

            return (
                Number(
                    texto
                        .replace(
                            /\./g,
                            ""
                        )
                        .replace(
                            ",",
                            "."
                        )
                ) || 0
            );

        }


        return (
            Number(texto) ||
            0
        );

    }


    function formatarMoeda(
        valor
    ) {

        return Number(
            valor || 0
        ).toLocaleString(
            "pt-BR",
            {
                minimumFractionDigits:2,
                maximumFractionDigits:2
            }
        );

    }


    /* =========================================================
       NORMALIZAR PLANO
       ========================================================= */

    function normalizarPlano(
        plano
    ) {

        return String(
            plano ||
            ""
        )
        .trim()
        .toUpperCase()
        .replace(
            /_/g,
            "-"
        )
        .replace(
            /\s+/g,
            "-"
        );

    }


    /* =========================================================
       STATUS DA ASSINATURA
       ========================================================= */

    function formatarStatusAssinatura(
        status
    ) {

        const valor =
            String(
                status ||
                ""
            )
            .trim()
            .toLowerCase();


        if (
            valor === "ativo" ||
            valor === "active" ||
            valor === "approved" ||
            valor === "aprovado"
        ) {

            return "Ativa";

        }


        if (
            valor === "cancelado" ||
            valor === "cancelada" ||
            valor === "cancelled" ||
            valor === "canceled"
        ) {

            return "Cancelada";

        }


        if (
            valor === "paid" ||
            valor === "pago" ||
            valor === "confirmado"
        ) {

            return "Confirmada";

        }


        return status ||
            "Pendente";

    }


    /* =========================================================
       MODAL GENÉRICO
       ========================================================= */

    function abrirModalHTML(
        titulo,
        conteudo
    ) {

        fecharModalGenerico();


        const modal =
            document.createElement(
                "div"
            );


        modal.id =
            "modal-admin-generico";


        modal.style.cssText = `
            position:fixed;
            inset:0;
            z-index:999999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:15px;
            background:rgba(0,0,0,.88);
            backdrop-filter:blur(12px);
        `;


        modal.innerHTML = `

            <div style="
                width:min(850px,100%);
                max-height:90vh;
                overflow:auto;
                border:1px solid rgba(245,213,140,.18);
                border-radius:20px;
                background:linear-gradient(145deg,#130b10,#090609);
                box-shadow:0 35px 120px rgba(0,0,0,.7);
            ">

                <div style="
                    position:sticky;
                    top:0;
                    z-index:2;
                    padding:18px 20px;
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    border-bottom:1px solid rgba(255,255,255,.07);
                    background:rgba(13,8,12,.98);
                ">

                    <strong style="
                        color:#f5d58c;
                        font-family:'Playfair Display',serif;
                        font-size:21px;
                    ">
                        ${escapeHTML(titulo)}
                    </strong>

                    <button
                        type="button"
                        data-fechar-modal
                        style="
                            width:36px;
                            height:36px;
                            border:1px solid rgba(255,255,255,.08);
                            border-radius:50%;
                            background:transparent;
                            color:#ddd;
                            font-size:20px;
                            cursor:pointer;
                        "
                    >
                        ×
                    </button>

                </div>

                <div style="
                    padding:20px;
                ">
                    ${conteudo}
                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        const fechar =
            modal.querySelector(
                "[data-fechar-modal]"
            );


        if (fechar) {

            fechar.addEventListener(
                "click",
                fecharModalGenerico
            );

        }


        modal.addEventListener(
            "click",
            function (evento) {

                if (
                    evento.target ===
                    modal
                ) {

                    fecharModalGenerico();

                }

            }
        );

    }


    function abrirModalInformativo(
        titulo,
        texto
    ) {

        abrirModalHTML(
            titulo,
            `
                <div style="
                    padding:20px 5px;
                    color:#aaa;
                    line-height:1.8;
                    white-space:pre-line;
                ">
                    ${escapeHTML(texto)}
                </div>
            `
        );

    }


    function fecharModalGenerico() {

        const modal =
            document.getElementById(
                "modal-admin-generico"
            );


        if (modal) {

            modal.remove();

        }

    }


    /* =========================================================
       UTILITÁRIOS
       ========================================================= */

    function normalizarStatus(
        status
    ) {

        const valor =
            String(
                status ||
                "pendente"
            )
            .trim()
            .toLowerCase();


        if (
            valor === "aprovado" ||
            valor === "aprovada" ||
            valor === "approved"
        ) {

            return "aprovado";

        }


        if (
            valor === "rejeitado" ||
            valor === "rejeitada" ||
            valor === "recusado" ||
            valor === "rejected"
        ) {

            return "rejeitado";

        }


        return "pendente";

    }


    function formatarStatus(
        status
    ) {

        if (
            status === "aprovado"
        ) {

            return "Aprovado";

        }


        if (
            status === "rejeitado"
        ) {

            return "Rejeitado";

        }


        return "Pendente";

    }


    function formatarData(
        data
    ) {

        if (!data) {

            return "Não informado";

        }


        const dataObj =
            new Date(data);


        if (
            Number.isNaN(
                dataObj.getTime()
            )
        ) {

            return String(data);

        }


        return dataObj.toLocaleString(
            "pt-BR"
        );

    }


    function definirTexto(
        id,
        valor
    ) {

        const elemento =
            document.getElementById(
                id
            );


        if (elemento) {

            elemento.textContent =
                String(valor);

        }

    }


    function mostrarErro(
        mensagem
    ) {

        const lista =
            document.getElementById(
                "lista-precadastros"
            );


        if (!lista) {
            return;
        }


        lista.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:40px 20px;
                text-align:center;
                color:#ff718d;
            ">
                ${escapeHTML(mensagem)}
            </div>
        `;

    }


    function escapeHTML(
        valor
    ) {

        return String(
            valor === null ||
            valor === undefined
                ? ""
                : valor
        )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

    }


})();
