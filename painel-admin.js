/* ============================================================
   LUX-ADVANCE
   PAINEL ADMINISTRATIVO
   MOTOR FUNCIONAL
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

            const resposta =
                await window.luxSupabase
                .from(
                    "pre_cadastros_modelos"
                )
                .update({
                    status:novoStatus,
                    atualizado_em:
                        new Date().toISOString()
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
                        atualizado_em:
                            new Date().toISOString()
                    };

            }


            fecharModalFicha();

            renderizarModelos();

            atualizarDashboard();


            alert(
                novoStatus === "aprovado"
                    ? "Cadastro aprovado com sucesso."
                    : "Cadastro rejeitado com sucesso."
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

                abrirPlanos();

                return;

            }


            if (
                chave.includes(
                    "doacoes"
                )
            ) {

                abrirDoacoes();

                return;

            }


            abrirModalInformativo(
                titulo,
                texto
            );

        };


    /* =========================================================
       AVALIAÇÕES
       USA "nota" NO BANCO
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
                            item.estrelas
                        ) || 0;


                    const estrelas =
                        "★".repeat(
                            Math.max(
                                0,
                                Math.min(
                                    5,
                                    nota
                                )
                            )
                        ) +
                        "☆".repeat(
                            5 -
                            Math.max(
                                0,
                                Math.min(
                                    5,
                                    nota
                                )
                            )
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
       ASSINATURAS
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
                    Nenhuma assinatura cadastrada.
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
                                    item.plano ||
                                    "Plano não informado"
                                )}
                            </strong>

                            <p style="
                                margin-top:8px;
                                color:#bbb;
                            ">
                                Valor:
                                R$ ${
                                    Number(
                                        item.valor || 0
                                    ).toFixed(2)
                                }
                            </p>

                            <p style="
                                margin-top:5px;
                                color:#999;
                            ">
                                Status:
                                ${escapeHTML(
                                    item.status ||
                                    "pendente"
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
            "ASSINATURAS",
            html
        );

    }


    /* =========================================================
       PLANOS
       ========================================================= */

    function abrirPlanos() {

        abrirModalHTML(
            "PLANOS LUX",
            `

            <div style="
                display:grid;
                gap:10px;
            ">

                ${plano(
                    "LUX-ESSENCE",
                    "FREE",
                    "Sua presença começa aqui."
                )}

                ${plano(
                    "LUX-DESFIRE",
                    "R$ 29,90/mês",
                    "Perfil verificado e recursos ampliados."
                )}

                ${plano(
                    "LUX-ELITE",
                    "R$ 59,90/mês",
                    "Recursos avançados e suporte."
                )}

                ${plano(
                    "LUX-ROYAL",
                    "R$ 99,90/mês",
                    "Exclusividade e destaque."
                )}

            </div>

            `
        );

    }


    function plano(
        nome,
        valor,
        descricao
    ) {

        return `

            <div style="
                padding:17px;
                border:1px solid rgba(245,213,140,.13);
                border-radius:12px;
            ">

                <strong style="
                    color:#f5d58c;
                ">
                    ${nome}
                </strong>

                <div style="
                    margin-top:5px;
                    color:#fff;
                ">
                    ${valor}
                </div>

                <div style="
                    margin-top:7px;
                    color:#888;
                    font-size:11px;
                ">
                    ${descricao}
                </div>

            </div>

        `;

    }


    /* =========================================================
       DOAÇÕES
       ========================================================= */

    function abrirDoacoes() {

        abrirModalInformativo(
            "DOAÇÕES",
            "O módulo de doações está preparado para receber os registros de pagamentos quando a tabela de doações for integrada ao Supabase."
        );

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
