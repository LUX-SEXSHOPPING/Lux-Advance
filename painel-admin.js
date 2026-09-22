// =============================================================
// LUX-ADVANCE — PAINEL ADMINISTRATIVO
// V6 — MOTOR ADMINISTRATIVO LIMPO E FUNCIONAL
// =============================================================

let listaPreCadastros = [];
let listaUsuariosAdmin = [];
let listaReclamacoesAdmin = [];
let listaPagamentosAdmin = [];
let filtroStatus = "todos";
let indiceSelecionado = null;

// =============================================================
// SUPABASE
// =============================================================

function obterSupabase() {

    if (
        window.luxSupabase &&
        typeof window.luxSupabase.from === "function"
    ) {
        return window.luxSupabase;
    }

    if (
        window.supabaseClient &&
        typeof window.supabaseClient.from === "function"
    ) {
        return window.supabaseClient;
    }

    if (
        window.supabase &&
        typeof window.supabase.from === "function"
    ) {
        return window.supabase;
    }
   
 return null;
}
  
// =============================================================
// UTILITÁRIOS
// =============================================================

function escaparHTML(valor) {
    if (valor === null || valor === undefined) return "";

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

function formatarData(valor) {
    if (!valor) return "Não informado";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return String(valor);
    }

    return data.toLocaleDateString("pt-BR");
}

function formatarDataHora(valor) {
    if (!valor) return "Não informado";

    const data = new Date(valor);

    if (Number.isNaN(data.getTime())) {
        return String(valor);
    }

    return data.toLocaleString("pt-BR");
}

function formatarMoedaAdmin(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "R$ 0,00";
    }

    return numero.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function atualizarElemento(ids, valor) {
    const lista = Array.isArray(ids) ? ids : [ids];

    lista.forEach(id => {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    });
}

function normalizarStatus(status) {
    const valor = String(
        status || "pendente"
    ).toLowerCase().trim();

    if (valor === "rejeitado") {
        return "reprovado";
    }

    if (valor === "verificada") {
        return "aprovado";
    }

    return valor || "pendente";
}

function textoCategoria(categoria) {
    const valor = String(
        categoria || ""
    ).toLowerCase().trim();

    if (valor === "feminino") {
        return "Feminino";
    }

    if (valor === "masculino") {
        return "Masculino";
    }

    if (
        valor === "lgbtq" ||
        valor === "lgbtq+"
    ) {
        return "LGBTQ+";
    }

    return categoria
        ? String(categoria)
        : "Não informada";
}

function textoStatus(status) {
    const mapa = {
        pendente: "PENDENTE",
        aprovado: "APROVADO",
        reprovado: "REPROVADO",
        verificada: "VERIFICADA",
        bloqueado: "BLOQUEADO"
    };

    const normalizado = normalizarStatus(status);

    return mapa[normalizado] ||
        String(
            status || "PENDENTE"
        ).toUpperCase();
}

function classeStatus(status) {
    return "status-" +
        normalizarStatus(status)
            .replace(/[^a-z0-9_-]/g, "");
}

function mostrarMensagem(
    mensagem,
    tipo = "info"
) {
    let el =
        document.getElementById(
            "mensagemAdmin"
        );

    if (!el) {
        el = document.createElement("div");

        el.id = "mensagemAdmin";

        el.style.cssText = [
            "position:fixed",
            "left:15px",
            "right:15px",
            "bottom:18px",
            "z-index:100000",
            "padding:14px 16px",
            "border-radius:13px",
            "font-size:12px",
            "line-height:1.5",
            "box-shadow:0 15px 45px rgba(0,0,0,.45)",
            "border:1px solid rgba(245,213,140,.18)"
        ].join(";");

        document.body.appendChild(el);
    }

    el.textContent = mensagem;

    el.style.background =
        tipo === "error"
            ? "rgba(110,15,35,.96)"
            : tipo === "success"
                ? "rgba(15,75,45,.96)"
                : "rgba(18,10,15,.97)";

    el.style.color = "#fff";

    el.style.borderColor =
        tipo === "error"
            ? "rgba(255,100,130,.35)"
            : "rgba(245,213,140,.22)";

    clearTimeout(el._luxTimer);

    el._luxTimer = setTimeout(() => {
        if (el && el.parentNode) {
            el.remove();
        }
    }, 4500);
}

// =============================================================
// SESSÃO ADMINISTRATIVA
// =============================================================

async function verificarSessaoAdmin() {
    const supabase = obterSupabase();

    if (!supabase || !supabase.auth) {
        console.error(
            "Supabase não foi inicializado."
        );

        return false;
    }

    try {
        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error || !data?.user) {
            window.location.href =
                "acesso-admin.html";

            return false;
        }

        const emailUsuario =
            String(
                data.user.email || ""
            ).toLowerCase().trim();

        const emailAdmin =
            String(
                window.LUX_ADMIN_EMAIL || ""
            ).toLowerCase().trim();

        if (
            emailAdmin &&
            emailUsuario !== emailAdmin
        ) {
            await supabase.auth.signOut();

            window.location.href =
                "acesso-admin.html";

            return false;
        }

        return true;

    } catch (erro) {
        console.error(
            "Erro ao verificar sessão:",
            erro
        );

        return false;
    }
}

async function sairAdmin() {
    const supabase = obterSupabase();

    try {
        if (supabase?.auth) {
            await supabase.auth.signOut();
        }
    } catch (erro) {
        console.error(
            "Erro ao sair:",
            erro
        );
    }

    window.location.href =
        "acesso-admin.html";
}

// =============================================================
// MODELOS — SUPABASE
// =============================================================

async function carregarModelos() {
    const supabase = obterSupabase();

    const container =
        document.getElementById(
            "lista-precadastros"
        );

    if (!supabase) {
        mostrarErroModelos(
            "Supabase não foi inicializado. Verifique o config.js."
        );

        return [];
    }

    try {
        const {
            data,
            error
        } = await supabase
            .from("modelo_perfis")
            .select(`
                id,
                nome_exibicao,
                apelido,
                whatsapp,
                cpf,
                data_nascimento,
                idade,
                altura_cm,
                cep,
                estado,
                cidade,
                bairro,
                endereco,
                numero,
                complemento,
                pais,
                cor_cabelo,
                cor_olhos,
                idiomas,
                descricao,
                foto_url,
                galeria_urls,
                maioridade_confirmada,
                verificacao_status,
                estrelas_total,
                criado_em,
                atualizado_em,
                plano,
                categoria_catalogo
            `)
            .order(
                "criado_em",
                {
                    ascending: false
                }
            );

        if (error) {
            console.error(
                "Erro ao carregar modelos:",
                error
            );

            mostrarErroModelos(
                "O Supabase recusou a leitura dos modelos.",
                error
            );

            return [];
        }

        listaPreCadastros =
            Array.isArray(data)
                ? data.map(
                    normalizarModeloAdmin
                )
                : [];

        aplicarFiltroERenderizar();

        atualizarResumo();

        return listaPreCadastros;

    } catch (erro) {
        console.error(
            "Erro inesperado ao carregar modelos:",
            erro
        );

        mostrarErroModelos(
            "Não foi possível carregar os modelos.",
            erro
        );

        return [];
    }
}

function normalizarModeloAdmin(modelo) {
    const galeria =
        Array.isArray(
            modelo.galeria_urls
        )
            ? modelo.galeria_urls
            : [];

    const fotos = [];

    if (modelo.foto_url) {
        fotos.push(modelo.foto_url);
    }

    galeria.forEach(url => {
        if (
            url &&
            !fotos.includes(url)
        ) {
            fotos.push(url);
        }
    });

    const status =
        normalizarStatus(
            modelo.verificacao_status
        );

    return {
        ...modelo,

        nome:
            modelo.nome_exibicao,

        status,

        modelo_id:
            modelo.id,

        fotos,

        categoria_catalogo:
            modelo.categoria_catalogo || ""
    };
}

function mostrarErroModelos(
    titulo,
    erro
) {
    const container =
        document.getElementById(
            "lista-precadastros"
        );

    if (!container) return;

    const detalhe =
        erro?.message ||
        String(erro || "");

    container.innerHTML = `
        <div style="
            grid-column:1/-1;
            padding:28px 20px;
            border:1px solid rgba(255,77,166,.22);
            border-radius:16px;
            background:rgba(255,77,166,.035);
        ">

            <div style="
                color:#ff4da6;
                font-size:10px;
                font-weight:800;
                letter-spacing:1.5px;
                margin-bottom:9px;
            ">
                ERRO NA LEITURA DOS MODELOS
            </div>

            <div style="
                color:#ddd;
                font-size:13px;
                line-height:1.6;
            ">
                ${escaparHTML(titulo)}
            </div>

            <div style="
                margin-top:10px;
                color:#92858d;
                font-size:10px;
                line-height:1.6;
                word-break:break-word;
            ">
                ${escaparHTML(detalhe)}
            </div>

            <button
                type="button"
                onclick="carregarModelos()"
                style="
                    margin-top:16px;
                    padding:11px 15px;
                    border-radius:10px;
                    border:1px solid rgba(245,213,140,.22);
                    background:rgba(245,213,140,.05);
                    color:#f5d58c;
                    font-weight:800;
                    font-size:10px;
                "
            >
                ↻ TENTAR NOVAMENTE
            </button>

        </div>
    `;
}

// =============================================================
// FILTROS
// =============================================================

function ativarBotoesFiltro() {
    document
        .querySelectorAll(".btn-filtro")
        .forEach(botao => {

            botao.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".btn-filtro"
                        )
                        .forEach(item => {
                            item.classList.remove(
                                "ativo"
                            );
                        });

                    botao.classList.add(
                        "ativo"
                    );

                    filtroStatus =
                        botao.dataset.filtro ||
                        "todos";

                    aplicarFiltroERenderizar();
                }
            );
        });

    const select =
        document.getElementById(
            "filtroStatus"
        );

    if (select) {
        select.addEventListener(
            "change",
            evento => {

                filtroStatus =
                    evento.target.value ||
                    "todos";

                aplicarFiltroERenderizar();
            }
        );
    }

    const pesquisa =
        document.getElementById(
            "pesquisaModelos"
        ) ||
        document.getElementById(
            "buscarModelos"
        );

    if (pesquisa) {
        pesquisa.addEventListener(
            "input",
            () =>
                pesquisarModelos(
                    pesquisa.value
                )
        );
    }
}

function aplicarFiltroERenderizar() {
    let dados =
        [...listaPreCadastros];

    if (
        filtroStatus !==
        "todos"
    ) {
        dados =
            dados.filter(item =>
                normalizarStatus(
                    item.status ||
                    item.verificacao_status
                ) ===
                filtroStatus
            );
    }

    const pesquisa =
        document.getElementById(
            "pesquisaModelos"
        ) ||
        document.getElementById(
            "buscarModelos"
        );

    if (
        pesquisa?.value?.trim()
    ) {
        const termo =
            pesquisa.value
                .toLowerCase()
                .trim();

        dados =
            dados.filter(
                modelo => {

                    const texto = [
                        modelo.nome_exibicao,
                        modelo.apelido,
                        modelo.cidade,
                        modelo.estado,
                        modelo.whatsapp,
                        modelo.cpf,
                        modelo.categoria_catalogo
                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();

                    return texto.includes(
                        termo
                    );
                }
            );
    }

    desenharLista(dados);

    atualizarResumo();
}

function aplicarFiltroStatus(status) {
    filtroStatus =
        status || "todos";

    aplicarFiltroERenderizar();
}

function filtrarModelos(status) {
    aplicarFiltroStatus(status);
}

function pesquisarModelos(texto) {
    aplicarFiltroERenderizar();
}

// =============================================================
// LISTA VISUAL DE MODELOS
// =============================================================

function desenharLista(lista) {
    const container =
        document.getElementById(
            "lista-precadastros"
        ) ||
        document.getElementById(
            "listaModelos"
        ) ||
        document.getElementById(
            "listaPreCadastros"
        );

    if (!container) return;

    if (!lista.length) {

        container.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:45px 20px;
                border:1px dashed rgba(245,213,140,.15);
                border-radius:16px;
            ">

                <div style="
                    font-size:32px;
                    color:#f5d58c;
                    margin-bottom:10px;
                ">
                    ◇
                </div>

                <div style="
                    color:#aaa;
                    font-size:13px;
                ">
                    Nenhum modelo encontrado.
                </div>

                <div style="
                    color:#71666e;
                    font-size:10px;
                    margin-top:7px;
                ">
                    Verifique o filtro selecionado
                    ou atualize os dados.
                </div>

            </div>
        `;

        return;
    }

    container.innerHTML =
        lista.map(
            registro => {

                const indice =
                    listaPreCadastros.indexOf(
                        registro
                    );

                const status =
                    normalizarStatus(
                        registro.status ||
                        registro.verificacao_status
                    );

                const foto =
                    registro.foto_url ||
                    registro.fotos?.[0] ||
                    "./logo.png";

                return `
                    <article
                        class="card-registro"
                        style="
                            position:relative;
                            padding:16px;
                            border:1px solid rgba(245,213,140,.13);
                            border-radius:17px;
                            background:linear-gradient(
                                145deg,
                                rgba(255,255,255,.035),
                                rgba(0,0,0,.16)
                            );
                            box-shadow:
                                0 14px 35px
                                rgba(0,0,0,.18);
                        "
                    >

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            align-items:flex-start;
                            gap:10px;
                            margin-bottom:12px;
                        ">

                            <span style="
                                display:inline-flex;
                                padding:6px 9px;
                                border-radius:20px;
                                border:1px solid rgba(245,213,140,.15);
                                color:#f5d58c;
                                font-size:8px;
                                font-weight:800;
                                letter-spacing:1px;
                            ">
                                ${escaparHTML(
                                    textoCategoria(
                                        registro.categoria_catalogo
                                    )
                                )}
                            </span>

                            <span
                                class="${classeStatus(status)}"
                                style="
                                    display:inline-flex;
                                    padding:6px 9px;
                                    border-radius:20px;
                                    border:1px solid rgba(255,255,255,.12);
                                    font-size:8px;
                                    font-weight:800;
                                    letter-spacing:1px;
                                "
                            >
                                ${escaparHTML(
                                    textoStatus(
                                        status
                                    )
                                )}
                            </span>

                        </div>

                        <img
                            src="${escaparAtributo(
                                foto
                            )}"
                            alt="${escaparAtributo(
                                registro.nome_exibicao ||
                                "Modelo"
                            )}"
                            onerror="
                                this.src='./logo.png'
                            "
                            style="
                                width:100%;
                                height:190px;
                                object-fit:cover;
                                border-radius:13px;
                                display:block;
                                margin-bottom:13px;
                                border:1px solid rgba(245,213,140,.14);
                                background:#10080d;
                            "
                        >

                        <h3 style="
                            margin:0 0 7px;
                            color:#f5d58c;
                            font-family:'Playfair Display',serif;
                            font-size:20px;
                        ">
                            ${escaparHTML(
                                registro.nome_exibicao ||
                                "Sem nome"
                            )}
                        </h3>

                        <div style="
                            color:#9c9097;
                            font-size:10px;
                            line-height:1.8;
                        ">

                            <div>
                                Apelido:
                                ${escaparHTML(
                                    registro.apelido ||
                                    "—"
                                )}
                            </div>

                            <div>
                                Idade:
                                ${escaparHTML(
                                    registro.idade ??
                                    "—"
                                )}
                            </div>

                            <div>
                                WhatsApp:
                                ${escaparHTML(
                                    registro.whatsapp ||
                                    "—"
                                )}
                            </div>

                            <div>
                                Local:
                                ${escaparHTML(
                                    registro.cidade ||
                                    "—"
                                )}
                                ${
                                    registro.estado
                                        ? " / " +
                                          escaparHTML(
                                              registro.estado
                                          )
                                        : ""
                                }
                            </div>

                        </div>

                        <div style="
                            display:grid;
                            grid-template-columns:1fr;
                            gap:8px;
                            margin-top:15px;
                        ">

                            <button
                                type="button"
                                class="btn btn-secundario"
                                onclick="
                                    abrirVerFichaPorIndice(
                                        ${indice}
                                    )
                                "
                            >
                                VER FICHA COMPLETA
                            </button>

                            ${
                                status === "pendente"
                                    ? `
                                        <div style="
                                            display:grid;
                                            grid-template-columns:1fr 1fr;
                                            gap:8px;
                                        ">

                                            <button
                                                type="button"
                                                onclick="
                                                    aprovarModelo(
                                                        '${escaparAtributo(
                                                            registro.id
                                                        )}'
                                                    )
                                                "
                                                style="
                                                    border:1px solid rgba(143,240,176,.22);
                                                    background:rgba(143,240,176,.06);
                                                    color:#8ff0b0;
                                                    border-radius:10px;
                                                    padding:10px;
                                                    font-size:9px;
                                                    font-weight:800;
                                                "
                                            >
                                                ✓ APROVAR
                                            </button>

                                            <button
                                                type="button"
                                                onclick="
                                                    reprovarModelo(
                                                        '${escaparAtributo(
                                                            registro.id
                                                        )}'
                                                    )
                                                "
                                                style="
                                                    border:1px solid rgba(255,125,141,.22);
                                                    background:rgba(255,125,141,.05);
                                                    color:#ff9aaa;
                                                    border-radius:10px;
                                                    padding:10px;
                                                    font-size:9px;
                                                    font-weight:800;
                                                "
                                            >
                                                × REPROVAR
                                            </button>

                                        </div>
                                    `
                                    : ""
                            }

                        </div>

                    </article>
                `;
            }
        ).join("");
}

// =============================================================
// RESUMO
// =============================================================

function atualizarResumo() {

    const total =
        listaPreCadastros.length;

    const pendentes =
        listaPreCadastros.filter(
            item =>
                normalizarStatus(
                    item.status ||
                    item.verificacao_status
                ) === "pendente"
        ).length;

    const aprovados =
        listaPreCadastros.filter(
            item =>
                normalizarStatus(
                    item.status ||
                    item.verificacao_status
                ) === "aprovado"
        ).length;

    const reprovados =
        listaPreCadastros.filter(
            item =>
                normalizarStatus(
                    item.status ||
                    item.verificacao_status
                ) === "reprovado"
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
        reprovados
    );

    atualizarElemento(
        [
            "totalModelos",
            "contadorModelos"
        ],
        total
    );

    atualizarElemento(
        [
            "totalPendentes",
            "contadorPendentes",
            "modelosPendentes"
        ],
        pendentes
    );

    atualizarElemento(
        [
            "totalAprovados",
            "contadorAprovados",
            "modelosAprovados"
        ],
        aprovados
    );

    atualizarElemento(
        [
            "totalReprovados",
            "contadorReprovados",
            "modelosReprovados"
        ],
        reprovados
    );
}
// =============================================================
// FICHA COMPLETA DO MODELO
// =============================================================

function abrirVerFichaPorIndice(indice) {
    indiceSelecionado = indice;

    const modelo =
        listaPreCadastros[indice];

    if (!modelo) {
        mostrarMensagem(
            "Modelo não encontrado.",
            "error"
        );
        return;
    }

    abrirFichaModelo(modelo);
}

function abrirFichaModelo(modelo) {

    if (!modelo) {
        mostrarMensagem(
            "Não foi possível localizar a ficha.",
            "error"
        );
        return;
    }

    const modal =
        document.getElementById(
            "modal-ver-ficha"
        );

    const corpo =
        document.getElementById(
            "corpo-ficha"
        );

    if (!modal || !corpo) {

        mostrarMensagem(
            "O modal da ficha não foi encontrado no painel.",
            "error"
        );

        return;
    }

    indiceSelecionado =
        listaPreCadastros.indexOf(
            modelo
        );

    const fotos =
        Array.isArray(modelo.fotos)
            ? modelo.fotos
            : [];

    const status =
        normalizarStatus(
            modelo.status ||
            modelo.verificacao_status
        );

    const galeriaHTML =
        fotos.length
            ? `
                <div style="
                    display:grid;
                    grid-template-columns:
                        repeat(
                            auto-fit,
                            minmax(100px,1fr)
                        );
                    gap:10px;
                    margin-top:10px;
                ">
                    ${
                        fotos.map(
                            foto => `
                                <img
                                    src="${escaparAtributo(
                                        foto
                                    )}"
                                    alt="Foto do modelo"
                                    onerror="
                                        this.style.display='none'
                                    "
                                    style="
                                        width:100%;
                                        height:130px;
                                        object-fit:cover;
                                        border-radius:12px;
                                        border:1px solid
                                            rgba(
                                                245,
                                                213,
                                                140,
                                                .15
                                            );
                                        background:#10080d;
                                    "
                                >
                            `
                        ).join("")
                    }
                </div>
            `
            : `
                <div style="
                    color:#71666e;
                    font-size:10px;
                    padding:15px 0;
                ">
                    Nenhuma foto cadastrada.
                </div>
            `;

    corpo.innerHTML = `

        <div style="
            display:grid;
            gap:18px;
        ">

            <!-- CABEÇALHO -->

            <div style="
                padding-bottom:15px;
                border-bottom:
                    1px solid
                    rgba(
                        245,
                        213,
                        140,
                        .12
                    );
            ">

                <div style="
                    color:#f5d58c;
                    font-family:
                        'Playfair Display',
                        serif;
                    font-size:25px;
                    margin-bottom:6px;
                ">
                    ${escaparHTML(
                        modelo.nome_exibicao ||
                        "Sem nome"
                    )}
                </div>

                <div style="
                    color:#91858d;
                    font-size:10px;
                    line-height:1.8;
                ">
                    ID:
                    ${escaparHTML(
                        modelo.id ||
                        "Não informado"
                    )}
                </div>

                <div style="
                    margin-top:8px;
                ">
                    <span style="
                        display:inline-flex;
                        padding:7px 10px;
                        border-radius:20px;
                        border:
                            1px solid
                            rgba(
                                245,
                                213,
                                140,
                                .18
                            );
                        color:#f5d58c;
                        font-size:9px;
                        font-weight:800;
                        letter-spacing:1px;
                    ">
                        ${escaparHTML(
                            textoCategoria(
                                modelo.categoria_catalogo
                            )
                        )}
                    </span>

                    <span style="
                        display:inline-flex;
                        margin-left:6px;
                        padding:7px 10px;
                        border-radius:20px;
                        border:
                            1px solid
                            rgba(
                                255,
                                255,
                                255,
                                .12
                            );
                        color:#ddd;
                        font-size:9px;
                        font-weight:800;
                        letter-spacing:1px;
                    ">
                        ${escaparHTML(
                            textoStatus(status)
                        )}
                    </span>
                </div>

            </div>

            <!-- FOTOS -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:5px;
                ">
                    FOTOS
                </div>

                ${galeriaHTML}

            </div>

            <!-- DADOS PESSOAIS -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    DADOS PESSOAIS
                </div>

                ${campoFicha(
                    "Nome completo",
                    modelo.nome_exibicao
                )}

                ${campoFicha(
                    "Nome profissional / apelido",
                    modelo.apelido
                )}

                ${campoFicha(
                    "CPF",
                    modelo.cpf
                )}

                ${campoFicha(
                    "Data de nascimento",
                    modelo.data_nascimento
                        ? formatarData(
                            modelo.data_nascimento
                        )
                        : null
                )}

                ${campoFicha(
                    "Idade",
                    modelo.idade
                )}

                ${campoFicha(
                    "Maioridade confirmada",
                    modelo.maioridade_confirmada
                        ? "SIM"
                        : "NÃO"
                )}

            </div>

            <!-- CONTATO -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    CONTATO
                </div>

                ${campoFicha(
                    "WhatsApp",
                    modelo.whatsapp
                )}

                ${campoFicha(
                    "E-mail",
                    modelo.email
                )}

            </div>

            <!-- ENDEREÇO -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    ENDEREÇO
                </div>

                ${campoFicha(
                    "CEP",
                    modelo.cep
                )}

                ${campoFicha(
                    "Estado",
                    modelo.estado
                )}

                ${campoFicha(
                    "Cidade",
                    modelo.cidade
                )}

                ${campoFicha(
                    "Bairro",
                    modelo.bairro
                )}

                ${campoFicha(
                    "Endereço",
                    modelo.endereco
                )}

                ${campoFicha(
                    "Número",
                    modelo.numero
                )}

                ${campoFicha(
                    "Complemento",
                    modelo.complemento
                )}

                ${campoFicha(
                    "País",
                    modelo.pais
                )}

            </div>

            <!-- CARACTERÍSTICAS -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    CARACTERÍSTICAS
                </div>

                ${campoFicha(
                    "Altura",
                    modelo.altura_cm
                        ? modelo.altura_cm +
                          " cm"
                        : null
                )}

                ${campoFicha(
                    "Cor dos cabelos",
                    modelo.cor_cabelo
                )}

                ${campoFicha(
                    "Cor dos olhos",
                    modelo.cor_olhos
                )}

                ${campoFicha(
                    "Idiomas",
                    modelo.idiomas
                )}

            </div>

            <!-- PERFIL -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    DESCRIÇÃO
                </div>

                <div style="
                    padding:13px;
                    border-radius:12px;
                    background:
                        rgba(
                            255,
                            255,
                            255,
                            .025
                        );
                    border:
                        1px solid
                        rgba(
                            245,
                            213,
                            140,
                            .08
                        );
                    color:#b9afb5;
                    font-size:11px;
                    line-height:1.7;
                ">
                    ${escaparHTML(
                        modelo.descricao ||
                        "Nenhuma descrição informada."
                    )}
                </div>

            </div>

            <!-- PLANO -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    PLANO
                </div>

                ${campoFicha(
                    "Plano atual",
                    modelo.plano
                )}

                ${campoFicha(
                    "Estrelas",
                    modelo.estrelas_total ??
                    0
                )}

            </div>

            <!-- DATAS -->

            <div>

                <div style="
                    color:#f5d58c;
                    font-size:10px;
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    REGISTRO
                </div>

                ${campoFicha(
                    "Criado em",
                    formatarDataHora(
                        modelo.criado_em
                    )
                )}

                ${campoFicha(
                    "Atualizado em",
                    formatarDataHora(
                        modelo.atualizado_em
                    )
                )}

            </div>

        </div>
    `;

    modal.style.display = "flex";

    modal.classList.add(
        "ativo"
    );
}

function campoFicha(
    titulo,
    valor
) {
    let texto;

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {
        texto = "Não informado";
    } else {
        texto = String(valor);
    }

    return `
        <div style="
            display:grid;
            grid-template-columns:
                minmax(120px, .7fr)
                minmax(0, 1.3fr);
            gap:12px;
            padding:9px 0;
            border-bottom:
                1px solid
                rgba(
                    255,
                    255,
                    255,
                    .045
                );
        ">

            <div style="
                color:#786d74;
                font-size:9px;
                font-weight:700;
            ">
                ${escaparHTML(
                    titulo
                )}
            </div>

            <div style="
                color:#d9d2d6;
                font-size:10px;
                line-height:1.5;
                word-break:break-word;
            ">
                ${escaparHTML(
                    texto
                )}
            </div>

        </div>
    `;
}

function fecharFichaModelo() {

    const modal =
        document.getElementById(
            "modal-ver-ficha"
        );

    if (!modal) return;

    modal.style.display =
        "none";

    modal.classList.remove(
        "ativo"
    );

    indiceSelecionado =
        null;
}

function fecharModalFicha() {
    fecharFichaModelo();
}

// =============================================================
// APROVAR MODELO
// =============================================================

async function aprovarModelo(
    modeloId
) {
    const supabase =
        obterSupabase();

    if (!supabase) {
        mostrarMensagem(
            "Supabase não foi inicializado.",
            "error"
        );
        return;
    }

    if (!modeloId) {
        mostrarMensagem(
            "ID do modelo não informado.",
            "error"
        );
        return;
    }

    const confirmar =
        window.confirm(
            "Deseja realmente APROVAR este modelo?"
        );

    if (!confirmar) {
        return;
    }

    try {

        const {
            error
        } = await supabase
            .from("modelo_perfis")
            .update({
                verificacao_status:
                    "aprovado",
                atualizado_em:
                    new Date().toISOString()
            })
            .eq(
                "id",
                modeloId
            );

        if (error) {
            console.error(
                "Erro ao aprovar modelo:",
                error
            );

            mostrarMensagem(
                "Não foi possível aprovar o modelo: " +
                error.message,
                "error"
            );

            return;
        }

        try {

            await supabase
                .from("perfis")
                .update({
                    status: "ativo"
                })
                .eq(
                    "id",
                    modeloId
                );

        } catch (erroPerfil) {

            console.warn(
                "Não foi possível atualizar o perfil:",
                erroPerfil
            );

        }

        const modelo =
            listaPreCadastros.find(
                item =>
                    item.id === modeloId
            );

        if (modelo) {
            modelo.status =
                "aprovado";

            modelo.verificacao_status =
                "aprovado";
        }

        aplicarFiltroERenderizar();

        fecharFichaModelo();

        mostrarMensagem(
            "Modelo aprovado com sucesso.",
            "success"
        );

    } catch (erro) {

        console.error(
            "Erro inesperado ao aprovar:",
            erro
        );

        mostrarMensagem(
            "Erro inesperado ao aprovar o modelo.",
            "error"
        );
    }
}

// =============================================================
// REPROVAR MODELO
// =============================================================

async function reprovarModelo(
    modeloId
) {
    const supabase =
        obterSupabase();

    if (!supabase) {
        mostrarMensagem(
            "Supabase não foi inicializado.",
            "error"
        );
        return;
    }

    if (!modeloId) {
        mostrarMensagem(
            "ID do modelo não informado.",
            "error"
        );
        return;
    }

    const confirmar =
        window.confirm(
            "Deseja realmente REPROVAR este modelo?"
        );

    if (!confirmar) {
        return;
    }

    try {

        const {
            error
        } = await supabase
            .from("modelo_perfis")
            .update({
                verificacao_status:
                    "reprovado",
                atualizado_em:
                    new Date().toISOString()
            })
            .eq(
                "id",
                modeloId
            );

        if (error) {

            console.error(
                "Erro ao reprovar modelo:",
                error
            );

            mostrarMensagem(
                "Não foi possível reprovar o modelo: " +
                error.message,
                "error"
            );

            return;
        }

        const modelo =
            listaPreCadastros.find(
                item =>
                    item.id === modeloId
            );

        if (modelo) {

            modelo.status =
                "reprovado";

            modelo.verificacao_status =
                "reprovado";
        }

        aplicarFiltroERenderizar();

        fecharFichaModelo();

        mostrarMensagem(
            "Modelo reprovado.",
            "success"
        );

    } catch (erro) {

        console.error(
            "Erro inesperado ao reprovar:",
            erro
        );

        mostrarMensagem(
            "Erro inesperado ao reprovar o modelo.",
            "error"
        );
    }
}

// =============================================================
// FUNÇÕES DE COMPATIBILIDADE
// =============================================================

async function carregarListaPreCadastros() {
    return await carregarModelos();
}

async function carregarModelosPendentes() {

    const todos =
        await carregarModelos();

    return todos.filter(
        modelo =>
            normalizarStatus(
                modelo.status ||
                modelo.verificacao_status
            ) === "pendente"
    );
}

async function recarregarPainel() {

    mostrarMensagem(
        "Atualizando painel..."
    );

    await carregarModelos();

    await carregarUsuariosAdmin();

    await carregarReclamacoesAdmin();

    atualizarResumo();

    mostrarMensagem(
        "Painel atualizado.",
        "success"
    );
}

// =============================================================
// EDIÇÃO DE STATUS — COMPATIBILIDADE
// =============================================================

async function alterarStatusModelo(
    modeloId,
    novoStatus
) {
    const supabase =
        obterSupabase();

    if (!supabase || !modeloId) {
        return false;
    }

    const status =
        normalizarStatus(
            novoStatus
        );

    const {
        error
    } = await supabase
        .from("modelo_perfis")
        .update({
            verificacao_status:
                status,
            atualizado_em:
                new Date().toISOString()
        })
        .eq(
            "id",
            modeloId
        );

    if (error) {

        console.error(
            "Erro ao alterar status:",
            error
        );

        return false;
    }

    const modelo =
        listaPreCadastros.find(
            item =>
                item.id === modeloId
        );

    if (modelo) {
        modelo.status = status;
        modelo.verificacao_status =
            status;
    }

    aplicarFiltroERenderizar();

    return true;
}

// =============================================================
// USUÁRIOS
// =============================================================

async function carregarUsuariosAdmin() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return [];
    }

    try {

        const {
            data,
            error
        } = await supabase
            .from("perfis")
            .select("*")
            .order(
                "criado_em",
                {
                    ascending: false
                }
            );

        if (error) {

            console.warn(
                "Não foi possível carregar usuários:",
                error
            );

            listaUsuariosAdmin = [];

            return [];
        }

        listaUsuariosAdmin =
            Array.isArray(data)
                ? data
                : [];

        renderizarUsuarios(
            listaUsuariosAdmin
        );

        return listaUsuariosAdmin;

    } catch (erro) {

        console.error(
            "Erro ao carregar usuários:",
            erro
        );

        listaUsuariosAdmin = [];

        return [];
    }
}

function renderizarUsuarios(
    usuarios
) {

    const container =
        document.getElementById(
            "lista-usuarios"
        ) ||
        document.getElementById(
            "listaUsuarios"
        );

    if (!container) {
        return;
    }

    if (!usuarios.length) {

        container.innerHTML = `
            <div style="
                padding:25px;
                color:#756b71;
                font-size:11px;
            ">
                Nenhum usuário disponível.
            </div>
        `;

        return;
    }

    container.innerHTML =
        usuarios.map(
            usuario => {

                const nome =
                    usuario.nome ||
                    usuario.nome_exibicao ||
                    "Usuário";

                const email =
                    usuario.email ||
                    "E-mail não informado";

                const status =
                    usuario.status ||
                    "ativo";

                return `
                    <div style="
                        padding:14px;
                        margin-bottom:9px;
                        border-radius:12px;
                        border:
                            1px solid
                            rgba(
                                245,
                                213,
                                140,
                                .10
                            );
                        background:
                            rgba(
                                255,
                                255,
                                255,
                                .025
                            );
                    ">

                        <div style="
                            color:#f5d58c;
                            font-weight:700;
                            font-size:12px;
                        ">
                            ${escaparHTML(
                                nome
                            )}
                        </div>

                        <div style="
                            color:#8f858b;
                            font-size:10px;
                            margin-top:4px;
                        ">
                            ${escaparHTML(
                                email
                            )}
                        </div>

                        <div style="
                            color:#6f666c;
                            font-size:9px;
                            margin-top:5px;
                        ">
                            Status:
                            ${escaparHTML(
                                status
                            )}
                        </div>

                    </div>
                `;
            }
        ).join("");
}

// =============================================================
// RECLAMAÇÕES
// =============================================================

async function carregarReclamacoesAdmin() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return [];
    }

    try {

        const {
            data,
            error
        } = await supabase
            .from("reclamacoes")
            .select("*")
            .order(
                "criado_em",
                {
                    ascending: false
                }
            );

        if (error) {

            console.warn(
                "Não foi possível carregar reclamações:",
                error
            );

            listaReclamacoesAdmin = [];

            return [];
        }

        listaReclamacoesAdmin =
            Array.isArray(data)
                ? data
                : [];

        renderizarReclamacoes(
            listaReclamacoesAdmin
        );

        return listaReclamacoesAdmin;

    } catch (erro) {

        console.error(
            "Erro ao carregar reclamações:",
            erro
        );

        listaReclamacoesAdmin = [];

        return [];
    }
}

function renderizarReclamacoes(
    reclamacoes
) {

    const container =
        document.getElementById(
            "lista-reclamacoes"
        ) ||
        document.getElementById(
            "listaReclamacoes"
        );

    if (!container) {
        return;
    }

    if (!reclamacoes.length) {

        container.innerHTML = `
            <div style="
                padding:25px;
                color:#756b71;
                font-size:11px;
            ">
                Nenhuma reclamação encontrada.
            </div>
        `;

        return;
    }

    container.innerHTML =
        reclamacoes.map(
            item => {

                const assunto =
                    item.assunto ||
                    "Sem assunto";

                const mensagem =
                    item.mensagem ||
                    "Sem mensagem";

                const status =
                    item.status ||
                    "pendente";

                return `
                    <div style="
                        padding:15px;
                        margin-bottom:10px;
                        border-radius:13px;
                        border:
                            1px solid
                            rgba(
                                245,
                                213,
                                140,
                                .10
                            );
                        background:
                            rgba(
                                255,
                                255,
                                255,
                                .025
                            );
                    ">

                        <div style="
                            color:#f5d58c;
                            font-size:12px;
                            font-weight:800;
                        ">
                            ${escaparHTML(
                                assunto
                            )}
                        </div>

                        <div style="
                            color:#b9afb5;
                            font-size:10px;
                            line-height:1.6;
                            margin-top:8px;
                        ">
                            ${escaparHTML(
                                mensagem
                            )}
                        </div>

                        <div style="
                            color:#71666e;
                            font-size:9px;
                            margin-top:8px;
                        ">
                            Status:
                            ${escaparHTML(
                                status
                            )}
                        </div>

                    </div>
                `;
            }
        ).join("");
}
// =============================================================
// ESTATÍSTICAS
// =============================================================

async function carregarEstatisticas() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return null;
    }

    try {

        const totalModelos =
            listaPreCadastros.length;

        const pendentes =
            listaPreCadastros.filter(
                item =>
                    normalizarStatus(
                        item.status ||
                        item.verificacao_status
                    ) === "pendente"
            ).length;

        const aprovados =
            listaPreCadastros.filter(
                item =>
                    normalizarStatus(
                        item.status ||
                        item.verificacao_status
                    ) === "aprovado"
            ).length;

        const reprovados =
            listaPreCadastros.filter(
                item =>
                    normalizarStatus(
                        item.status ||
                        item.verificacao_status
                    ) === "reprovado"
            ).length;

        atualizarElemento(
            "estatTotalModelos",
            totalModelos
        );

        atualizarElemento(
            "estatPendentes",
            pendentes
        );

        atualizarElemento(
            "estatAprovados",
            aprovados
        );

        atualizarElemento(
            "estatReprovados",
            reprovados
        );

        return {
            totalModelos,
            pendentes,
            aprovados,
            reprovados
        };

    } catch (erro) {

        console.error(
            "Erro nas estatísticas:",
            erro
        );

        return null;
    }
}

// =============================================================
// PAGAMENTOS
// =============================================================

async function carregarPagamentosAdmin() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return [];
    }

    try {

        const {
            data,
            error
        } = await supabase
            .from("pagamentos_planos")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (error) {

            console.warn(
                "Não foi possível carregar pagamentos:",
                error
            );

            listaPagamentosAdmin = [];

            return [];
        }

        listaPagamentosAdmin =
            Array.isArray(data)
                ? data
                : [];

        renderizarPagamentos(
            listaPagamentosAdmin
        );

        return listaPagamentosAdmin;

    } catch (erro) {

        console.error(
            "Erro ao carregar pagamentos:",
            erro
        );

        listaPagamentosAdmin = [];

        return [];
    }
}

function renderizarPagamentos(
    pagamentos
) {

    const container =
        document.getElementById(
            "lista-pagamentos"
        ) ||
        document.getElementById(
            "listaPagamentos"
        );

    if (!container) {
        return;
    }

    if (!pagamentos.length) {

        container.innerHTML = `
            <div style="
                padding:25px;
                color:#756b71;
                font-size:11px;
            ">
                Nenhum pagamento encontrado.
            </div>
        `;

        return;
    }

    container.innerHTML =
        pagamentos.map(
            pagamento => {

                const plano =
                    pagamento.plano_nome ||
                    pagamento.plano_codigo ||
                    "Plano não informado";

                const status =
                    pagamento.status ||
                    "pendente";

                const valor =
                    formatarMoedaAdmin(
                        pagamento.valor
                    );

                return `
                    <div style="
                        padding:15px;
                        margin-bottom:10px;
                        border-radius:13px;
                        border:
                            1px solid
                            rgba(
                                245,
                                213,
                                140,
                                .10
                            );
                        background:
                            rgba(
                                255,
                                255,
                                255,
                                .025
                            );
                    ">

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            gap:10px;
                        ">

                            <div style="
                                color:#f5d58c;
                                font-size:12px;
                                font-weight:800;
                            ">
                                ${escaparHTML(
                                    plano
                                )}
                            </div>

                            <div style="
                                color:#ddd;
                                font-size:11px;
                                font-weight:700;
                            ">
                                ${escaparHTML(
                                    valor
                                )}
                            </div>

                        </div>

                        <div style="
                            color:#8e838a;
                            font-size:9px;
                            margin-top:7px;
                        ">
                            Status:
                            ${escaparHTML(
                                status
                            )}
                        </div>

                        ${
                            pagamento.modelo_id
                                ? `
                                    <div style="
                                        color:#71666e;
                                        font-size:8px;
                                        margin-top:5px;
                                        word-break:break-all;
                                    ">
                                        Modelo:
                                        ${escaparHTML(
                                            pagamento.modelo_id
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </div>
                `;
            }
        ).join("");
}

// =============================================================
// ABERTURA DOS MÓDULOS
// =============================================================

function mostrarSecaoAdmin(
    nome
) {

    const secoes =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    if (secoes.length) {

        secoes.forEach(
            secao => {

                const nomeSecao =
                    secao.dataset
                        .adminSection;

                secao.style.display =
                    nomeSecao === nome
                        ? ""
                        : "none";
            }
        );

        return;
    }

    const mapa = {

        modelos: [
            "gestao-modelos",
            "modulo-modelos"
        ],

        usuarios: [
            "gestao-usuarios",
            "modulo-usuarios"
        ],

        reclamacoes: [
            "gestao-reclamacoes",
            "modulo-reclamacoes"
        ],

        pagamentos: [
            "gestao-pagamentos",
            "modulo-pagamentos"
        ],

        estatisticas: [
            "gestao-estatisticas",
            "modulo-estatisticas"
        ]

    };

    Object.entries(
        mapa
    ).forEach(
        ([chave, ids]) => {

            ids.forEach(id => {

                const elemento =
                    document.getElementById(
                        id
                    );

                if (!elemento) {
                    return;
                }

                elemento.style.display =
                    chave === nome
                        ? ""
                        : "none";
            });
        }
    );
}

function abrirModuloModelos() {

    mostrarSecaoAdmin(
        "modelos"
    );

    carregarModelos();
}

async function abrirModuloUsuarios() {

    mostrarSecaoAdmin(
        "usuarios"
    );

    await carregarUsuariosAdmin();
}

async function abrirModuloReclamacoes() {

    mostrarSecaoAdmin(
        "reclamacoes"
    );

    await carregarReclamacoesAdmin();
}

async function abrirModuloPagamentos() {

    mostrarSecaoAdmin(
        "pagamentos"
    );

    await carregarPagamentosAdmin();
}

async function abrirModuloEstatisticas() {

    mostrarSecaoAdmin(
        "estatisticas"
    );

    await carregarEstatisticas();
}

// =============================================================
// ABERTURA GENÉRICA DE MÓDULO
// =============================================================

async function abrirModuloAdmin(
    modulo
) {

    const nome =
        String(
            modulo || ""
        ).toLowerCase().trim();

    switch (nome) {

        case "modelos":
        case "modelo":
        case "gestao-modelos":
        case "pre-cadastros":
            await abrirModuloModelos();
            break;

        case "usuarios":
        case "usuario":
            await abrirModuloUsuarios();
            break;

        case "reclamacoes":
        case "reclamacao":
            await abrirModuloReclamacoes();
            break;

        case "pagamentos":
        case "pagamento":
            await abrirModuloPagamentos();
            break;

        case "estatisticas":
        case "estatistica":
        case "dashboard":
            await abrirModuloEstatisticas();
            break;

        default:

            console.warn(
                "Módulo administrativo não reconhecido:",
                modulo
            );

            abrirModuloModelos();
            break;
    }
}

// =============================================================
// ATIVAÇÃO DOS MÓDULOS DO PAINEL
// =============================================================

function ativarModulosAdmin() {

    document
        .querySelectorAll(
            "[data-modulo-admin]"
        )
        .forEach(
            botao => {

                if (
                    botao.dataset
                        .luxModuloAtivo
                ) {
                    return;
                }

                botao.dataset
                    .luxModuloAtivo =
                    "true";

                botao.addEventListener(
                    "click",
                    evento => {

                        evento.preventDefault();

                        const modulo =
                            botao.dataset
                                .moduloAdmin;

                        abrirModuloAdmin(
                            modulo
                        );
                    }
                );
            }
        );

    document
        .querySelectorAll(
            "[onclick*='abrirModuloAdmin']"
        )
        .forEach(
            elemento => {

                elemento.dataset
                    .luxModuloDetectado =
                    "true";
            }
        );
}

// =============================================================
// MODAL GENÉRICO
// =============================================================

function abrirModalAdmin(
    id
) {

    const modal =
        document.getElementById(
            id
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        "flex";

    modal.classList.add(
        "ativo"
    );
}

function fecharModalAdmin(
    id
) {

    const modal =
        document.getElementById(
            id
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        "none";

    modal.classList.remove(
        "ativo"
    );
}

// =============================================================
// FECHAMENTO DE MODAIS AO CLICAR FORA
// =============================================================

function ativarFechamentoModais() {

    document
        .querySelectorAll(
            ".modal"
        )
        .forEach(
            modal => {

                if (
                    modal.dataset
                        .luxFechamentoAtivo
                ) {
                    return;
                }

                modal.dataset
                    .luxFechamentoAtivo =
                    "true";

                modal.addEventListener(
                    "click",
                    evento => {

                        if (
                            evento.target ===
                            modal
                        ) {

                            modal.style.display =
                                "none";

                            modal.classList.remove(
                                "ativo"
                            );
                        }
                    }
                );
            }
        );
}

// =============================================================
// ESC PARA FECHAR MODAIS
// =============================================================

function ativarTeclaEscape() {

    if (
        window._luxEscapeAtivo
    ) {
        return;
    }

    window._luxEscapeAtivo =
        true;

    document.addEventListener(
        "keydown",
        evento => {

            if (
                evento.key !==
                "Escape"
            ) {
                return;
            }

            document
                .querySelectorAll(
                    ".modal.ativo"
                )
                .forEach(
                    modal => {

                        modal.style.display =
                            "none";

                        modal.classList.remove(
                            "ativo"
                        );
                    }
                );

            fecharFichaModelo();
        }
    );
}

// =============================================================
// AUTO ATUALIZAÇÃO
// =============================================================

let intervaloAtualizacaoLux =
    null;

function iniciarAtualizacaoAutomatica() {

    if (
        intervaloAtualizacaoLux
    ) {
        clearInterval(
            intervaloAtualizacaoLux
        );
    }

    intervaloAtualizacaoLux =
        setInterval(
            async () => {

                const modal =
                    document.getElementById(
                        "modal-ver-ficha"
                    );

                const modalAberto =
                    modal &&
                    modal.style.display ===
                        "flex";

                if (
                    document.hidden ||
                    modalAberto
                ) {
                    return;
                }

                await carregarModelos();

            },
            60000
        );
}

function pararAtualizacaoAutomatica() {

    if (
        intervaloAtualizacaoLux
    ) {

        clearInterval(
            intervaloAtualizacaoLux
        );

        intervaloAtualizacaoLux =
            null;
    }
}

// =============================================================
// INICIALIZAÇÃO PRINCIPAL
// =============================================================

async function iniciarPainelAdmin() {

    const autorizado =
        await verificarSessaoAdmin();

    if (!autorizado) {
        return;
    }

    ativarBotoesFiltro();

    ativarModulosAdmin();

    ativarFechamentoModais();

    ativarTeclaEscape();

    await carregarModelos();

    await carregarUsuariosAdmin();

    await carregarReclamacoesAdmin();

    atualizarResumo();

    await carregarEstatisticas();

    iniciarAtualizacaoAutomatica();
}

// =============================================================
// DOM READY
// =============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        iniciarPainelAdmin()
            .catch(
                erro => {

                    console.error(
                        "Erro ao iniciar painel:",
                        erro
                    );

                    mostrarMensagem(
                        "Erro ao iniciar o painel administrativo.",
                        "error"
                    );
                }
            );

    }
);

// =============================================================
// COMPATIBILIDADE GLOBAL
// =============================================================

window.listaPreCadastros =
    listaPreCadastros;

window.carregarModelos =
    carregarModelos;

window.carregarListaPreCadastros =
    carregarListaPreCadastros;

window.carregarModelosPendentes =
    carregarModelosPendentes;

window.normalizarModeloAdmin =
    normalizarModeloAdmin;

window.abrirFichaModelo =
    abrirFichaModelo;

window.abrirVerFichaPorIndice =
    abrirVerFichaPorIndice;

window.fecharFichaModelo =
    fecharFichaModelo;

window.fecharModalFicha =
    fecharModalFicha;

window.aprovarModelo =
    aprovarModelo;

window.reprovarModelo =
    reprovarModelo;

window.alterarStatusModelo =
    alterarStatusModelo;

window.aplicarFiltroStatus =
    aplicarFiltroStatus;

window.filtrarModelos =
    filtrarModelos;

window.pesquisarModelos =
    pesquisarModelos;

window.carregarUsuariosAdmin =
    carregarUsuariosAdmin;

window.renderizarUsuarios =
    renderizarUsuarios;

window.carregarReclamacoesAdmin =
    carregarReclamacoesAdmin;

window.renderizarReclamacoes =
    renderizarReclamacoes;

window.carregarPagamentosAdmin =
    carregarPagamentosAdmin;

window.renderizarPagamentos =
    renderizarPagamentos;

window.carregarEstatisticas =
    carregarEstatisticas;

window.abrirModuloAdmin =
    abrirModuloAdmin;

window.abrirModuloModelos =
    abrirModuloModelos;

window.abrirModuloUsuarios =
    abrirModuloUsuarios;

window.abrirModuloReclamacoes =
    abrirModuloReclamacoes;

window.abrirModuloPagamentos =
    abrirModuloPagamentos;

window.abrirModuloEstatisticas =
    abrirModuloEstatisticas;

window.abrirModalAdmin =
    abrirModalAdmin;

window.fecharModalAdmin =
    fecharModalAdmin;

window.recarregarPainel =
    recarregarPainel;

window.sairAdmin =
    sairAdmin;
// =============================================================
// ABRIR MÓDULO DE MODELOS
// =============================================================

function abrirGestaoModelos() {
    mostrarSecaoAdmin("modelos");
    carregarModelos();
}

// =============================================================
// ATUALIZAR DADOS DO PAINEL
// =============================================================

async function atualizarDadosPainel() {

    try {

        await carregarModelos();

        await carregarUsuariosAdmin();

        await carregarReclamacoesAdmin();

        await carregarPagamentosAdmin();

        await carregarEstatisticas();

        atualizarResumo();

        mostrarMensagem(
            "Dados atualizados com sucesso.",
            "success"
        );

    } catch (erro) {

        console.error(
            "Erro ao atualizar painel:",
            erro
        );

        mostrarMensagem(
            "Não foi possível atualizar todos os dados.",
            "error"
        );
    }
}

// =============================================================
// TESTE DE CONEXÃO COM SUPABASE
// =============================================================

async function testarConexaoSupabase() {

    const supabase =
        obterSupabase();

    if (!supabase) {

        mostrarMensagem(
            "Supabase não encontrado. Verifique o config.js.",
            "error"
        );

        return false;
    }

    try {

        const {
            data,
            error
        } = await supabase
            .from("modelo_perfis")
            .select("id")
            .limit(1);

        if (error) {

            console.error(
                "Teste Supabase:",
                error
            );

            mostrarMensagem(
                "Supabase conectado, mas a leitura foi recusada: " +
                error.message,
                "error"
            );

            return false;
        }

        console.log(
            "LUX — conexão Supabase OK.",
            data
        );

        mostrarMensagem(
            "Conexão com Supabase funcionando.",
            "success"
        );

        return true;

    } catch (erro) {

        console.error(
            "Erro no teste Supabase:",
            erro
        );

        mostrarMensagem(
            "Erro ao testar conexão com Supabase.",
            "error"
        );

        return false;
    }
}

// =============================================================
// CONFIRMAÇÃO DE AÇÃO
// =============================================================

function confirmarAcao(
    mensagem
) {
    return window.confirm(
        mensagem ||
        "Deseja continuar?"
    );
}

// =============================================================
// FORMATAÇÃO DE TELEFONE
// =============================================================

function formatarWhatsApp(
    telefone
) {

    if (!telefone) {
        return "Não informado";
    }

    const somenteNumeros =
        String(telefone)
            .replace(/\D/g, "");

    if (
        somenteNumeros.length ===
        13
    ) {

        return "+" +
            somenteNumeros.slice(0, 2) +
            " (" +
            somenteNumeros.slice(2, 4) +
            ") " +
            somenteNumeros.slice(4, 9) +
            "-" +
            somenteNumeros.slice(9);

    }

    if (
        somenteNumeros.length ===
        11
    ) {

        return "(" +
            somenteNumeros.slice(0, 2) +
            ") " +
            somenteNumeros.slice(2, 7) +
            "-" +
            somenteNumeros.slice(7);

    }

    return String(telefone);
}

// =============================================================
// ABRIR WHATSAPP DO MODELO
// =============================================================

function abrirWhatsAppModelo(
    telefone
) {

    if (!telefone) {

        mostrarMensagem(
            "WhatsApp não informado.",
            "error"
        );

        return;
    }

    const numero =
        String(telefone)
            .replace(/\D/g, "");

    if (!numero) {

        mostrarMensagem(
            "Número de WhatsApp inválido.",
            "error"
        );

        return;
    }

    const numeroFinal =
        numero.startsWith("55")
            ? numero
            : "55" + numero;

    const url =
        "https://wa.me/" +
        numeroFinal;

    window.open(
        url,
        "_blank"
    );
}

// =============================================================
// COPIAR TEXTO
// =============================================================

async function copiarTexto(
    texto
) {

    if (
        texto === null ||
        texto === undefined
    ) {
        return false;
    }

    try {

        await navigator.clipboard.writeText(
            String(texto)
        );

        mostrarMensagem(
            "Texto copiado.",
            "success"
        );

        return true;

    } catch (erro) {

        console.error(
            "Erro ao copiar:",
            erro
        );

        mostrarMensagem(
            "Não foi possível copiar automaticamente.",
            "error"
        );

        return false;
    }
}

// =============================================================
// EXPORTAÇÕES FINAIS
// =============================================================

window.abrirGestaoModelos =
    abrirGestaoModelos;

window.atualizarDadosPainel =
    atualizarDadosPainel;

window.testarConexaoSupabase =
    testarConexaoSupabase;

window.confirmarAcao =
    confirmarAcao;

window.formatarWhatsApp =
    formatarWhatsApp;

window.abrirWhatsAppModelo =
    abrirWhatsAppModelo;

window.copiarTexto =
    copiarTexto;

// =============================================================
// PROTEÇÃO CONTRA ERROS DE INICIALIZAÇÃO
// =============================================================

window.addEventListener(
    "error",
    evento => {

        console.error(
            "LUX Admin — erro JavaScript:",
            evento.error ||
            evento.message
        );

    }
);

window.addEventListener(
    "unhandledrejection",
    evento => {

        console.error(
            "LUX Admin — Promise rejeitada:",
            evento.reason
        );

    }
);

// =============================================================
// FIM DO PAINEL ADMINISTRATIVO LUX-ADVANCE
// =============================================================
