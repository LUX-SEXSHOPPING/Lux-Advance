/* =========================================================
   LUX ADVANCE — PAINEL ADMINISTRATIVO V1.9
   painel-admin.js

   V1.9 — CORREÇÃO DO SISTEMA DE APROVAÇÃO

   PRINCIPAIS CORREÇÕES:
   - Botões APROVAR e REPROVAR recebem eventos diretamente
     pelo JavaScript.
   - Mantém compatibilidade com onclick antigo do HTML.
   - Usa public.modelo_perfis.
   - Usa verificacao_status.
   - Atualiza public.perfis.
   - Evita duplo clique.
   - Atualiza lista e dashboard após aprovação.
   - Mantém os demais módulos administrativos.
   ========================================================= */

(function () {

  "use strict";

  const VERSAO =
    "V1.9";

  let listaModelos = [];
  let filtroAtual = "todos";
  let fichaAtual = null;
  let alterandoStatus = false;


  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    async function () {

      console.log(
        "[LUX ADMIN V1.9] Painel iniciado."
      );

      if (!window.luxSupabase) {

        console.error(
          "[LUX ADMIN V1.9] Supabase não inicializado."
        );

        mostrarErroInicializacao(
          "Supabase não foi inicializado. Verifique o config.js."
        );

        return;
      }


      configurarFiltros();

      configurarBotoesStatus();

      await carregarModelos();

      atualizarDashboard();

    }
  );


  /* =========================================================
     CONFIGURAR BOTÕES APROVAR / REPROVAR
     V1.9
     ========================================================= */

  function configurarBotoesStatus() {

    const botaoAprovar =
      document.getElementById(
        "botao-aprovar"
      );

    const botaoRejeitar =
      document.getElementById(
        "botao-rejeitar"
      );


    if (botaoAprovar) {

      console.log(
        "[LUX ADMIN V1.9] Botão APROVAR encontrado."
      );


      botaoAprovar.type =
        "button";


      botaoAprovar.addEventListener(
        "click",
        function (evento) {

          evento.preventDefault();

          evento.stopPropagation();

          console.log(
            "[LUX ADMIN V1.9] Clique em APROVAR."
          );

          window.aprovarModelo();

        }
      );

    } else {

      console.warn(
        "[LUX ADMIN V1.9] Botão #botao-aprovar não encontrado no carregamento."
      );

    }


    if (botaoRejeitar) {

      console.log(
        "[LUX ADMIN V1.9] Botão REPROVAR encontrado."
      );


      botaoRejeitar.type =
        "button";


      botaoRejeitar.addEventListener(
        "click",
        function (evento) {

          evento.preventDefault();

          evento.stopPropagation();

          console.log(
            "[LUX ADMIN V1.9] Clique em REPROVAR."
          );

          window.rejeitarModelo();

        }
      );

    } else {

      console.warn(
        "[LUX ADMIN V1.9] Botão #botao-rejeitar não encontrado no carregamento."
      );

    }

  }


  /* =========================================================
     ERRO DE INICIALIZAÇÃO
     ========================================================= */

  function mostrarErroInicializacao(
    mensagem
  ) {

    const lista =
      document.getElementById(
        "lista-precadastros"
      );

    if (!lista) return;


    lista.innerHTML = `

      <div style="
        padding:25px;
        text-align:center;
        border:1px solid rgba(255,77,166,.35);
        border-radius:16px;
        background:rgba(255,77,166,.08);
        color:#fff;
      ">

        <strong style="
          color:#ff4da6;
          font-size:18px;
        ">
          Erro no sistema
        </strong>

        <p style="
          margin-top:10px;
          color:#ddd;
        ">
          ${escaparHTML(mensagem)}
        </p>

      </div>

    `;

  }


  /* =========================================================
     CARREGAR MODELOS
     ========================================================= */

  async function carregarModelos() {

    const lista =
      document.getElementById(
        "lista-precadastros"
      );


    if (!lista) {

      console.warn(
        "[LUX ADMIN V1.9] #lista-precadastros não encontrado."
      );

      return;
    }


    lista.innerHTML = `

      <div style="
        padding:30px;
        text-align:center;
        color:#ddd;
      ">
        Carregando modelos...
      </div>

    `;


    try {

      console.log(
        "[LUX ADMIN V1.9] Buscando modelos em modelo_perfis..."
      );


      const resultado =
        await window.luxSupabase
          .from("modelo_perfis")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      const data =
        resultado.data;

      const error =
        resultado.error;


      if (error) {

        console.error(
          "[LUX ADMIN V1.9] Erro:",
          error
        );


        lista.innerHTML = `

          <div style="
            padding:25px;
            text-align:center;
            border:1px solid rgba(255,77,166,.35);
            border-radius:16px;
            background:rgba(255,77,166,.06);
            color:#fff;
          ">

            <strong style="
              color:#ff4da6;
            ">
              Não foi possível carregar os modelos.
            </strong>

            <p style="
              margin-top:10px;
              color:#aaa;
              font-size:13px;
            ">
              ${escaparHTML(
                error.message ||
                "Erro desconhecido."
              )}
            </p>

          </div>

        `;

        return;
      }


      listaModelos =
        Array.isArray(data)
          ? data
          : [];


      console.log(
        "[LUX ADMIN V1.9] Modelos encontrados:",
        listaModelos.length
      );


      renderizarModelos();

      atualizarDashboard();

    } catch (erro) {

      console.error(
        "[LUX ADMIN V1.9] Erro inesperado:",
        erro
      );


      lista.innerHTML = `

        <div style="
          padding:25px;
          text-align:center;
          color:#fff;
        ">
          Erro inesperado ao carregar os modelos.
        </div>

      `;

    }

  }


  /* =========================================================
     RENDERIZAR MODELOS
     ========================================================= */

  function renderizarModelos() {

    const lista =
      document.getElementById(
        "lista-precadastros"
      );


    if (!lista) return;


    const modelos =
      listaModelos.filter(
        function (modelo) {

          const status =
            normalizarStatus(
              modelo.verificacao_status
            );


          if (
            filtroAtual === "todos"
          ) {

            return true;

          }


          return status ===
            filtroAtual;

        }
      );


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
            Nenhum modelo encontrado
          </strong>

          <p style="
            color:#aaa;
            margin-top:8px;
          ">
            Não existem modelos para este filtro.
          </p>

        </div>

      `;

      return;
    }


    lista.innerHTML =
      modelos.map(
        function (modelo) {

          const nome =
            modelo.nome_exibicao ||
            "Sem nome";


          const apelido =
            modelo.apelido ||
            "";


          const cidade =
            modelo.cidade ||
            "Não informada";


          const whatsapp =
            modelo.whatsapp ||
            "Não informado";


          const categoria =
            modelo.categoria_catalogo ||
            "Não informada";


          const idade =
            modelo.idade ||
            "Não informada";


          const status =
            normalizarStatus(
              modelo.verificacao_status
            );


          return `

            <div
              class="card-modelo"
              style="
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
                box-shadow:
                  0 10px 30px rgba(0,0,0,.18);
              "
            >

              <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:15px;
                flex-wrap:wrap;
              ">

                <div style="
                  flex:1;
                  min-width:220px;
                ">

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
                      <strong>Idade:</strong>
                      ${escaparHTML(
                        String(idade)
                      )}
                    </div>

                    <div>
                      <strong>Categoria:</strong>
                      ${escaparHTML(categoria)}
                    </div>

                    <div>
                      <strong>WhatsApp:</strong>
                      ${escaparHTML(whatsapp)}
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
                    onclick="
                      verFichaModelo(
                        '${escaparAtributo(modelo.id)}'
                      )
                    "
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

        }
      ).join("");

  }


  /* =========================================================
     NORMALIZAR STATUS
     ========================================================= */

  function normalizarStatus(
    status
  ) {

    if (!status) {

      return "pendente";

    }


    const valor =
      String(status)
        .toLowerCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        );


    if (
      valor === "aprovado" ||
      valor === "aprovada"
    ) {

      return "aprovado";

    }


    if (
      valor === "reprovado" ||
      valor === "reprovada" ||
      valor === "rejeitado" ||
      valor === "rejeitada" ||
      valor === "recusado" ||
      valor === "recusada"
    ) {

      return "reprovado";

    }


    return "pendente";

  }


  /* =========================================================
     BADGE
     ========================================================= */

  function badgeStatus(
    status
  ) {

    if (
      status === "aprovado"
    ) {

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


    if (
      status === "reprovado"
    ) {

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
          ✕ REPROVADO
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
      document.querySelectorAll(
        ".btn-filtro"
      );


    botoes.forEach(
      function (botao) {

        botao.addEventListener(
          "click",
          function () {

            botoes.forEach(
              function (b) {

                b.classList.remove(
                  "ativo"
                );

              }
            );


            botao.classList.add(
              "ativo"
            );


            filtroAtual =
              botao.dataset.filtro ||
              "todos";


            if (
              filtroAtual ===
              "rejeitado"
            ) {

              filtroAtual =
                "reprovado";

            }


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
      listaModelos.length;


    const pendentes =
      listaModelos.filter(
        function (modelo) {

          return (
            normalizarStatus(
              modelo.verificacao_status
            ) === "pendente"
          );

        }
      ).length;


    const aprovados =
      listaModelos.filter(
        function (modelo) {

          return (
            normalizarStatus(
              modelo.verificacao_status
            ) === "aprovado"
          );

        }
      ).length;


    const reprovados =
      listaModelos.filter(
        function (modelo) {

          return (
            normalizarStatus(
              modelo.verificacao_status
            ) === "reprovado"
          );

        }
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

  }


  function atualizarElemento(
    id,
    valor
  ) {

    const elemento =
      document.getElementById(id);


    if (elemento) {

      elemento.textContent =
        valor;

    }

  }


  /* =========================================================
     VER FICHA
     ========================================================= */

  window.verFichaModelo =
    function (id) {

      console.log(
        "[LUX ADMIN V1.9] Abrindo ficha:",
        id
      );


      const modelo =
        listaModelos.find(
          function (item) {

            return (
              String(item.id) ===
              String(id)
            );

          }
        );


      if (!modelo) {

        alert(
          "Modelo não encontrado."
        );

        return;
      }


      fichaAtual =
        modelo;


      const modal =
        document.getElementById(
          "modal-ver-ficha"
        );


      const corpo =
        document.getElementById(
          "corpo-ficha"
        );


      if (!modal || !corpo) {

        alert(
          "Modal da ficha não encontrado no painel."
        );

        return;
      }


      const status =
        normalizarStatus(
          modelo.verificacao_status
        );


      corpo.innerHTML = `

        <div style="
          display:grid;
          gap:12px;
        ">

          ${campoFicha(
            "Nome",
            modelo.nome_exibicao
          )}

          ${campoFicha(
            "Apelido",
            modelo.apelido
          )}

          ${campoFicha(
            "Categoria",
            modelo.categoria_catalogo
          )}

          ${campoFicha(
            "WhatsApp",
            modelo.whatsapp
          )}

          ${campoFicha(
            "CPF",
            modelo.cpf
          )}

          ${campoFicha(
            "Data de nascimento",
            modelo.data_nascimento
          )}

          ${campoFicha(
            "Idade",
            modelo.idade
          )}

          ${campoFicha(
            "Altura",
            modelo.altura_cm
              ? modelo.altura_cm + " cm"
              : null
          )}

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

          ${campoFicha(
            "Cor do cabelo",
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

          ${campoFicha(
            "Descrição",
            modelo.descricao
          )}

          ${campoFicha(
            "Maioridade confirmada",
            modelo.maioridade_confirmada
              ? "SIM"
              : "NÃO"
          )}

          ${campoFicha(
            "Plano",
            modelo.plano
          )}

          ${campoFicha(
            "Status",
            status.toUpperCase()
          )}

          ${campoFicha(
            "Cadastro",
            formatarData(
              modelo.criado_em
            )
          )}

          ${campoFicha(
            "Atualizado",
            formatarData(
              modelo.atualizado_em
            )
          )}

        </div>

      `;


      const botaoAprovar =
        document.getElementById(
          "botao-aprovar"
        );


      const botaoRejeitar =
        document.getElementById(
          "botao-rejeitar"
        );


      if (botaoAprovar) {

        botaoAprovar.type =
          "button";


        botaoAprovar.style.display =
          status === "aprovado"
            ? "none"
            : "inline-block";


        botaoAprovar.disabled =
          false;

      }


      if (botaoRejeitar) {

        botaoRejeitar.type =
          "button";


        botaoRejeitar.style.display =
          status === "reprovado"
            ? "none"
            : "inline-block";


        botaoRejeitar.disabled =
          false;

      }


      modal.style.display =
        "flex";

    };


  function campoFicha(
    titulo,
    valor
  ) {

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {

      valor =
        "Não informado";

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
          ${escaparHTML(
            String(valor)
          )}
        </div>

      </div>

    `;

  }


  /* =========================================================
     APROVAR
     V1.9
     ========================================================= */

  window.aprovarModelo =
    async function () {

      console.log(
        "[LUX ADMIN V1.9] aprovarModelo() executada."
      );


      if (!fichaAtual) {

        alert(
          "Nenhum modelo selecionado."
        );

        return;
      }


      await alterarStatusModelo(
        "aprovado"
      );

    };


  /* =========================================================
     REPROVAR
     V1.9
     ========================================================= */

  window.rejeitarModelo =
    async function () {

      console.log(
        "[LUX ADMIN V1.9] rejeitarModelo() executada."
      );


      if (!fichaAtual) {

        alert(
          "Nenhum modelo selecionado."
        );

        return;
      }


      await alterarStatusModelo(
        "reprovado"
      );

    };


  /* =========================================================
     ALTERAR STATUS
     V1.9
     ========================================================= */

  async function alterarStatusModelo(
    novoStatus
  ) {

    console.log(
      "[LUX ADMIN V1.9] Alterando status:",
      novoStatus
    );


    if (alterandoStatus) {

      console.warn(
        "[LUX ADMIN V1.9] Operação já em andamento."
      );

      return;

    }


    if (!fichaAtual) {

      alert(
        "Nenhum modelo selecionado."
      );

      return;

    }


    if (!window.luxSupabase) {

      alert(
        "Supabase não está disponível."
      );

      return;

    }


    const idModelo =
      fichaAtual.id;


    const nome =
      fichaAtual.nome_exibicao ||
      "modelo";


    if (!idModelo) {

      alert(
        "O ID da modelo não foi encontrado."
      );

      console.error(
        "[LUX ADMIN V1.9] fichaAtual sem ID:",
        fichaAtual
      );

      return;

    }


    const mensagem =
      novoStatus === "aprovado"
        ? `Deseja aprovar o cadastro de ${nome}?`
        : `Deseja reprovar o cadastro de ${nome}?`;


    const confirmou =
      window.confirm(
        mensagem
      );


    if (!confirmou) {

      console.log(
        "[LUX ADMIN V1.9] Operação cancelada pelo administrador."
      );

      return;

    }


    alterandoStatus =
      true;


    const botaoAprovar =
      document.getElementById(
        "botao-aprovar"
      );


    const botaoRejeitar =
      document.getElementById(
        "botao-rejeitar"
      );


    if (botaoAprovar) {

      botaoAprovar.disabled =
        true;

    }


    if (botaoRejeitar) {

      botaoRejeitar.disabled =
        true;

    }


    try {

      const novoStatusNormalizado =
        novoStatus === "aprovado"
          ? "aprovado"
          : "reprovado";


      console.log(
        "[LUX ADMIN V1.9] Atualizando modelo_perfis:",
        {
          id: idModelo,
          verificacao_status:
            novoStatusNormalizado
        }
      );


      /* =====================================================
         ATUALIZA MODELO_PERFIS
         ===================================================== */

      const resultado =
        await window.luxSupabase
          .from("modelo_perfis")
          .update({

            verificacao_status:
              novoStatusNormalizado,

            atualizado_em:
              new Date().toISOString()

          })
          .eq(
            "id",
            idModelo
          )
          .select()
          .single();


      if (resultado.error) {

        console.error(
          "[LUX ADMIN V1.9] Erro ao atualizar modelo_perfis:",
          resultado.error
        );


        alert(
          "Não foi possível alterar o status da modelo.\n\n" +
          "Erro do Supabase:\n" +
          (
            resultado.error.message ||
            "Erro desconhecido."
          )
        );


        return;

      }


      console.log(
        "[LUX ADMIN V1.9] modelo_perfis atualizado:",
        resultado.data
      );


      /* =====================================================
         ATUALIZA PERFIS
         ===================================================== */

      const statusPerfil =
        novoStatusNormalizado === "aprovado"
          ? "ativo"
          : "inativo";


      console.log(
        "[LUX ADMIN V1.9] Atualizando perfis:",
        {
          id: idModelo,
          status: statusPerfil
        }
      );


      const resultadoPerfil =
        await window.luxSupabase
          .from("perfis")
          .update({

            status:
              statusPerfil,

            updated_at:
              new Date().toISOString()

          })
          .eq(
            "id",
            idModelo
          );


      if (
        resultadoPerfil.error
      ) {

        console.warn(
          "[LUX ADMIN V1.9] modelo_perfis atualizado, mas perfis apresentou erro:",
          resultadoPerfil.error
        );


        alert(
          "A modelo foi atualizada, mas houve um problema ao atualizar o status geral da conta:\n\n" +
          resultadoPerfil.error.message
        );

      }


      /* =====================================================
         ATUALIZA MEMÓRIA LOCAL
         ===================================================== */

      const modeloAtualizado =
        resultado.data ||
        {
          ...fichaAtual,

          verificacao_status:
            novoStatusNormalizado,

          atualizado_em:
            new Date().toISOString()

        };


      const indice =
        listaModelos.findIndex(
          function (item) {

            return (
              String(item.id) ===
              String(idModelo)
            );

          }
        );


      if (indice !== -1) {

        listaModelos[indice] =
          modeloAtualizado;

      }


      fichaAtual =
        modeloAtualizado;


      atualizarDashboard();

      renderizarModelos();


      /* =====================================================
         FECHAR MODAL
         ===================================================== */

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


      /* =====================================================
         RECARREGAR DADOS
         ===================================================== */

      await carregarModelos();


      console.log(
        "[LUX ADMIN V1.9] Status alterado com sucesso."
      );


      alert(
        novoStatusNormalizado === "aprovado"
          ? "Modelo aprovado com sucesso."
          : "Modelo reprovado com sucesso."
      );


    } catch (erro) {

      console.error(
        "[LUX ADMIN V1.9] Erro ao alterar status:",
        erro
      );


      alert(
        "Ocorreu um erro ao atualizar o modelo.\n\n" +
        (
          erro.message ||
          String(erro) ||
          "Erro desconhecido."
        )
      );


    } finally {

      alterandoStatus =
        false;


      if (botaoAprovar) {

        botaoAprovar.disabled =
          false;

      }


      if (botaoRejeitar) {

        botaoRejeitar.disabled =
          false;

      }

    }

  }


  /* =========================================================
     FECHAR FICHA
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

        alert(
          "Nenhuma ficha selecionada."
        );

        return;

      }


      const nome =
        fichaAtual.nome_exibicao ||
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
              font-family:Arial,sans-serif;
              padding:30px;
              color:#111;
            }

            h1 {
              text-align:center;
              margin-bottom:30px;
            }

            .campo {
              padding:10px;
              border-bottom:1px solid #ddd;
            }

            .titulo {
              font-weight:bold;
              display:inline-block;
              width:220px;
            }

          </style>

        </head>

        <body>

          <h1>
            LUX ADVANCE — FICHA CADASTRAL
          </h1>

          ${campoImpressao(
            "Nome",
            fichaAtual.nome_exibicao
          )}

          ${campoImpressao(
            "Apelido",
            fichaAtual.apelido
          )}

          ${campoImpressao(
            "Categoria",
            fichaAtual.categoria_catalogo
          )}

          ${campoImpressao(
            "WhatsApp",
            fichaAtual.whatsapp
          )}

          ${campoImpressao(
            "CPF",
            fichaAtual.cpf
          )}

          ${campoImpressao(
            "Data de nascimento",
            fichaAtual.data_nascimento
          )}

          ${campoImpressao(
            "Idade",
            fichaAtual.idade
          )}

          ${campoImpressao(
            "Altura",
            fichaAtual.altura_cm
          )}

          ${campoImpressao(
            "CEP",
            fichaAtual.cep
          )}

          ${campoImpressao(
            "Estado",
            fichaAtual.estado
          )}

          ${campoImpressao(
            "Cidade",
            fichaAtual.cidade
          )}

          ${campoImpressao(
            "Bairro",
            fichaAtual.bairro
          )}

          ${campoImpressao(
            "Endereço",
            fichaAtual.endereco
          )}

          ${campoImpressao(
            "Número",
            fichaAtual.numero
          )}

          ${campoImpressao(
            "Complemento",
            fichaAtual.complemento
          )}

          ${campoImpressao(
            "País",
            fichaAtual.pais
          )}

          ${campoImpressao(
            "Cor do cabelo",
            fichaAtual.cor_cabelo
          )}

          ${campoImpressao(
            "Cor dos olhos",
            fichaAtual.cor_olhos
          )}

          ${campoImpressao(
            "Idiomas",
            fichaAtual.idiomas
          )}

          ${campoImpressao(
            "Descrição",
            fichaAtual.descricao
          )}

          ${campoImpressao(
            "Plano",
            fichaAtual.plano
          )}

          ${campoImpressao(
            "Status",
            fichaAtual.verificacao_status
          )}

          ${campoImpressao(
            "Cadastro",
            formatarData(
              fichaAtual.criado_em
            )
          )}

        </body>

        </html>

      `;


      const janela =
        window.open(
          "",
          "_blank"
        );


      if (!janela) {

        alert(
          "O navegador bloqueou a janela de impressão."
        );

        return;

      }


      janela.document.open();

      janela.document.write(
        conteudo
      );

      janela.document.close();


      janela.onload =
        function () {

          janela.print();

        };

    };


  function campoImpressao(
    titulo,
    valor
  ) {

    if (
      valor === null ||
      valor === undefined ||
      valor === ""
    ) {

      valor =
        "Não informado";

    }


    return `

      <div class="campo">

        <span class="titulo">
          ${escaparHTML(titulo)}:
        </span>

        ${escaparHTML(
          String(valor)
        )}

      </div>

    `;

  }


  /* =========================================================
     MÓDULOS ADMIN
     ========================================================= */

  window.abrirModuloAdmin =
    async function (
      titulo,
      texto
    ) {

      const tituloNormalizado =
        normalizarTexto(
          titulo
        );


      if (
        tituloNormalizado.includes(
          "avaliacoes"
        )
      ) {

        await abrirModuloAvaliacoes();

        return;

      }


      if (
        tituloNormalizado.includes(
          "reclamacoes"
        )
      ) {

        await abrirModuloReclamacoes();

        return;

      }


      if (
        tituloNormalizado.includes(
          "assinaturas"
        )
      ) {

        await abrirModuloAssinaturas();

        return;

      }


      if (
        tituloNormalizado.includes(
          "planos"
        )
      ) {

        abrirModuloPlanos();

        return;

      }


      if (
        tituloNormalizado.includes(
          "doacoes"
        )
      ) {

        abrirModuloDoacoes();

        return;

      }


      if (
        tituloNormalizado.includes(
          "pagamentos"
        )
      ) {

        abrirModuloPagamentos();

        return;

      }


      if (
        tituloNormalizado.includes(
          "usuarios"
        )
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

      const resultado =
        await window.luxSupabase
          .from("avaliacoes")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      if (resultado.error) {

        mostrarModalGenerico(
          "AVALIAÇÕES",
          "Não foi possível carregar as avaliações.\n\n" +
          resultado.error.message
        );

        return;

      }


      const data =
        resultado.data || [];


      if (!data.length) {

        mostrarModalGenerico(
          "AVALIAÇÕES",
          "Nenhuma avaliação registrada até o momento."
        );

        return;

      }


      const html =
        data.map(
          function (item) {

            const nota =
              Number(
                item.nota || 0
              );


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
                Math.max(
                  0,
                  5 - nota
                )
              );


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
                  color:#ddd;
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
                  ${formatarData(
                    item.criado_em
                  )}
                </div>

              </div>

            `;

          }
        ).join("");


      mostrarModalGenerico(
        "AVALIAÇÕES",
        html,
        true
      );


    } catch (erro) {

      console.error(
        erro
      );


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

      const resultado =
        await window.luxSupabase
          .from("reclamacoes")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      if (resultado.error) {

        mostrarModalGenerico(
          "RECLAMAÇÕES",
          "Não foi possível carregar as reclamações.\n\n" +
          resultado.error.message
        );

        return;

      }


      const data =
        resultado.data || [];


      if (!data.length) {

        mostrarModalGenerico(
          "RECLAMAÇÕES",
          "Nenhuma reclamação registrada até o momento."
        );

        return;

      }


      const html =
        data.map(
          function (item) {

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
                  ${formatarData(
                    item.criado_em
                  )}
                </div>

              </div>

            `;

          }
        ).join("");


      mostrarModalGenerico(
        "RECLAMAÇÕES",
        html,
        true
      );


    } catch (erro) {

      console.error(
        erro
      );


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

      const resultado =
        await window.luxSupabase
          .from("assinaturas")
          .select("*")
          .order(
            "criado_em",
            {
              ascending: false
            }
          );


      if (resultado.error) {

        mostrarModalGenerico(
          "ASSINATURAS",
          "Não foi possível carregar as assinaturas.\n\n" +
          resultado.error.message
        );

        return;

      }


      const data =
        resultado.data || [];


      if (!data.length) {

        mostrarModalGenerico(
          "ASSINATURAS",
          "Nenhuma assinatura registrada até o momento."
        );

        return;

      }


      const html =
        data.map(
          function (item) {

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
                  ${formatarData(
                    item.criado_em
                  )}
                </div>

              </div>

            `;

          }
        ).join("");


      mostrarModalGenerico(
        "ASSINATURAS",
        html,
        true
      );


    } catch (erro) {

      console.error(
        erro
      );


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
          ${escaparHTML(nome)}
        </div>

        <div style="
          color:#ff4da6;
          font-size:16px;
          margin-top:5px;
        ">
          ${escaparHTML(preco)}
        </div>

        <div style="
          color:#ddd;
          margin-top:7px;
        ">
          ${escaparHTML(descricao)}
        </div>

        <ul style="
          color:#aaa;
          line-height:1.8;
          padding-left:20px;
        ">

          ${recursos.map(
            function (item) {

              return `
                <li>
                  ${escaparHTML(item)}
                </li>
              `;

            }
          ).join("")}

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
        <p style="
          color:#ddd;
          line-height:1.7;
        ">
          Área administrativa das doações Pix.
        </p>

        <p style="
          color:#f8d58a;
          margin-top:12px;
          line-height:1.7;
        ">
          O módulo permanece preparado para integração
          com os registros de doações do Supabase.
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
          Área administrativa destinada ao
          acompanhamento dos pagamentos.
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
          Área administrativa destinada ao
          gerenciamento das contas de usuários.
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
    html
  ) {

    html =
      html === true;


    const modal =
      document.getElementById(
        "modal-admin-generico"
      );


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

        tituloElemento.textContent =
          titulo;

      }


      if (corpoElemento) {

        if (html) {

          corpoElemento.innerHTML =
            conteudo;

        } else {

          corpoElemento.textContent =
            conteudo;

        }

      }


      modal.style.display =
        "flex";


      return;

    }


    const existente =
      document.getElementById(
        "lux-modal-generico-criado"
      );


    if (existente) {

      existente.remove();

    }


    const novoModal =
      document.createElement(
        "div"
      );


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
      document.createElement(
        "div"
      );


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


    novoModal.appendChild(
      caixa
    );


    document.body.appendChild(
      novoModal
    );


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
    ).onclick =
      function () {

        novoModal.remove();

      };


    novoModal.addEventListener(
      "click",
      function (evento) {

        if (
          evento.target ===
          novoModal
        ) {

          novoModal.remove();

        }

      }
    );

  }


  /* =========================================================
     FECHAR MODAIS
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

          modal.style.display =
            "none";

        }

      }

    }
  );


  /* =========================================================
     NORMALIZAR TEXTO
     ========================================================= */

  function normalizarTexto(
    texto
  ) {

    return String(
      texto || ""
    )
      .toLowerCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      );

  }


  /* =========================================================
     FORMATAR DATA
     ========================================================= */

  function formatarData(
    data
  ) {

    if (!data) {

      return "Não informado";

    }


    try {

      const dataObj =
        new Date(data);


      if (
        isNaN(
          dataObj.getTime()
        )
      ) {

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

  function escaparHTML(
    valor
  ) {

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


  /* =========================================================
     ESCAPAR ATRIBUTO
     ========================================================= */

  function escaparAtributo(
    valor
  ) {

    return String(
      valor || ""
    )
      .replace(
        /\\/g,
        "\\\\"
      )
      .replace(
        /'/g,
        "\\'"
      )
      .replace(
        /"/g,
        "&quot;"
      );

  }


  /* =========================================================
     IDENTIFICAÇÃO DA VERSÃO
     ========================================================= */

  window.LUX_ADMIN_VERSION =
    VERSAO;


  console.log(
    "[LUX ADMIN V1.9] JavaScript carregado com sucesso."
  );


})();
