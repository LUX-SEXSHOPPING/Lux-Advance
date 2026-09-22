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

    await carregarDadosIniciais();

});


// =============================================================
// CARREGAR DADOS INICIAIS
// =============================================================

async function carregarDadosIniciais() {

    try {

        await carregarModelos();

        await carregarUsuarios();

        await carregarReclamacoes();

        await carregarEstatisticas();

    } catch (erro) {

        console.error(
            "Erro ao carregar dados iniciais:",
            erro
        );

    }

}


// =============================================================
// SUPABASE
// =============================================================

function obterSupabase() {

    if (
        typeof window !== "undefined" &&
        window.luxSupabase
    ) {

        return window.luxSupabase;

    }

    if (
        typeof window !== "undefined" &&
        window.supabaseClient
    ) {

        return window.supabaseClient;

    }

    console.error(
        "Cliente Supabase não encontrado."
    );

    return null;

}


// =============================================================
// CARREGAR MODELOS
// =============================================================

async function carregarModelos() {

    const supabase =
        obterSupabase();

    if (!supabase) {

        console.error(
            "Supabase não inicializado."
        );

        return;

    }

    try {

        const resultado =
            await supabase
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

        if (resultado.error) {

            console.error(
                "Erro ao carregar modelos:",
                resultado.error
            );

            return;

        }

        listaPreCadastros =
            resultado.data || [];

        renderizarModelos(
            listaPreCadastros
        );

        atualizarContadores();

    } catch (erro) {

        console.error(
            "Erro inesperado:",
            erro
        );

    }

}


// =============================================================
// RENDERIZAR MODELOS
// =============================================================

function renderizarModelos(modelos) {

    const container =
        document.getElementById(
            "listaModelos"
        ) ||
        document.getElementById(
            "listaPreCadastros"
        ) ||
        document.getElementById(
            "modelos-container"
        );

    if (!container) {

        console.warn(
            "Área de modelos não encontrada."
        );

        return;

    }

    let lista =
        Array.isArray(modelos)
            ? [...modelos]
            : [];

    if (
        filtroStatus &&
        filtroStatus !== "todos"
    ) {

        lista =
            lista.filter(
                modelo =>
                    modelo.verificacao_status ===
                    filtroStatus
            );

    }

    container.innerHTML = "";

    if (lista.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <p>
                    Nenhum modelo encontrado.
                </p>
            </div>
        `;

        return;

    }

    lista.forEach(
        (modelo, index) => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "modelo-card";

            card.dataset.id =
                modelo.id;

            const foto =
                modelo.foto_url ||
                "./logo.png";

            const nome =
                modelo.nome_exibicao ||
                "Sem nome";

            const apelido =
                modelo.apelido ||
                "Não informado";

            const idade =
                modelo.idade ??
                "Não informado";

            const cidade =
                modelo.cidade ||
                "Não informada";

            const categoria =
                modelo.categoria_catalogo ||
                "Não informada";

            const status =
                modelo.verificacao_status ||
                "pendente";

            card.innerHTML = `

                <div class="modelo-card-foto">

                    <img
                        src="${escaparHtml(
                            foto
                        )}"
                        alt="${escaparHtml(
                            nome
                        )}"
                        onerror="
                            this.src='./logo.png'
                        "
                    >

                </div>

                <div class="modelo-card-info">

                    <h3>
                        ${escaparHtml(
                            nome
                        )}
                    </h3>

                    <p>
                        <strong>
                            Apelido:
                        </strong>
                        ${escaparHtml(
                            apelido
                        )}
                    </p>

                    <p>
                        <strong>
                            Idade:
                        </strong>
                        ${escaparHtml(
                            String(idade)
                        )}
                    </p>

                    <p>
                        <strong>
                            Cidade:
                        </strong>
                        ${escaparHtml(
                            cidade
                        )}
                    </p>

                    <p>
                        <strong>
                            Categoria:
                        </strong>
                        ${escaparHtml(
                            categoria
                        )}
                    </p>

                    <span
                        class="
                            status-badge
                            status-${escaparHtml(
                                status
                            )}
                        "
                    >
                        ${escaparHtml(
                            status
                        )}
                    </span>

                </div>

                <div class="modelo-card-acoes">

                    <button
                        type="button"
                        onclick="
                            abrirFichaModelo(
                                '${modelo.id}'
                            )
                        "
                    >
                        Ver ficha
                    </button>

                    ${
                        status === "pendente"
                            ? `
                                <button
                                    type="button"
                                    onclick="
                                        aprovarModelo(
                                            '${modelo.id}'
                                        )
                                    "
                                >
                                    Aprovar
                                </button>

                                <button
                                    type="button"
                                    onclick="
                                        reprovarModelo(
                                            '${modelo.id}'
                                        )
                                    "
                                >
                                    Reprovar
                                </button>
                            `
                            : ""
                    }

                </div>

            `;

            container.appendChild(
                card
            );

        }
    );

}


// =============================================================
// ABRIR FICHA DO MODELO
// =============================================================

async function abrirFichaModelo(id) {

    const modelo =
        listaPreCadastros.find(
            item =>
                item.id === id
        );

    if (!modelo) {

        alert(
            "Modelo não encontrado."
        );

        return;

    }

    const modal =
        document.getElementById(
            "modalModelo"
        ) ||
        document.getElementById(
            "modalFicha"
        );

    if (!modal) {

        console.warn(
            "Modal de ficha não encontrado."
        );

        return;

    }

    const conteudo =
        modal.querySelector(
            ".modal-content"
        ) ||
        modal.querySelector(
            ".modal-body"
        ) ||
        modal;

    conteudo.innerHTML = `

        <div class="ficha-modelo">

            <button
                type="button"
                onclick="
                    fecharFichaModelo()
                "
            >
                ×
            </button>

            <div class="ficha-cabecalho">

                <img
                    src="${escaparHtml(
                        modelo.foto_url ||
                        "./logo.png"
                    )}"
                    alt="${escaparHtml(
                        modelo.nome_exibicao ||
                        "Modelo"
                    )}"
                    onerror="
                        this.src='./logo.png'
                    "
                >

                <div>

                    <h2>
                        ${escaparHtml(
                            modelo.nome_exibicao ||
                            "Sem nome"
                        )}
                    </h2>

                    <p>
                        Status:
                        <strong>
                            ${escaparHtml(
                                modelo.verificacao_status ||
                                "pendente"
                            )}
                        </strong>
                    </p>

                </div>

            </div>

            <hr>

            <h3>
                Dados pessoais
            </h3>

            <div class="ficha-grid">

                <p>
                    <strong>
                        Nome:
                    </strong>
                    ${escaparHtml(
                        modelo.nome_exibicao
                    )}
                </p>

                <p>
                    <strong>
                        Apelido:
                    </strong>
                    ${escaparHtml(
                        modelo.apelido ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        CPF:
                    </strong>
                    ${escaparHtml(
                        modelo.cpf ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Data de nascimento:
                    </strong>
                    ${formatarData(
                        modelo.data_nascimento
                    )}
                </p>

                <p>
                    <strong>
                        Idade:
                    </strong>
                    ${escaparHtml(
                        String(
                            modelo.idade ??
                            "Não informado"
                        )
                    )}
                </p>

                <p>
                    <strong>
                        WhatsApp:
                    </strong>
                    ${escaparHtml(
                        modelo.whatsapp ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Altura:
                    </strong>
                    ${
                        modelo.altura_cm
                            ? `${escaparHtml(
                                String(
                                    modelo.altura_cm
                                )
                              )} cm`
                            : "Não informado"
                    }
                </p>

                <p>
                    <strong>
                        Categoria:
                    </strong>
                    ${escaparHtml(
                        modelo.categoria_catalogo ||
                        "Não informada"
                    )}
                </p>

            </div>

            <h3>
                Endereço
            </h3>

            <div class="ficha-grid">

                <p>
                    <strong>
                        CEP:
                    </strong>
                    ${escaparHtml(
                        modelo.cep ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Estado:
                    </strong>
                    ${escaparHtml(
                        modelo.estado ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Cidade:
                    </strong>
                    ${escaparHtml(
                        modelo.cidade ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Bairro:
                    </strong>
                    ${escaparHtml(
                        modelo.bairro ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Endereço:
                    </strong>
                    ${escaparHtml(
                        modelo.endereco ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Número:
                    </strong>
                    ${escaparHtml(
                        modelo.numero ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Complemento:
                    </strong>
                    ${escaparHtml(
                        modelo.complemento ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        País:
                    </strong>
                    ${escaparHtml(
                        modelo.pais ||
                        "Não informado"
                    )}
                </p>

            </div>

            <h3>
                Características
            </h3>

            <div class="ficha-grid">

                <p>
                    <strong>
                        Cor do cabelo:
                    </strong>
                    ${escaparHtml(
                        modelo.cor_cabelo ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Cor dos olhos:
                    </strong>
                    ${escaparHtml(
                        modelo.cor_olhos ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Idiomas:
                    </strong>
                    ${escaparHtml(
                        modelo.idiomas ||
                        "Não informado"
                    )}
                </p>

            </div>

            <h3>
                Descrição
            </h3>

            <div class="ficha-descricao">

                ${escaparHtml(
                    modelo.descricao ||
                    "Nenhuma descrição informada."
                )}

            </div>

            <h3>
                Dados do cadastro
            </h3>

            <div class="ficha-grid">

                <p>
                    <strong>
                        Plano:
                    </strong>
                    ${escaparHtml(
                        modelo.plano ||
                        "Não informado"
                    )}
                </p>

                <p>
                    <strong>
                        Maioridade confirmada:
                    </strong>
                    ${
                        modelo.maioridade_confirmada
                            ? "Sim"
                            : "Não"
                    }
                </p>

                <p>
                    <strong>
                        Criado em:
                    </strong>
                    ${formatarDataHora(
                        modelo.criado_em
                    )}
                </p>

                <p>
                    <strong>
                        Atualizado em:
                    </strong>
                    ${formatarDataHora(
                        modelo.atualizado_em
                    )}
                </p>

            </div>

            ${
                modelo.verificacao_status ===
                "pendente"
                    ? `
                        <div
                            class="ficha-acoes"
                        >

                            <button
                                type="button"
                                onclick="
                                    aprovarModelo(
                                        '${modelo.id}'
                                    )
                                "
                            >
                                Aprovar modelo
                            </button>

                            <button
                                type="button"
                                onclick="
                                    reprovarModelo(
                                        '${modelo.id}'
                                    )
                                "
                            >
                                Reprovar modelo
                            </button>

                        </div>
                    `
                    : ""
            }

        </div>

    `;

    modal.style.display =
        "flex";

}


// =============================================================
// FECHAR FICHA
// =============================================================

function fecharFichaModelo() {

    const modal =
        document.getElementById(
            "modalModelo"
        ) ||
        document.getElementById(
            "modalFicha"
        );

    if (modal) {

        modal.style.display =
            "none";

    }

}


// =============================================================
// APROVAR MODELO
// =============================================================

async function aprovarModelo(id) {

    const modelo =
        listaPreCadastros.find(
            item =>
                item.id === id
        );

    if (!modelo) {

        alert(
            "Modelo não encontrado."
        );

        return;

    }

    const confirmar =
        confirm(
            `Deseja aprovar o modelo "${modelo.nome_exibicao}"?`
        );

    if (!confirmar) {
        return;
    }

    const supabase =
        obterSupabase();

    if (!supabase) {

        alert(
            "Supabase não está disponível."
        );

        return;

    }

    try {

        const resultado =
            await supabase
                .from("modelo_perfis")
                .update({
                    verificacao_status:
                        "aprovado",
                    atualizado_em:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    id
                );

        if (resultado.error) {

            console.error(
                "Erro ao aprovar:",
                resultado.error
            );

            alert(
                "Não foi possível aprovar o modelo."
            );

            return;

        }

        alert(
            "Modelo aprovado com sucesso."
        );

        fecharFichaModelo();

        await carregarModelos();

        await carregarEstatisticas();

    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Erro inesperado ao aprovar."
        );

    }

}


// =============================================================
// REPROVAR MODELO
// =============================================================

async function reprovarModelo(id) {

    const modelo =
        listaPreCadastros.find(
            item =>
                item.id === id
        );

    if (!modelo) {

        alert(
            "Modelo não encontrado."
        );

        return;

    }

    const confirmar =
        confirm(
            `Deseja reprovar o modelo "${modelo.nome_exibicao}"?`
        );

    if (!confirmar) {
        return;
    }

    const supabase =
        obterSupabase();

    if (!supabase) {

        alert(
            "Supabase não está disponível."
        );

        return;

    }

    try {

        const resultado =
            await supabase
                .from("modelo_perfis")
                .update({
                    verificacao_status:
                        "reprovado",
                    atualizado_em:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    id
                );

        if (resultado.error) {

            console.error(
                "Erro ao reprovar:",
                resultado.error
            );

            alert(
                "Não foi possível reprovar o modelo."
            );

            return;

        }

        alert(
            "Modelo reprovado."
        );

        fecharFichaModelo();

        await carregarModelos();

        await carregarEstatisticas();

    } catch (erro) {

        console.error(
            erro
        );

        alert(
            "Erro inesperado ao reprovar."
        );

    }

}


// =============================================================
// FILTRO DE STATUS
// =============================================================

function aplicarFiltroStatus(status) {

    filtroStatus =
        status || "todos";

    renderizarModelos(
        listaPreCadastros
    );

}


// =============================================================
// CONTADORES DOS MODELOS
// =============================================================

function atualizarContadores() {

    const modelos =
        Array.isArray(
            listaPreCadastros
        )
            ? listaPreCadastros
            : [];

    const total =
        modelos.length;

    const pendentes =
        modelos.filter(
            modelo =>
                modelo.verificacao_status ===
                "pendente"
        ).length;

    const aprovados =
        modelos.filter(
            modelo =>
                modelo.verificacao_status ===
                    "aprovado" ||
                modelo.verificacao_status ===
                    "verificada"
        ).length;

    const reprovados =
        modelos.filter(
            modelo =>
                modelo.verificacao_status ===
                "reprovado"
        ).length;

    atualizarElemento(
        [
            "totalModelos",
            "contadorModelos",
            "total-modelos"
        ],
        total
    );

    atualizarElemento(
        [
            "totalPendentes",
            "contadorPendentes",
            "modelosPendentes",
            "pendentes"
        ],
        pendentes
    );

    atualizarElemento(
        [
            "totalAprovados",
            "contadorAprovados",
            "modelosAprovados",
            "aprovados"
        ],
        aprovados
    );

    atualizarElemento(
        [
            "totalReprovados",
            "contadorReprovados",
            "modelosReprovados",
            "reprovados"
        ],
        reprovados
    );

}


// =============================================================
// ATUALIZAR ELEMENTO
// =============================================================

function atualizarElemento(
    ids,
    valor
) {

    ids.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );

            if (elemento) {

                elemento.textContent =
                    valor;

            }

        }
    );

}


// =============================================================
// CARREGAR USUÁRIOS
// =============================================================

async function carregarUsuarios() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return;
    }

    try {

        const resultado =
            await supabase
                .from("perfis")
                .select("*")
                .order(
                    "criado_em",
                    {
                        ascending: false
                    }
                );

        if (resultado.error) {

            console.error(
                "Erro ao carregar usuários:",
                resultado.error
            );

            return;

        }

        const usuarios =
            resultado.data || [];

        renderizarUsuarios(
            usuarios
        );

    } catch (erro) {

        console.error(
            "Erro ao carregar usuários:",
            erro
        );

    }

}


// =============================================================
// RENDERIZAR USUÁRIOS
// =============================================================

function renderizarUsuarios(
    usuarios
) {

    const container =
        document.getElementById(
            "listaUsuarios"
        ) ||
        document.getElementById(
            "usuariosLista"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!usuarios.length) {

        container.innerHTML = `
            <div class="empty-state">
                <p>
                    Nenhum usuário encontrado.
                </p>
            </div>
        `;

        return;

    }

    usuarios.forEach(
        usuario => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "usuario-card";

            item.innerHTML = `

                <div>
                    <strong>
                        ${escaparHtml(
                            usuario.nome ||
                            "Sem nome"
                        )}
                    </strong>

                    <p>
                        Tipo:
                        ${escaparHtml(
                            usuario.tipo ||
                            "Não informado"
                        )}
                    </p>

                    <p>
                        Status:
                        ${escaparHtml(
                            usuario.status ||
                            "Não informado"
                        )}
                    </p>
                </div>

            `;

            container.appendChild(
                item
            );

        }
    );

}


// =============================================================
// CARREGAR RECLAMAÇÕES
// =============================================================

async function carregarReclamacoes() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return;
    }

    try {

        const resultado =
            await supabase
                .from("reclamacoes")
                .select("*")
                .order(
                    "criado_em",
                    {
                        ascending: false
                    }
                );

        if (resultado.error) {

            console.error(
                "Erro ao carregar reclamações:",
                resultado.error
            );

            return;

        }

        renderizarReclamacoes(
            resultado.data || []
        );

    } catch (erro) {

        console.error(
            erro
        );

    }

}


// =============================================================
// RENDERIZAR RECLAMAÇÕES
// =============================================================

function renderizarReclamacoes(
    reclamacoes
) {

    const container =
        document.getElementById(
            "listaReclamacoes"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!reclamacoes.length) {

        container.innerHTML = `
            <div class="empty-state">
                <p>
                    Nenhuma reclamação encontrada.
                </p>
            </div>
        `;

        return;

    }

    reclamacoes.forEach(
        reclamacao => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "reclamacao-card";

            item.innerHTML = `

                <h3>
                    ${escaparHtml(
                        reclamacao.assunto ||
                        "Sem assunto"
                    )}
                </h3>

                <p>
                    ${escaparHtml(
                        reclamacao.mensagem ||
                        ""
                    )}
                </p>

                <small>
                    Status:
                    ${escaparHtml(
                        reclamacao.status ||
                        "Não informado"
                    )}
                </small>

            `;

            container.appendChild(
                item
            );

        }
    );

}


// =============================================================
// ESTATÍSTICAS
// =============================================================

async function carregarEstatisticas() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return;
    }

    try {

        const resultado =
            await supabase
                .from("modelo_perfis")
                .select(
                    "verificacao_status"
                );

        if (resultado.error) {

            console.error(
                "Erro nas estatísticas:",
                resultado.error
            );

            return;

        }

        const modelos =
            resultado.data || [];

        const pendentes =
            modelos.filter(
                modelo =>
                    modelo.verificacao_status ===
                    "pendente"
            ).length;

        const aprovados =
            modelos.filter(
                modelo =>
                    modelo.verificacao_status ===
                        "aprovado" ||
                    modelo.verificacao_status ===
                        "verificada"
            ).length;

        const reprovados =
            modelos.filter(
                modelo =>
                    modelo.verificacao_status ===
                    "reprovado"
            ).length;

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

        atualizarElemento(
            [
                "totalModelos",
                "contadorModelos"
            ],
            modelos.length
        );

    } catch (erro) {

        console.error(
            "Erro ao calcular estatísticas:",
            erro
        );

    }

}


// =============================================================
// UTILITÁRIOS
// =============================================================

function escaparHtml(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {

        return "";

    }

    return String(valor)
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


function formatarData(valor) {

    if (!valor) {
        return "Não informado";
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return String(valor);

    }

    return data.toLocaleDateString(
        "pt-BR"
    );

}


function formatarDataHora(
    valor
) {

    if (!valor) {
        return "Não informado";
    }

    const data =
        new Date(valor);

    if (
        Number.isNaN(
            data.getTime()
        )
    ) {

        return String(valor);

    }

    return data.toLocaleString(
        "pt-BR"
    );

}


// =============================================================
// MODAL GENÉRICO
// =============================================================

function fecharModal() {

    const modais =
        document.querySelectorAll(
            ".modal"
        );

    modais.forEach(
        modal => {

            modal.style.display =
                "none";

        }
    );

    fecharFichaModelo();

}


// =============================================================
// PESQUISA
// =============================================================

function pesquisarModelos(
    texto
) {

    const busca =
        String(
            texto || ""
        )
        .toLowerCase()
        .trim();

    if (!busca) {

        renderizarModelos(
            listaPreCadastros
        );

        return;

    }

    const filtrados =
        listaPreCadastros.filter(
            modelo => {

                const dados = [
                    modelo.nome_exibicao,
                    modelo.apelido,
                    modelo.cidade,
                    modelo.estado,
                    modelo.categoria_catalogo,
                    modelo.whatsapp,
                    modelo.cpf
                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

                return dados.includes(
                    busca
                );

            }
        );

    renderizarModelos(
        filtrados
    );

}


// =============================================================
// FILTRAR MODELOS
// =============================================================

function filtrarModelos(
    status
) {

    filtroStatus =
        status || "todos";

    renderizarModelos(
        listaPreCadastros
    );

}


// =============================================================
// RECARREGAR PAINEL
// =============================================================

async function recarregarPainel() {

    await carregarModelos();

    await carregarUsuarios();

    await carregarReclamacoes();

    await carregarEstatisticas();

}


// =============================================================
// ATUALIZAÇÃO AUTOMÁTICA
// =============================================================

setInterval(
    async () => {

        try {

            await carregarModelos();

        } catch (erro) {

            console.error(
                "Erro na atualização automática:",
                erro
            );

        }

    },
    60000
);


// =============================================================
// EXPORTAR FUNÇÕES
// =============================================================

window.carregarModelos =
    carregarModelos;

window.abrirFichaModelo =
    abrirFichaModelo;

window.fecharFichaModelo =
    fecharFichaModelo;

window.aprovarModelo =
    aprovarModelo;

window.reprovarModelo =
    reprovarModelo;

window.aplicarFiltroStatus =
    aplicarFiltroStatus;

window.filtrarModelos =
    filtrarModelos;

window.pesquisarModelos =
    pesquisarModelos;

window.recarregarPainel =
    recarregarPainel;
        abrirModuloPagamentos();

        return;
    }

    if (
        alvo === "modelos" ||
        alvo === "pre-cadastros" ||
        alvo === "cadastros-modelos"
    ) {

        abrirModuloModelos();

        return;
    }

    if (
        alvo === "usuarios" ||
        alvo === "usuarios-cadastrados"
    ) {

        abrirModuloUsuarios();

        return;
    }

    if (
        alvo === "reclamacoes" ||
        alvo === "denuncias"
    ) {

        abrirModuloReclamacoes();

        return;
    }

    if (
        alvo === "estatisticas" ||
        alvo === "dashboard"
    ) {

        abrirModuloEstatisticas();

        return;
    }

}


// =============================================================
// MÓDULO DE MODELOS
// =============================================================

function abrirModuloModelos() {

    const secoes =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    secoes.forEach(
        secao => {

            secao.style.display =
                "none";

        }
    );

    const secao =
        document.querySelector(
            '[data-admin-section="modelos"]'
        );

    if (secao) {

        secao.style.display =
            "";

    }

    carregarModelos();

}


// =============================================================
// MÓDULO DE USUÁRIOS
// =============================================================

function abrirModuloUsuarios() {

    const secoes =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    secoes.forEach(
        secao => {

            secao.style.display =
                "none";

        }
    );

    const secao =
        document.querySelector(
            '[data-admin-section="usuarios"]'
        );

    if (secao) {

        secao.style.display =
            "";

    }

    carregarUsuarios();

}


// =============================================================
// MÓDULO DE RECLAMAÇÕES
// =============================================================

function abrirModuloReclamacoes() {

    const secoes =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    secoes.forEach(
        secao => {

            secao.style.display =
                "none";

        }
    );

    const secao =
        document.querySelector(
            '[data-admin-section="reclamacoes"]'
        );

    if (secao) {

        secao.style.display =
            "";

    }

    carregarReclamacoes();

}


// =============================================================
// MÓDULO DE ESTATÍSTICAS
// =============================================================

function abrirModuloEstatisticas() {

    const secoes =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    secoes.forEach(
        secao => {

            secao.style.display =
                "none";

        }
    );

    const secao =
        document.querySelector(
            '[data-admin-section="estatisticas"]'
        );

    if (secao) {

        secao.style.display =
            "";

    }

    carregarEstatisticas();

}


// =============================================================
// MÓDULO DE PAGAMENTOS
// =============================================================

function abrirModuloPagamentos() {

    const secoes =
        document.querySelectorAll(
            "[data-admin-section]"
        );

    secoes.forEach(
        secao => {

            secao.style.display =
                "none";

        }
    );

    const secao =
        document.querySelector(
            '[data-admin-section="pagamentos"]'
        );

    if (secao) {

        secao.style.display =
            "";

    }

    carregarPagamentos();

}


// =============================================================
// CARREGAR PAGAMENTOS
// =============================================================

async function carregarPagamentos() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return;
    }

    try {

        const resultado =
            await supabase
                .from(
                    "pagamentos_planos"
                )
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );

        if (resultado.error) {

            console.error(
                "Erro ao carregar pagamentos:",
                resultado.error
            );

            return;

        }

        renderizarPagamentos(
            resultado.data || []
        );

    } catch (erro) {

        console.error(
            "Erro inesperado nos pagamentos:",
            erro
        );

    }

}


// =============================================================
// RENDERIZAR PAGAMENTOS
// =============================================================

function renderizarPagamentos(
    pagamentos
) {

    const container =
        document.getElementById(
            "listaPagamentos"
        ) ||
        document.getElementById(
            "pagamentosLista"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!pagamentos.length) {

        container.innerHTML = `
            <div class="empty-state">
                <p>
                    Nenhum pagamento encontrado.
                </p>
            </div>
        `;

        return;

    }

    pagamentos.forEach(
        pagamento => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "pagamento-card";

            item.innerHTML = `

                <div>

                    <strong>
                        ${escaparHtml(
                            pagamento.plano_nome ||
                            pagamento.plano_codigo ||
                            "Plano"
                        )}
                    </strong>

                    <p>
                        Modelo:
                        ${escaparHtml(
                            pagamento.modelo_id ||
                            "Não informado"
                        )}
                    </p>

                    <p>
                        Valor:
                        R$
                        ${escaparHtml(
                            String(
                                pagamento.valor ??
                                "0,00"
                            )
                        )}
                    </p>

                    <p>
                        Status:
                        ${escaparHtml(
                            pagamento.status ||
                            "Não informado"
                        )}
                    </p>

                </div>

            `;

            container.appendChild(
                item
            );

        }
    );

}


// =============================================================
// EVENTOS DO MENU
// =============================================================

function configurarMenuAdmin() {

    const botoes =
        document.querySelectorAll(
            "[data-admin-target]"
        );

    botoes.forEach(
        botao => {

            botao.addEventListener(
                "click",
                evento => {

                    evento.preventDefault();

                    const alvo =
                        botao.dataset.adminTarget;

                    abrirSecaoAdmin(
                        alvo
                    );

                }
            );

        }
    );

}


// =============================================================
// CONFIGURAÇÃO DOS FILTROS
// =============================================================

function configurarFiltros() {

    const selectStatus =
        document.getElementById(
            "filtroStatus"
        );

    if (selectStatus) {

        selectStatus.addEventListener(
            "change",
            evento => {

                aplicarFiltroStatus(
                    evento.target.value
                );

            }
        );

    }

    const campoPesquisa =
        document.getElementById(
            "pesquisaModelos"
        ) ||
        document.getElementById(
            "buscarModelos"
        );

    if (campoPesquisa) {

        campoPesquisa.addEventListener(
            "input",
            evento => {

                pesquisarModelos(
                    evento.target.value
                );

            }
        );

    }

}


// =============================================================
// CONFIGURAÇÃO DOS BOTÕES
// =============================================================

function configurarBotoesAdmin() {

    const atualizar =
        document.getElementById(
            "btnAtualizar"
        ) ||
        document.getElementById(
            "btnAtualizarPainel"
        );

    if (atualizar) {

        atualizar.addEventListener(
            "click",
            async () => {

                await recarregarPainel();

            }
        );

    }

    const fechar =
        document.querySelectorAll(
            "[data-fechar-modal]"
        );

    fechar.forEach(
        botao => {

            botao.addEventListener(
                "click",
                () => {

                    fecharModal();

                }
            );

        }
    );

}


// =============================================================
// INICIALIZAÇÃO DOS EVENTOS
// =============================================================

function inicializarEventosAdmin() {

    configurarMenuAdmin();

    configurarFiltros();

    configurarBotoesAdmin();

}


// =============================================================
// INICIALIZAÇÃO COMPLETA
// =============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        inicializarEventosAdmin();

    }
);


// =============================================================
// EXPORTAÇÕES ADICIONAIS
// =============================================================

window.abrirSecaoAdmin =
    abrirSecaoAdmin;

window.abrirModuloModelos =
    abrirModuloModelos;

window.abrirModuloUsuarios =
    abrirModuloUsuarios;

window.abrirModuloReclamacoes =
    abrirModuloReclamacoes;

window.abrirModuloEstatisticas =
    abrirModuloEstatisticas;

window.abrirModuloPagamentos =
    abrirModuloPagamentos;

window.carregarPagamentos =
    carregarPagamentos;


// =============================================================
// FUNÇÕES DE USUÁRIOS
// =============================================================

async function atualizarStatusUsuario(
    id,
    status
) {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return;
    }

    try {

        const resultado =
            await supabase
                .from("perfis")
                .update({
                    status:
                        status
                })
                .eq(
                    "id",
                    id
                );

        if (resultado.error) {

            console.error(
                "Erro ao atualizar usuário:",
                resultado.error
            );

            alert(
                "Não foi possível atualizar o usuário."
            );

            return;

        }

        await carregarUsuarios();

        await carregarEstatisticas();

    } catch (erro) {

        console.error(
            erro
        );

    }

}


// =============================================================
// EXIBIR USUÁRIO
// =============================================================

function abrirFichaUsuario(
    usuario
) {

    if (!usuario) {
        return;
    }

    const modal =
        document.getElementById(
            "modalUsuario"
        );

    if (!modal) {
        return;
    }

    const conteudo =
        modal.querySelector(
            ".modal-content"
        ) ||
        modal;

    conteudo.innerHTML = `

        <div class="ficha-usuario">

            <button
                type="button"
                onclick="
                    document.getElementById(
                        'modalUsuario'
                    ).style.display='none'
                "
            >
                ×
            </button>

            <h2>
                ${escaparHtml(
                    usuario.nome ||
                    "Usuário"
                )}
            </h2>

            <p>
                <strong>ID:</strong>
                ${escaparHtml(
                    usuario.id ||
                    ""
                )}
            </p>

            <p>
                <strong>Tipo:</strong>
                ${escaparHtml(
                    usuario.tipo ||
                    "Não informado"
                )}
            </p>

            <p>
                <strong>Status:</strong>
                ${escaparHtml(
                    usuario.status ||
                    "Não informado"
                )}
            </p>

            <p>
                <strong>Criado em:</strong>
                ${formatarDataHora(
                    usuario.criado_em
                )}
            </p>

        </div>

    `;

    modal.style.display =
        "flex";

}


// =============================================================
// FUNÇÕES DE RECLAMAÇÕES
// =============================================================

async function atualizarStatusReclamacao(
    id,
    status
) {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return;
    }

    try {

        const resultado =
            await supabase
                .from(
                    "reclamacoes"
                )
                .update({
                    status:
                        status,
                    atualizado_em:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    id
                );

        if (resultado.error) {

            console.error(
                "Erro ao atualizar reclamação:",
                resultado.error
            );

            alert(
                "Não foi possível atualizar a reclamação."
            );

            return;

        }

        await carregarReclamacoes();

    } catch (erro) {

        console.error(
            erro
        );

    }

}


// =============================================================
// ABRIR RECLAMAÇÃO
// =============================================================

function abrirReclamacao(
    reclamacao
) {

    if (!reclamacao) {
        return;
    }

    const modal =
        document.getElementById(
            "modalReclamacao"
        );

    if (!modal) {
        return;
    }

    const conteudo =
        modal.querySelector(
            ".modal-content"
        ) ||
        modal;

    conteudo.innerHTML = `

        <div class="ficha-reclamacao">

            <button
                type="button"
                onclick="
                    document.getElementById(
                        'modalReclamacao'
                    ).style.display='none'
                "
            >
                ×
            </button>

            <h2>
                ${escaparHtml(
                    reclamacao.assunto ||
                    "Reclamação"
                )}
            </h2>

            <p>
                <strong>
                    Usuário:
                </strong>
                ${escaparHtml(
                    reclamacao.login ||
                    "Não informado"
                )}
            </p>

            <p>
                <strong>
                    E-mail:
                </strong>
                ${escaparHtml(
                    reclamacao.email ||
                    "Não informado"
                )}
            </p>

            <p>
                <strong>
                    Status:
                </strong>
                ${escaparHtml(
                    reclamacao.status ||
                    "Não informado"
                )}
            </p>

            <div>
                <strong>
                    Mensagem:
                </strong>

                <p>
                    ${escaparHtml(
                        reclamacao.mensagem ||
                        ""
                    )}
                </p>
            </div>

        </div>

    `;

    modal.style.display =
        "flex";

}


// =============================================================
// MODAL DE CONFIRMAÇÃO
// =============================================================

function confirmarAcao(
    mensagem
) {

    return window.confirm(
        mensagem ||
        "Tem certeza que deseja continuar?"
    );

}


// =============================================================
// LOGOUT ADMIN
// =============================================================

async function sairAdmin() {

    const supabase =
        obterSupabase();

    if (
        supabase &&
        typeof supabase.auth?.signOut ===
        "function"
    ) {

        try {

            await supabase.auth.signOut();

        } catch (erro) {

            console.error(
                "Erro ao sair:",
                erro
            );

        }

    }

    window.location.href =
        "acesso-admin.html";

}


// =============================================================
// VERIFICAR SESSÃO ADMIN
// =============================================================

async function verificarSessaoAdmin() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return false;
    }

    try {

        const resultado =
            await supabase.auth.getUser();

        const usuario =
            resultado?.data?.user;

        if (!usuario) {

            window.location.href =
                "acesso-admin.html";

            return false;

        }

        const email =
            String(
                usuario.email || ""
            )
            .toLowerCase()
            .trim();

        const emailAdmin =
            String(
                window.LUX_ADMIN_EMAIL ||
                ""
            )
            .toLowerCase()
            .trim();

        if (
            emailAdmin &&
            email !== emailAdmin
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


// =============================================================
// INICIAR VERIFICAÇÃO
// =============================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        await verificarSessaoAdmin();

    }
);


// =============================================================
// FUNÇÃO DE TESTE DO BANCO
// =============================================================

async function testarBancoAdmin() {

    const supabase =
        obterSupabase();

    if (!supabase) {

        console.error(
            "Supabase indisponível."
        );

        return;

    }

    try {

        const resultado =
            await supabase
                .from(
                    "modelo_perfis"
                )
                .select(
                    "id,nome_exibicao,verificacao_status"
                )
                .limit(5);

        if (resultado.error) {

            console.error(
                "Teste do banco falhou:",
                resultado.error
            );

            return;

        }

        console.log(
            "Teste do banco:",
            resultado.data
        );

    } catch (erro) {

        console.error(
            "Erro no teste:",
            erro
        );

    }

}


// =============================================================
// EXPOSIÇÃO GLOBAL
// =============================================================

window.atualizarStatusUsuario =
    atualizarStatusUsuario;

window.abrirFichaUsuario =
    abrirFichaUsuario;

window.atualizarStatusReclamacao =
    atualizarStatusReclamacao;

window.abrirReclamacao =
    abrirReclamacao;

window.confirmarAcao =
    confirmarAcao;

window.sairAdmin =
    sairAdmin;

window.verificarSessaoAdmin =
    verificarSessaoAdmin;

window.testarBancoAdmin =
    testarBancoAdmin;


// =============================================================
// BLOCO DE COMPATIBILIDADE
// =============================================================

function carregarPreCadastros() {

    return carregarModelos();

}


function renderizarPreCadastros(
    dados
) {

    return renderizarModelos(
        dados
    );

}


function aprovarPreCadastro(
    id
) {

    return aprovarModelo(
        id
    );

}


function reprovarPreCadastro(
    id
) {

    return reprovarModelo(
        id
    );

}


window.carregarPreCadastros =
    carregarPreCadastros;

window.renderizarPreCadastros =
    renderizarPreCadastros;

window.aprovarPreCadastro =
    aprovarPreCadastro;

window.reprovarPreCadastro =
    reprovarPreCadastro;


// =============================================================
// INICIALIZAÇÃO FINAL
// =============================================================

(async function () {

    try {

        if (
            document.readyState ===
            "loading"
        ) {

            return;

        }

        const ok =
            await verificarSessaoAdmin();

        if (!ok) {
            return;
        }

        await carregarModelos();

    } catch (erro) {

        console.error(
            "Falha na inicialização final:",
            erro
        );

    }

})();


// =============================================================
// BLOCO DE COMPATIBILIDADE COM HTML ANTIGO
// =============================================================

function abrirModalModelo(
    id
) {

    return abrirFichaModelo(
        id
    );

}


function fecharModalModelo() {

    return fecharFichaModelo();

}


function atualizarListaModelos() {

    return carregarModelos();

}


window.abrirModalModelo =
    abrirModalModelo;

window.fecharModalModelo =
    fecharModalModelo;

window.atualizarListaModelos =
    atualizarListaModelos;


// =============================================================
// FUNÇÃO DE SEGURANÇA PARA CAMPOS AUSENTES
// =============================================================

function valorSeguro(
    valor,
    padrao
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return padrao ||
            "Não informado";

    }

    return valor;

}


// =============================================================
// DADOS COMPLETOS DA FICHA
// =============================================================

function montarFichaCompleta(
    modelo
) {

    if (!modelo) {
        return "";
    }

    return {

        identificacao: {
            id:
                valorSeguro(
                    modelo.id,
                    ""
                ),

            nome:
                valorSeguro(
                    modelo.nome_exibicao
                ),

            apelido:
                valorSeguro(
                    modelo.apelido
                ),

            categoria:
                valorSeguro(
                    modelo.categoria_catalogo
                )
        },

        contato: {
            whatsapp:
                valorSeguro(
                    modelo.whatsapp
                )
        },

        documentos: {
            cpf:
                valorSeguro(
                    modelo.cpf
                ),

            nascimento:
                valorSeguro(
                    modelo.data_nascimento
                ),

            idade:
                valorSeguro(
                    modelo.idade
                )
        },

        endereco: {
            cep:
                valorSeguro(
                    modelo.cep
                ),

            estado:
                valorSeguro(
                    modelo.estado
                ),

            cidade:
                valorSeguro(
                    modelo.cidade
                ),

            bairro:
                valorSeguro(
                    modelo.bairro
                ),

            rua:
                valorSeguro(
                    modelo.endereco
                ),

            numero:
                valorSeguro(
                    modelo.numero
                ),

            complemento:
                valorSeguro(
                    modelo.complemento
                ),

            pais:
                valorSeguro(
                    modelo.pais
                )
        },

        caracteristicas: {
            altura:
                valorSeguro(
                    modelo.altura_cm
                ),

            cabelo:
                valorSeguro(
                    modelo.cor_cabelo
                ),

            olhos:
                valorSeguro(
                    modelo.cor_olhos
                ),

            idiomas:
                valorSeguro(
                    modelo.idiomas
                )
        },

        descricao:
            valorSeguro(
                modelo.descricao
            ),

        foto:
            valorSeguro(
                modelo.foto_url,
                "./logo.png"
            ),

        galeria:
            modelo.galeria_urls ||
            [],

        status:
            valorSeguro(
                modelo.verificacao_status
            ),

        plano:
            valorSeguro(
                modelo.plano
            ),

        maioridade:
            Boolean(
                modelo.maioridade_confirmada
            ),

        criado:
            modelo.criado_em,

        atualizado:
            modelo.atualizado_em

    };

}


// =============================================================
// EXPORTAÇÃO DA FICHA COMPLETA
// =============================================================

window.montarFichaCompleta =
    montarFichaCompleta;


// =============================================================
// CONTROLE DE STATUS DOS MODELOS
// =============================================================

function obterTextoStatus(
    status
) {

    switch (
        String(
            status || ""
        ).toLowerCase()
    ) {

        case "pendente":
            return "Pendente";

        case "aprovado":
            return "Aprovado";

        case "verificada":
            return "Verificada";

        case "reprovado":
            return "Reprovado";

        case "bloqueado":
            return "Bloqueado";

        default:
            return (
                status ||
                "Não informado"
            );

    }

}


// =============================================================
// CLASSE CSS DO STATUS
// =============================================================

function obterClasseStatus(
    status
) {

    switch (
        String(
            status || ""
        ).toLowerCase()
    ) {

        case "pendente":
            return "status-pendente";

        case "aprovado":
            return "status-aprovado";

        case "verificada":
            return "status-verificada";

        case "reprovado":
            return "status-reprovado";

        case "bloqueado":
            return "status-bloqueado";

        default:
            return "status-desconhecido";

    }

}


// =============================================================
// EXPOR STATUS
// =============================================================

window.obterTextoStatus =
    obterTextoStatus;

window.obterClasseStatus =
    obterClasseStatus;


// =============================================================
// ATUALIZAÇÃO INDIVIDUAL
// =============================================================

async function atualizarStatusModelo(
    id,
    novoStatus
) {

    const supabase =
        obterSupabase();

    if (!supabase) {

        alert(
            "Supabase não está disponível."
        );

        return false;

    }

    if (!id) {

        alert(
            "ID do modelo não informado."
        );

        return false;

    }

    const statusPermitidos = [
        "pendente",
        "aprovado",
        "verificada",
        "reprovado",
        "bloqueado"
    ];

    if (
        !statusPermitidos.includes(
            novoStatus
        )
    ) {

        alert(
            "Status inválido."
        );

        return false;

    }

    try {

        const resultado =
            await supabase
                .from(
                    "modelo_perfis"
                )
                .update({
                    verificacao_status:
                        novoStatus,

                    atualizado_em:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    id
                );

        if (resultado.error) {

            console.error(
                "Erro ao atualizar status:",
                resultado.error
            );

            alert(
                "Não foi possível atualizar o status."
            );

            return false;

        }

        await carregarModelos();

        await carregarEstatisticas();

        return true;

    } catch (erro) {

        console.error(
            erro
        );

        return false;

    }

}


// =============================================================
// EXPORTAR ATUALIZAÇÃO DE STATUS
// =============================================================

window.atualizarStatusModelo =
    atualizarStatusModelo;


// =============================================================
// CARREGAR SOMENTE PENDENTES
// =============================================================

async function carregarModelosPendentes() {

    const supabase =
        obterSupabase();

    if (!supabase) {
        return [];
    }

    try {

        const resultado =
            await supabase
                .from(
                    "modelo_perfis"
                )
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
                .eq(
                    "verificacao_status",
                    "pendente"
                )
                .order(
                    "criado_em",
                    {
                        ascending: false
                    }
                );

        if (resultado.error) {

            console.error(
                "Erro ao buscar pendentes:",
                resultado.error
            );

            return [];

        }

        return resultado.data || [];

    } catch (erro) {

        console.error(
            erro
        );

        return [];

    }

}


// =============================================================
// EXPORTAR PENDENTES
// =============================================================

window.carregarModelosPendentes =
    carregarModelosPendentes;


// =============================================================
// TESTE ESPECÍFICO DE PENDENTES
// =============================================================

async function testarModelosPendentes() {

    const pendentes =
        await carregarModelosPendentes();

    console.log(
        "Modelos pendentes:",
        pendentes
    );

    return pendentes;

}


window.testarModelosPendentes =
    testarModelosPendentes;


// =============================================================
// MENSAGEM DE STATUS
// =============================================================

function mostrarMensagem(
    mensagem,
    tipo
) {

    const tiposPermitidos = [
        "success",
        "error",
        "warning",
        "info"
    ];

    const tipoFinal =
        tiposPermitidos.includes(
            tipo
        )
            ? tipo
            : "info";

    const existente =
        document.getElementById(
            "mensagemAdmin"
        );

    if (existente) {

        existente.textContent =
            mensagem;

        existente.className =
            `mensagem-admin ${tipoFinal}`;

        return;

    }

    const elemento =
        document.createElement(
            "div"
        );

    elemento.id =
        "mensagemAdmin";

    elemento.className =
        `mensagem-admin ${tipoFinal}`;

    elemento.textContent =
        mensagem;

    document.body.appendChild(
        elemento
    );

    setTimeout(
        () => {

            if (elemento) {

                elemento.remove();

            }

        },
        4000
    );

}


// =============================================================
// EXPORTAR MENSAGEM
// =============================================================

window.mostrarMensagem =
    mostrarMensagem;


// =============================================================
// FIM DA PARTE 2
// =============================================================
PARA ATRIBUTO
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
                        }

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
