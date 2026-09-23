/* =========================================================
   LUX ADVANCE — PAINEL ADMINISTRATIVO
   painel-admin.js
   ========================================================= */

(function () {
  "use strict";

  let listaModelos = [];
  let filtroAtual = "todos";
  let fichaAtual = null;

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  document.addEventListener("DOMContentLoaded", async function () {

    if (!window.luxSupabase) {
      console.error("Supabase não foi inicializado.");
      mostrarErroInicializacao(
        "Supabase não foi inicializado. Verifique o config.js."
      );
      return;
    }

    configurarFiltros();

    await carregarModelos();
    atualizarDashboard();

  });


  /* =========================================================
     MENSAGEM DE ERRO
     ========================================================= */

  function mostrarErroInicializacao(mensagem) {

    const lista = document.getElementById("lista-precadastros");

    if (lista) {
      lista.innerHTML = `
        <div style="
          padding:25px;
          text-align:center;
          border:1px solid rgba(255,77,166,.35);
          border-radius:16px;
          background:rgba(255,77,166,.08);
          color:#fff;
        ">
          <strong style="color:#ff4da6;">
            Erro no sistema
          </strong>

          <p style="margin-top:10px;color:#ddd;">
            ${escaparHTML(mensagem)}
          </p>
        </div>
      `;
    }
  }


  /* =========================================================
     CARREGAR PRÉ-CADASTROS
     ========================================================= */

  async function carregarModelos() {

    const lista = document.getElementById("lista-precadastros");

    if (!lista) {
      console.warn("Elemento #lista-precadastros não encontrado.");
      return;
    }

    lista.innerHTML = `
      <div style="
        padding:30px;
        text-align:center;
        color:#ddd;
      ">
        Carregando cadastros...
      </div>
    `;

    try {

      const {
        data,
        error
      } = await window.luxSupabase
        .from("pre_cadastros_modelos")
        .select("*")
        .order("criado_em", {
          ascending: false
        });

      if (error) {
        console.error("Erro ao carregar modelos:", error);

        lista.innerHTML = `
          <div style="
            padding:25px;
            text-align:center;
            border:1px solid rgba(255,77,166,.35);
            border-radius:16px;
            background:rgba(255,77,166,.06);
            color:#fff;
          ">
            <strong style="color:#ff4da6;">
              Não foi possível carregar os cadastros.
            </strong>

            <p style="
              margin-top:10px;
              color:#aaa;
              font-size:13px;
            ">
              ${escaparHTML(error.message || "Erro desconhecido")}
            </p>
          </div>
        `;

        return;
      }

      listaModelos = Array.isArray(data) ? data : [];

      renderizarModelos();

      atualizarDashboard();

    } catch (erro) {

      console.error(erro);

      lista.innerHTML = `
        <div style="
          padding:25px;
          text-align:center;
          color:#fff;
        ">
          Erro inesperado ao carregar os cadastros.
        </div>
      `;
    }
  }


  /* =========================================================
     RENDERIZAR MODELOS
     ========================================================= */

  function renderizarModelos() {

    const lista = document.getElementById("lista-precadastros");

    if (!lista) return;

    let modelos = listaModelos.filter(function (modelo) {

      const status = normalizarStatus(modelo.status);

      if (filtroAtual === "todos") {
        return true;
      }

      return status === filtroAtual;

    });


    if (!modelos.length) {

      lista.innerHTML = `
        <div style="
          padding:35px 20px;
          text-align:center;
          border:1px solid rgba(255,255,255,.08);
          border-radius:18px;
          background:rgba(255,255,255,.025);
        ">

          <div style="
            font-size:40px;
            margin-bottom:12px;
          ">
            ♢
          </div>

          <strong style="
            color:#f8d58a;
            font-size:18px;
          ">
            Nenhum cadastro encontrado
          </strong>

          <p style="
            color:#aaa;
            margin-top:8px;
          ">
            Não existem cadastros para este filtro.
          </p>

        </div>
      `;

      return;
    }


    lista.innerHTML = modelos.map(function (modelo) {

      const nome =
        modelo.nome ||
        modelo.nome_completo ||
        "Sem nome";

      const apelido =
        modelo.apelido ||
        modelo.nickname ||
        modelo.nome_artistico ||
        "";

      const cidade =
        modelo.cidade ||
        "Não informada";

      const whatsapp =
        modelo.whatsapp ||
        modelo.telefone ||
        modelo.celular ||
        "Não informado";

      const email =
        modelo.email ||
        "Não informado";

      const status =
        normalizarStatus(modelo.status);

      return `
        <div class="card-modelo" style="
          position:relative;
          padding:20px;
          margin-bottom:15px;
          border:1px solid rgba(248,213,138,.18);
          border-radius:18px;
          background:
            linear-gradient(
              145deg,
              rgba(255,255,255,.045),
              rgba(255,255,255,.015)
            );
          box-shadow:0 10px 30px rgba(0,0,0,.18);
        ">

          <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:15px;
            flex-wrap:wrap;
          ">

            <div style="flex:1;min-width:220px;">

              <div style="
                color:#f8d58a;
                font-size:20px;
                font-weight:bold;
                margin-bottom:5px;
              ">
                ${escaparHTML(nome)}
              </div>

              ${
                apelido
                  ? `
                    <div style="
                      color:#ff4da6;
                      font-size:14px;
                      margin-bottom:10px;
                    ">
                      ${escaparHTML(apelido)}
                    </div>
                  `
                  : ""
              }

              <div style="
                color:#ccc;
                font-size:13px;
                line-height:1.8;
              ">

                <div>
                  <strong>Cidade:</strong>
                  ${escaparHTML(cidade)}
                </div>

                <div>
                  <strong>WhatsApp:</strong>
                  ${escaparHTML(whatsapp)}
                </div>

                <div>
                  <strong>E-mail:</strong>
                  ${escaparHTML(email)}
                </div>

              </div>

            </div>


            <div style="
              display:flex;
              flex-direction:column;
              align-items:flex-end;
              gap:10px;
            ">

              ${badgeStatus(status)}

              <button
                type="button"
                onclick="verFichaModelo('${escaparAtributo(modelo.id)}')"
                style="
                  border:1px solid rgba(248,213,138,.4);
                  background:rgba(248,213,138,.08);
                  color:#f8d58a;
                  padding:10px 15px;
                  border-radius:10px;
                  cursor:pointer;
                  font-weight:bold;
                "
              >
                VER FICHA
              </button>

            </div>

          </div>

        </div>
      `;

    }).join("");

  }


  /* =========================================================
     STATUS
     ========================================================= */

  function normalizarStatus(status) {

    if (!status) {
      return "pendente";
    }

    const valor = String(status)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (
      valor === "aprovado" ||
      valor === "aprovada"
    ) {
      return "aprovado";
    }

    if (
      valor === "rejeitado" ||
      valor === "rejeitada" ||
      valor === "recusado" ||
      valor === "recusada"
    ) {
      return "rejeitado";
    }

    return "pendente";
  }


  function badgeStatus(status) {

    if (status === "aprovado") {

      return `
        <span style="
          display:inline-block;
          padding:6px 12px;
          border-radius:20px;
          background:rgba(60,190,120,.12);
          border:1px solid rgba(60,190,120,.3);
          color:#70e0a0;
          font-size:12px;
          font-weight:bold;
        ">
          ✓ APROVADO
        </span>
      `;
    }


    if (status === "rejeitado") {

      return `
        <span style="
          display:inline-block;
          padding:6px 12px;
          border-radius:20px;
          background:rgba(255,80,80,.10);
          border:1px solid rgba(255,80,80,.3);
          color:#ff8a8a;
          font-size:12px;
          font-weight:bold;
        ">
          ✕ REJEITADO
        </span>
      `;
    }


    return `
      <span style="
        display:inline-block;
        padding:6px 12px;
        border-radius:20px;
        background:rgba(248,213,138,.08);
        border:1px solid rgba(248,213,138,.3);
        color:#f8d58a;
        font-size:12px;
        font-weight:bold;
      ">
        ◷ PENDENTE
      </span>
    `;
  }


  /* =========================================================
     FILTROS
     ========================================================= */

  function configurarFiltros() {

    const botoes =
      document.querySelectorAll(".btn-filtro");

    botoes.forEach(function (botao) {

      botao.addEventListener("click", function () {

        botoes.forEach(function (b) {
          b.classList.remove("ativo");
        });

        botao.classList.add("ativo");

        filtroAtual =
          botao.dataset.filtro ||
          "todos";

        renderizarModelos();

      });

    });

  }


  /* =========================================================
     DASHBOARD
     ========================================================= */

  function atualizarDashboard() {

    const total =
      listaModelos.length;

    const pendentes =
      listaModelos.filter(function (modelo) {
        return normalizarStatus(modelo.status) === "pendente";
      }).length;

    const aprovados =
      listaModelos.filter(function (modelo) {
        return normalizarStatus(modelo.status) === "aprovado";
      }).length;

    const rejeitados =
      listaModelos.filter(function (modelo) {
        return normalizarStatus(modelo.status) === "rejeitado";
      }).length;


    atualizarElemento("resumoTotal", total);
    atualizarElemento("resumoPendentes", pendentes);
    atualizarElemento("resumoAprovados", aprovados);
    atualizarElemento("resumoRejeitados", rejeitados);

  }


  function atualizarElemento(id, valor) {

    const elemento =
      document.getElementById(id);

    if (elemento) {
      elemento.textContent = valor;
    }

  }


  /* =========================================================
     VER FICHA
     ========================================================= */

  window.verFichaModelo = function (id) {

    const modelo =
      listaModelos.find(function (item) {
        return String(item.id) === String(id);
      });

    if (!modelo) {
      alert("Cadastro não encontrado.");
      return;
    }

    fichaAtual = modelo;

    const modal =
      document.getElementById("modal-ver-ficha");

    const corpo =
      document.getElementById("corpo-ficha");

    if (!modal || !corpo) {
      alert("Modal da ficha não encontrado no painel.");
      return;
    }


    const nome =
      modelo.nome ||
      modelo.nome_completo ||
      "Não informado";

    const apelido =
      modelo.apelido ||
      modelo.nickname ||
      modelo.nome_artistico ||
      "Não informado";

    const status =
      normalizarStatus(modelo.status);


    corpo.innerHTML = `

      <div style="
        display:grid;
        gap:12px;
      ">

        ${campoFicha("Nome", nome)}

        ${campoFicha("Apelido / Nome artístico", apelido)}

        ${campoFicha("WhatsApp", modelo.whatsapp)}

        ${campoFicha("Telefone", modelo.telefone)}

        ${campoFicha("E-mail", modelo.email)}

        ${campoFicha("Idade", modelo.idade)}

        ${campoFicha("Altura", modelo.altura)}

        ${campoFicha("Cidade", modelo.cidade)}

        ${campoFicha("Endereço", modelo.endereco)}

        ${campoFicha("CEP", modelo.cep)}

        ${campoFicha("Estado", modelo.estado)}

        ${campoFicha("CPF", modelo.cpf)}

        ${campoFicha("Instagram", modelo.instagram)}

        ${campoFicha("Status", status.toUpperCase())}

        ${campoFicha(
          "Data do cadastro",
          formatarData(modelo.criado_em)
        )}

        ${campoFicha(
          "Última atualização",
          formatarData(modelo.atualizado_em)
        )}

      </div>

    `;


    const botaoAprovar =
      document.getElementById("botao-aprovar");

    const botaoRejeitar =
      document.getElementById("botao-rejeitar");


    if (botaoAprovar) {

      botaoAprovar.style.display =
        status === "aprovado"
          ? "none"
          : "inline-block";

    }


    if (botaoRejeitar) {

      botaoRejeitar.style.display =
        status === "rejeitado"
          ? "none"
          : "inline-block";

    }


    modal.style.display = "flex";

  };


  /* =========================================================
     CAMPO DA FICHA
     ========================================================= */

  function campoFicha(titulo, valor) {

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      valor = "Não informado";
    }

    return `
      <div style="
        padding:12px 14px;
        border-radius:10px;
        background:rgba(255,255,255,.035);
        border:1px solid rgba(255,255,255,.06);
      ">

        <div style="
          color:#f8d58a;
          font-size:11px;
          text-transform:uppercase;
          letter-spacing:.08em;
          margin-bottom:4px;
        ">
          ${escaparHTML(titulo)}
        </div>

        <div style="
          color:#fff;
          font-size:14px;
          word-break:break-word;
        ">
          ${escaparHTML(String(valor))}
        </div>

      </div>
    `;
  }


  /* =========================================================
     APROVAR MODELO
     ========================================================= */

  window.aprovarModelo = async function () {

    await alterarStatusModelo("aprovado");

  };


  /* =========================================================
     REJEITAR MODELO
     ========================================================= */

  window.rejeitarModelo = async function () {

    await alterarStatusModelo("rejeitado");

  };


  /* =========================================================
     ALTERAR STATUS
     ========================================================= */

  async function alterarStatusModelo(novoStatus) {

    if (!fichaAtual) {
      alert("Nenhum cadastro selecionado.");
      return;
    }


    const nome =
      fichaAtual.nome ||
      fichaAtual.nome_completo ||
      "modelo";


    const mensagem =
      novoStatus === "aprovado"
        ? `Deseja aprovar o cadastro de ${nome}?`
        : `Deseja rejeitar o cadastro de ${nome}?`;


    if (!confirm(mensagem)) {
      return;
    }


    try {

      const atualizacao = {
        status: novoStatus,
        atualizado_em: new Date().toISOString()
      };


      const {
        data,
        error
      } = await window.luxSupabase
        .from("pre_cadastros_modelos")
        .update(atualizacao)
        .eq("id", fichaAtual.id)
        .select()
        .single();


      if (error) {

        console.error(
          "Erro ao atualizar cadastro:",
          error
        );

        alert(
          "Não foi possível atualizar o cadastro.\n\n" +
          error.message
        );

        return;
      }


      fichaAtual = data || {
        ...fichaAtual,
        ...atualizacao
      };


      const indice =
        listaModelos.findIndex(function (item) {
          return String(item.id) === String(fichaAtual.id);
        });


      if (indice !== -1) {
        listaModelos[indice] =
          fichaAtual;
      }


      atualizarDashboard();
      renderizarModelos();


      const modal =
        document.getElementById("modal-ver-ficha");

      if (modal) {
        modal.style.display = "none";
      }


      alert(
        novoStatus === "aprovado"
          ? "Cadastro aprovado com sucesso."
          : "Cadastro rejeitado com sucesso."
      );

    } catch (erro) {

      console.error(erro);

      alert(
        "Ocorreu um erro ao atualizar o cadastro."
      );

    }

  }


  /* =========================================================
     FECHAR MODAL
     ========================================================= */

  window.fecharModalFicha = function () {

    const modal =
      document.getElementById("modal-ver-ficha");

    if (modal) {
      modal.style.display = "none";
    }

    fichaAtual = null;

  };


  /* =========================================================
     IMPRIMIR FICHA
     ========================================================= */

  window.imprimirFicha = function () {

    if (!fichaAtual) {
      alert("Nenhuma ficha selecionada.");
      return;
    }


    const nome =
      fichaAtual.nome ||
      fichaAtual.nome_completo ||
      "Modelo";


    const conteudo = `

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Ficha — ${escaparHTML(nome)}
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            padding: 30px;
            color: #111;
          }

          h1 {
            text-align: center;
            margin-bottom: 30px;
          }

          .campo {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }

          .titulo {
            font-weight: bold;
            display: inline-block;
            width: 220px;
          }

        </style>

      </head>

      <body>

        <h1>LUX ADVANCE — FICHA CADASTRAL</h1>

        ${campoImpressao("Nome", fichaAtual.nome)}
        ${campoImpressao("Apelido", fichaAtual.apelido || fichaAtual.nickname)}
        ${campoImpressao("WhatsApp", fichaAtual.whatsapp)}
        ${campoImpressao("Telefone", fichaAtual.telefone)}
        ${campoImpressao("E-mail", fichaAtual.email)}
        ${campoImpressao("Idade", fichaAtual.idade)}
        ${campoImpressao("Altura", fichaAtual.altura)}
        ${campoImpressao("Cidade", fichaAtual.cidade)}
        ${campoImpressao("Endereço", fichaAtual.endereco)}
        ${campoImpressao("CEP", fichaAtual.cep)}
        ${campoImpressao("Estado", fichaAtual.estado)}
        ${campoImpressao("CPF", fichaAtual.cpf)}
        ${campoImpressao("Instagram", fichaAtual.instagram)}
        ${campoImpressao("Status", fichaAtual.status)}
        ${campoImpressao("Cadastro", formatarData(fichaAtual.criado_em))}

      </body>

      </html>

    `;


    const janela =
      window.open("", "_blank");


    if (!janela) {
      alert(
        "O navegador bloqueou a janela de impressão. Permita pop-ups para este site."
      );
      return;
    }


    janela.document.open();
    janela.document.write(conteudo);
    janela.document.close();


    janela.onload = function () {
      janela.print();
    };

  };


  function campoImpressao(titulo, valor) {

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {
      valor = "Não informado";
    }

    return `
      <div class="campo">
        <span class="titulo">
          ${escaparHTML(titulo)}:
        </span>

        ${escaparHTML(String(valor))}
      </div>
    `;
  }


  /* =========================================================
     MÓDULOS ADMINISTRATIVOS
     ========================================================= */

  window.abrirModuloAdmin = async function (
    titulo,
    texto
  ) {

    const tituloNormalizado =
      normalizarTexto(titulo);


    if (
      tituloNormalizado.includes("avaliacoes")
    ) {

      await abrirModuloAvaliacoes();
      return;

    }


    if (
      tituloNormalizado.includes("reclamacoes")
    ) {

      await abrirModuloReclamacoes();
      return;

    }


    if (
      tituloNormalizado.includes("assinaturas")
    ) {

      await abrirModuloAssinaturas();
      return;

    }


    if (
      tituloNormalizado.includes("planos")
    ) {

      abrirModuloPlanos();
      return;

    }


    if (
      tituloNormalizado.includes("doacoes")
    ) {

      abrirModuloDoacoes();
      return;

    }


    if (
      tituloNormalizado.includes("pagamentos")
    ) {

      abrirModuloPagamentos();
      return;

    }


    if (
      tituloNormalizado.includes("usuarios")
    ) {

      abrirModuloUsuarios();
      return;

    }


    mostrarModalGenerico(
      titulo,
      texto ||
      "Módulo administrativo disponível."
    );

  };


  /* =========================================================
     AVALIAÇÕES
     ========================================================= */

  async function abrirModuloAvaliacoes() {

    try {

      const {
        data,
        error
      } = await window.luxSupabase
        .from("avaliacoes_modelos_admin")
        .select("*")
        .order("criado_em", {
          ascending: false
        });


      if (error) {
        mostrarModalGenerico(
          "AVALIAÇÕES",
          "Não foi possível carregar as avaliações.\n\n" +
          error.message
        );
        return;
      }


      if (!data || !data.length) {

        mostrarModalGenerico(
          "AVALIAÇÕES",
          "Nenhuma avaliação registrada até o momento."
        );

        return;
      }


      const html = data.map(function (item) {

        const nota =
          Number(item.estrelas ?? item.nota ?? 0);


        const estrelas =
          "★".repeat(Math.max(0, Math.min(5, nota))) +
          "☆".repeat(Math.max(0, 5 - nota));


        return `
          <div style="
            padding:16px;
            margin-bottom:12px;
            border:1px solid rgba(248,213,138,.15);
            border-radius:14px;
            background:rgba(255,255,255,.03);
          ">

            <div style="
              color:#f8d58a;
              font-size:20px;
              letter-spacing:3px;
            ">
              ${estrelas}
            </div>

            <div style="
              color:#fff;
              margin-top:8px;
            ">
              ${escaparHTML(
                item.comentario ||
                "Sem comentário."
              )}
            </div>

            <div style="
              color:#aaa;
              font-size:12px;
              margin-top:8px;
            ">
              ${formatarData(item.criado_em)}
            </div>

          </div>
        `;

      }).join("");


      mostrarModalGenerico(
        "AVALIAÇÕES",
        html,
        true
      );

    } catch (erro) {

      console.error(erro);

      mostrarModalGenerico(
        "AVALIAÇÕES",
        "Erro inesperado ao carregar avaliações."
      );

    }

  }


  /* =========================================================
     RECLAMAÇÕES
     ========================================================= */

  async function abrirModuloReclamacoes() {

    try {

      const {
        data,
        error
      } = await window.luxSupabase
        .from("reclamacoes_admin")
        .select("*")
        .order("criado_em", {
          ascending: false
        });


      if (error) {

        mostrarModalGenerico(
          "RECLAMAÇÕES",
          "Não foi possível carregar as reclamações.\n\n" +
          error.message
        );

        return;
      }


      if (!data || !data.length) {

        mostrarModalGenerico(
          "RECLAMAÇÕES",
          "Nenhuma reclamação registrada até o momento."
        );

        return;
      }


      const html = data.map(function (item) {

        return `
          <div style="
            padding:17px;
            margin-bottom:12px;
            border:1px solid rgba(255,77,166,.15);
            border-radius:14px;
            background:rgba(255,255,255,.025);
          ">

            <div style="
              color:#f8d58a;
              font-weight:bold;
              margin-bottom:8px;
            ">
              ${escaparHTML(
                item.assunto ||
                "Sem assunto"
              )}
            </div>

            <div style="
              color:#ddd;
              line-height:1.6;
            ">
              ${escaparHTML(
                item.mensagem ||
                "Sem mensagem."
              )}
            </div>

            <div style="
              color:#aaa;
              font-size:12px;
              margin-top:10px;
            ">
              Status:
              ${escaparHTML(
                item.status ||
                "Pendente"
              )}
            </div>

            <div style="
              color:#777;
              font-size:11px;
              margin-top:5px;
            ">
              ${formatarData(item.criado_em)}
            </div>

          </div>
        `;

      }).join("");


      mostrarModalGenerico(
        "RECLAMAÇÕES",
        html,
        true
      );

    } catch (erro) {

      console.error(erro);

      mostrarModalGenerico(
        "RECLAMAÇÕES",
        "Erro inesperado ao carregar reclamações."
      );

    }

  }


  /* =========================================================
     ASSINATURAS
     ========================================================= */

  async function abrirModuloAssinaturas() {

    try {

      const {
        data,
        error
      } = await window.luxSupabase
        .from("assinaturas_admin")
        .select("*")
        .order("criado_em", {
          ascending: false
        });


      if (error) {

        mostrarModalGenerico(
          "ASSINATURAS",
          "Não foi possível carregar as assinaturas.\n\n" +
          error.message
        );

        return;
      }


      if (!data || !data.length) {

        mostrarModalGenerico(
          "ASSINATURAS",
          "Nenhuma assinatura registrada até o momento."
        );

        return;
      }


      const html = data.map(function (item) {

        return `
          <div style="
            padding:17px;
            margin-bottom:12px;
            border:1px solid rgba(248,213,138,.15);
            border-radius:14px;
            background:rgba(255,255,255,.025);
          ">

            <div style="
              color:#f8d58a;
              font-weight:bold;
              font-size:17px;
            ">
              ${escaparHTML(
                item.plano ||
                item.nome_plano ||
                "Plano"
              )}
            </div>

            <div style="
              color:#ddd;
              margin-top:7px;
            ">
              Status:
              ${escaparHTML(
                item.status ||
                "Não informado"
              )}
            </div>

            <div style="
              color:#aaa;
              font-size:12px;
              margin-top:7px;
            ">
              ${formatarData(item.criado_em)}
            </div>

          </div>
        `;

      }).join("");


      mostrarModalGenerico(
        "ASSINATURAS",
        html,
        true
      );

    } catch (erro) {

      console.error(erro);

      mostrarModalGenerico(
        "ASSINATURAS",
        "Erro inesperado ao carregar assinaturas."
      );

    }

  }


  /* =========================================================
     PLANOS
     ========================================================= */

  function abrirModuloPlanos() {

    const html = `

      <div style="
        display:grid;
        gap:12px;
      ">

        ${plano(
          "LUX-ESSENCE",
          "GRÁTIS",
          "Sua presença começa aqui.",
          [
            "Perfil básico",
            "Até 2 fotos",
            "1 vídeo"
          ]
        )}

        ${plano(
          "LUX-DESFIRE",
          "R$ 29,90 / mês",
          "Mais destaque para seu perfil.",
          [
            "Selo verificado",
            "Até 5 fotos",
            "Até 3 vídeos"
          ]
        )}

        ${plano(
          "LUX-ELITE",
          "R$ 59,90 / mês",
          "Experiência avançada.",
          [
            "Inclui DESFIRE",
            "WhatsApp secretário",
            "Suporte avançado",
            "Selo ELITE"
          ]
        )}

        ${plano(
          "LUX-ROYAL",
          "R$ 99,90 / mês",
          "Exclusividade e destaque.",
          [
            "Inclui ELITE",
            "Segurança",
            "Exclusividade",
            "Destaque"
          ]
        )}

      </div>

    `;


    mostrarModalGenerico(
      "PLANOS LUX",
      html,
      true
    );

  }


  function plano(
    nome,
    preco,
    descricao,
    recursos
  ) {

    return `
      <div style="
        padding:18px;
        border:1px solid rgba(248,213,138,.18);
        border-radius:16px;
        background:rgba(255,255,255,.025);
      ">

        <div style="
          color:#f8d58a;
          font-size:18px;
          font-weight:bold;
        ">
          ${nome}
        </div>

        <div style="
          color:#ff4da6;
          font-size:16px;
          margin-top:5px;
        ">
          ${preco}
        </div>

        <div style="
          color:#ddd;
          margin-top:7px;
        ">
          ${descricao}
        </div>

        <ul style="
          color:#aaa;
          line-height:1.8;
          padding-left:20px;
        ">
          ${recursos.map(function (item) {
            return `
              <li>
                ${escaparHTML(item)}
              </li>
            `;
          }).join("")}
        </ul>

      </div>
    `;

  }


  /* =========================================================
     DOAÇÕES
     ========================================================= */

  function abrirModuloDoacoes() {

    mostrarModalGenerico(
      "DOAÇÕES",
      `
        <p style="color:#ddd;line-height:1.7;">
          O módulo de doações está disponível para integração
          com o sistema Pix.
        </p>

        <p style="
          color:#f8d58a;
          margin-top:12px;
          line-height:1.7;
        ">
          Os registros de doação serão exibidos aqui quando
          houver uma tabela própria de doações no Supabase.
        </p>
      `,
      true
    );

  }


  /* =========================================================
     PAGAMENTOS
     ========================================================= */

  function abrirModuloPagamentos() {

    mostrarModalGenerico(
      "PAGAMENTOS",
      `
        <p style="
          color:#ddd;
          line-height:1.7;
        ">
          Área preparada para acompanhamento dos pagamentos
          realizados no sistema LUX ADVANCE.
        </p>
      `,
      true
    );

  }


  /* =========================================================
     USUÁRIOS
     ========================================================= */

  function abrirModuloUsuarios() {

    mostrarModalGenerico(
      "USUÁRIOS",
      `
        <p style="
          color:#ddd;
          line-height:1.7;
        ">
          Área administrativa destinada ao gerenciamento
          das contas de usuários da plataforma.
        </p>
      `,
      true
    );

  }


  /* =========================================================
     MODAL GENÉRICO
     ========================================================= */

  function mostrarModalGenerico(
    titulo,
    conteudo,
    html = false
  ) {

    const modal =
      document.getElementById("modal-admin-generico");


    if (modal) {

      const tituloElemento =
        modal.querySelector(
          "[data-modal-titulo]"
        );

      const corpoElemento =
        modal.querySelector(
          "[data-modal-corpo]"
        );


      if (tituloElemento) {
        tituloElemento.textContent = titulo;
      }


      if (corpoElemento) {

        if (html) {
          corpoElemento.innerHTML = conteudo;
        } else {
          corpoElemento.textContent = conteudo;
        }

      }


      modal.style.display = "flex";

      return;
    }


    /* =====================================================
       FALLBACK — cria modal automaticamente
       ===================================================== */

    const existente =
      document.getElementById(
        "lux-modal-generico-criado"
      );

    if (existente) {
      existente.remove();
    }


    const novoModal =
      document.createElement("div");


    novoModal.id =
      "lux-modal-generico-criado";


    novoModal.style.cssText = `
      position:fixed;
      inset:0;
      z-index:99999;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:rgba(0,0,0,.82);
      backdrop-filter:blur(7px);
    `;


    const caixa =
      document.createElement("div");


    caixa.style.cssText = `
      width:min(700px,100%);
      max-height:90vh;
      overflow:auto;
      padding:24px;
      border-radius:20px;
      border:1px solid rgba(248,213,138,.25);
      background:#0b0608;
      box-shadow:0 20px 60px rgba(0,0,0,.5);
      color:#fff;
    `;


    caixa.innerHTML = `

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        margin-bottom:20px;
      ">

        <h2 style="
          margin:0;
          color:#f8d58a;
          font-size:22px;
        ">
          ${escaparHTML(titulo)}
        </h2>

        <button
          type="button"
          id="fechar-lux-modal"
          style="
            width:38px;
            height:38px;
            border-radius:50%;
            border:1px solid rgba(255,255,255,.15);
            background:rgba(255,255,255,.05);
            color:#fff;
            font-size:20px;
            cursor:pointer;
          "
        >
          ×
        </button>

      </div>

      <div id="conteudo-lux-modal"></div>

    `;


    novoModal.appendChild(caixa);
    document.body.appendChild(novoModal);


    const conteudoElemento =
      caixa.querySelector(
        "#conteudo-lux-modal"
      );


    if (html) {
      conteudoElemento.innerHTML =
        conteudo;
    } else {
      conteudoElemento.textContent =
        conteudo;
    }


    caixa.querySelector(
      "#fechar-lux-modal"
    ).onclick = function () {
      novoModal.remove();
    };


    novoModal.addEventListener(
      "click",
      function (evento) {

        if (evento.target === novoModal) {
          novoModal.remove();
        }

      }
    );

  }


  /* =========================================================
     FECHAR MODAL GENÉRICO
     ========================================================= */

  document.addEventListener(
    "click",
    function (evento) {

      if (
        evento.target.matches(
          "[data-fechar-modal-admin]"
        )
      ) {

        const modal =
          evento.target.closest(
            ".modal"
          );

        if (modal) {
          modal.style.display = "none";
        }

      }

    }
  );


  /* =========================================================
     NORMALIZAR TEXTO
     ========================================================= */

  function normalizarTexto(texto) {

    return String(texto || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  }


  /* =========================================================
     FORMATAR DATA
     ========================================================= */

  function formatarData(data) {

    if (!data) {
      return "Não informado";
    }


    try {

      const dataObj =
        new Date(data);


      if (isNaN(dataObj.getTime())) {
        return String(data);
      }


      return dataObj.toLocaleString(
        "pt-BR",
        {
          dateStyle: "short",
          timeStyle: "short"
        }
      );

    } catch (erro) {

      return String(data);

    }

  }


  /* =========================================================
     ESCAPAR HTML
     ========================================================= */

  function escaparHTML(valor) {

    if (
      valor === null ||
      valor === undefined
    ) {
      return "";
    }


    return String(valor)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  /* =========================================================
     ESCAPAR ATRIBUTO
     ========================================================= */

  function escaparAtributo(valor) {

    return String(valor || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/"/g, "&quot;");

  }


})();
