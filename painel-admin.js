let listaPreCadastros=[];
let listaUsuariosAdmin=[];
let listaReclamacoesAdmin=[];
let listaPagamentosAdmin=[];
let filtroStatus='todos';
let indiceSelecionado=null;

function obterSupabase(){
  if(window.luxSupabase&&typeof window.luxSupabase.from==='function')return window.luxSupabase;
  if(window.supabaseClient&&typeof window.supabaseClient.from==='function')return window.supabaseClient;
  if(window.supabase&&typeof window.supabase.from==='function')return window.supabase;
  return null;
}

function esc(v){
  return String(v??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;')
}

function data(v){
  if(!v)return'Não informado';
  let d=new Date(v);
  return isNaN(d)?String(v):d.toLocaleDateString('pt-BR');
}

function dataHora(v){
  if(!v)return'Não informado';
  let d=new Date(v);
  return isNaN(d)?String(v):d.toLocaleString('pt-BR');
}

function moeda(v){
  let n=Number(v);
  return Number.isFinite(n)
    ?n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
    :'R$ 0,00';
}

function set(id,v){
  let e=document.getElementById(id);
  if(e)e.textContent=v;
}

function normalizarStatus(s){
  s=String(s||'pendente').toLowerCase().trim();

  if(s==='rejeitado')return'reprovado';
  if(s==='verificada')return'aprovado';

  return s||'pendente';
}

function categoria(s){
  s=String(s||'').toLowerCase();

  if(s==='feminino')return'Feminino';
  if(s==='masculino')return'Masculino';
  if(s==='lgbtq'||s==='lgbtq+')return'LGBTQ+';

  return s||'Não informada';
}

function statusTexto(s){
  let n=normalizarStatus(s);

  return({
    pendente:'PENDENTE',
    aprovado:'APROVADO',
    reprovado:'REPROVADO',
    bloqueado:'BLOQUEADO'
  })[n]||n.toUpperCase();
}

function msg(t,tipo='info'){

  let e=document.getElementById('mensagemAdmin');

  if(!e){

    e=document.createElement('div');

    e.id='mensagemAdmin';

    e.style.cssText=
      'position:fixed;left:14px;right:14px;bottom:18px;z-index:999999;padding:15px;border-radius:14px;background:#160b10;color:#fff;border:1px solid rgba(245,213,140,.3);box-shadow:0 15px 50px #000;font-size:12px';

    document.body.appendChild(e);
  }

  e.textContent=t;

  e.style.background=
    tipo==='error'
      ?'#6d1024'
      :tipo==='success'
        ?'#124d31'
        :'#160b10';

  clearTimeout(e._t);

  e._t=setTimeout(()=>{
    e.remove();
  },5000);
}


/* =========================================================
   SESSÃO ADMIN
========================================================= */

async function verificarSessaoAdmin(){

  let s=obterSupabase();

  if(!s?.auth)return false;

  try{

    let r=await s.auth.getUser();

    let u=r.data?.user;

    if(!u){

      location.href='./acesso-admin.html';

      return false;
    }

    let adm=
      String(window.LUX_ADMIN_EMAIL||'')
      .toLowerCase()
      .trim();

    if(
      adm &&
      String(u.email||'').toLowerCase().trim()!==adm
    ){

      await s.auth.signOut();

      location.href='./acesso-admin.html';

      return false;
    }

    return true;

  }catch(e){

    console.error(e);

    return false;
  }
}

async function sairAdmin(){

  let s=obterSupabase();

  try{

    if(s?.auth)
      await s.auth.signOut();

  }catch(e){}

  location.href='./acesso-admin.html';
}


/* =========================================================
   MODELOS
========================================================= */

function normalizarModelo(m){

  let fotos=[];

  if(m.foto_url)
    fotos.push(m.foto_url);

  if(Array.isArray(m.galeria_urls)){

    m.galeria_urls.forEach(x=>{

      if(x&&!fotos.includes(x))
        fotos.push(x);

    });

  }

  return{
    ...m,

    nome:m.nome_exibicao||m.nome||'Sem nome',

    status:normalizarStatus(
      m.verificacao_status
    ),

    whatsapp:m.whatsapp||'',

    altura:m.altura_cm,

    sobre:m.descricao||'',

    fotos,

    modelo_id:m.id
  };
}


async function carregarModelos(){

  let s=obterSupabase();

  let c=document.getElementById(
    'lista-precadastros'
  );

  if(!s){

    if(c)
      c.innerHTML=
        '<div style="padding:25px;color:#f99">Supabase não inicializado.</div>';

    return[];
  }

  try{

    let r=await s
      .from('modelo_perfis')
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
        'criado_em',
        {ascending:false}
      );

    if(r.error)
      throw r.error;

    listaPreCadastros=
      (r.data||[]).map(
        normalizarModelo
      );

    window.listaPreCadastros=
      listaPreCadastros;

    renderizarModelos(
      listaPreCadastros
    );

    atualizarResumo();

    return listaPreCadastros;

  }catch(e){

    console.error(e);

    listaPreCadastros=[];

    if(c){

      c.innerHTML=
        '<div style="padding:25px;color:#ff9aaa;border:1px solid rgba(255,100,130,.25);border-radius:14px">'+
        'Não foi possível carregar os modelos.<br><br>'+
        esc(e.message||e)+
        '</div>';

    }

    msg(
      'Erro ao carregar modelos: '+
      (e.message||e),
      'error'
    );

    return[];
  }
}


function renderizarModelos(){

  let c=document.getElementById(
    'lista-precadastros'
  );

  if(!c)return;

  let q=
    (
      document.getElementById(
        'buscaModelos'
      )?.value||''
    )
    .toLowerCase()
    .trim();

  let dados=
    listaPreCadastros

    .filter(m=>
      filtroStatus==='todos'||
      normalizarStatus(m.status)===
      filtroStatus
    )

    .filter(m=>
      !q||
      String(m.nome||'')
        .toLowerCase()
        .includes(q)||
      String(m.apelido||'')
        .toLowerCase()
        .includes(q)||
      String(m.cidade||'')
        .toLowerCase()
        .includes(q)
    );

  if(!dados.length){

    c.innerHTML=
      '<div style="padding:30px;text-align:center;color:#888">'+
      'Nenhum cadastro encontrado neste filtro.'+
      '</div>';

    return;
  }

  c.innerHTML=dados.map(m=>{

    let foto=
      m.foto_url||
      './logo.png';

    return`

<article
style="
padding:16px;
margin-bottom:12px;
border:1px solid rgba(245,213,140,.15);
border-radius:18px;
background:rgba(255,255,255,.02)
">

<div
style="
display:flex;
justify-content:space-between;
gap:8px;
margin-bottom:12px
">

<span
style="
border:1px solid rgba(245,213,140,.2);
border-radius:20px;
padding:7px 10px;
color:#f5d58c;
font-size:10px
">

${esc(categoria(
m.categoria_catalogo
))}

</span>

<span
style="
border:1px solid rgba(245,213,140,.15);
border-radius:20px;
padding:7px 10px;
color:#f5d58c;
font-size:10px
">

${esc(statusTexto(m.status))}

</span>

</div>

<img
src="${esc(foto)}"
onerror="this.src='./logo.png'"
style="
width:100%;
height:230px;
object-fit:cover;
border-radius:14px;
display:block;
margin-bottom:14px
">

<h2
style="
color:#f5d58c;
margin:0 0 8px;
font-family:serif
">

${esc(m.nome)}

</h2>

<div
style="
color:#aaa;
line-height:1.7;
font-size:12px
">

Apelido:
${esc(m.apelido||'—')}

<br>

Idade:
${esc(m.idade||'—')}

<br>

WhatsApp:
${esc(m.whatsapp||'—')}

<br>

Local:
${esc(m.cidade||'—')}
${m.estado?' / '+esc(m.estado):''}

</div>

<button
type="button"
onclick="abrirFichaModelo('${esc(m.id)}')"
style="
width:100%;
margin-top:15px;
padding:13px;
border-radius:12px;
background:#171014;
border:1px solid rgba(245,213,140,.2);
color:#f5d58c;
font-weight:800
">

VER FICHA COMPLETA

</button>

<div
style="
display:flex;
gap:10px;
margin-top:10px
">

<button
type="button"
onclick="aprovarModelo('${esc(m.id)}')"
style="
flex:1;
padding:12px;
border-radius:12px;
background:#0d1712;
border:1px solid #315d45;
color:#79e7a7;
font-weight:800
">

✓ APROVAR

</button>

<button
type="button"
onclick="reprovarModelo('${esc(m.id)}')"
style="
flex:1;
padding:12px;
border-radius:12px;
background:#1a0d12;
border:1px solid #6b2a3b;
color:#ff9ab0;
font-weight:800
">

× REPROVAR

</button>

</div>

</article>

`;

  }).join('');
}


/* =========================================================
   FILTROS
========================================================= */

function aplicarFiltroStatus(s){

  filtroStatus=
    s==='rejeitado'
      ?'reprovado'
      :String(s||'todos').toLowerCase();

  renderizarModelos();

  atualizarResumo();
}

function filtrarModelos(s){
  aplicarFiltroStatus(s);
}

function pesquisarModelos(){
  renderizarModelos();
}

function ativarBotoesFiltro(){

  document
    .querySelectorAll('[data-filtro]')
    .forEach(b=>{

      if(b.dataset.luxBound)
        return;

      b.dataset.luxBound='1';

      b.addEventListener(
        'click',
        ()=>{
          aplicarFiltroStatus(
            b.dataset.filtro
          );
        }
      );

    });
}


/* =========================================================
   RESUMO
========================================================= */

function atualizarResumo(){

  let total=
    listaPreCadastros.length;

  let p=
    listaPreCadastros.filter(
      x=>normalizarStatus(
        x.status
      )==='pendente'
    ).length;

  let a=
    listaPreCadastros.filter(
      x=>normalizarStatus(
        x.status
      )==='aprovado'
    ).length;

  let r=
    listaPreCadastros.filter(
      x=>normalizarStatus(
        x.status
      )==='reprovado'
    ).length;

  set('resumoTotal',total);
  set('resumoPendentes',p);
  set('resumoAprovados',a);
  set('resumoRejeitados',r);
}


/* =========================================================
   FICHA
========================================================= */

function abrirFichaModelo(id){

  let m=
    listaPreCadastros.find(
      x=>x.id===id
    );

  if(!m)return;

  indiceSelecionado=
    listaPreCadastros.findIndex(
      x=>x.id===id
    );

  let modal=
    document.getElementById(
      'modal-ver-ficha'
    )||
    document.getElementById(
      'modal-ficha-modelo'
    );

  let corpo=
    document.getElementById(
      'corpo-ficha'
    );

  if(modal&&corpo){

    corpo.innerHTML=
      montarFicha(m);

    modal.style.display='flex';

    modal.classList.add(
      'ativo'
    );

    return;
  }

  mostrarModulo(
    'Ficha do modelo',
    m.nome,
    montarFicha(m)
  );
}


function montarFicha(m){

  return`

<div
style="
line-height:1.8;
color:#bbb;
font-size:12px
">

<strong
style="color:#f5d58c"
>

${esc(m.nome)}

</strong>

<br>

Categoria:
${esc(categoria(
m.categoria_catalogo
))}

<br>

Apelido:
${esc(m.apelido||'—')}

<br>

CPF:
${esc(m.cpf||'—')}

<br>

Nascimento:
${esc(data(
m.data_nascimento
))}

<br>

Idade:
${esc(m.idade||'—')}

<br>

WhatsApp:
${esc(m.whatsapp||'—')}

<br>

Altura:
${esc(m.altura_cm||'—')}
cm

<br>

CEP:
${esc(m.cep||'—')}

<br>

Estado:
${esc(m.estado||'—')}

<br>

Cidade:
${esc(m.cidade||'—')}

<br>

Bairro:
${esc(m.bairro||'—')}

<br>

Endereço:
${esc(m.endereco||'—')}
${esc(m.numero||'')}

<br>

Complemento:
${esc(m.complemento||'—')}

<br>

País:
${esc(m.pais||'—')}

<br>

Cabelo:
${esc(m.cor_cabelo||'—')}

<br>

Olhos:
${esc(m.cor_olhos||'—')}

<br>

Idiomas:
${esc(m.idiomas||'—')}

<br>

Maioridade:
${m.maioridade_confirmada?
'Confirmada':
'Não confirmada'}

<br>

Status:
${esc(statusTexto(m.status))}

<br><br>

${esc(
m.descricao||
'Sem descrição'
)}

</div>

`;
}


function fecharFichaModelo(){

  let m=
    document.getElementById(
      'modal-ver-ficha'
    )||
    document.getElementById(
      'modal-ficha-modelo'
    );

  if(m)
    m.style.display='none';
}

function fecharModalFicha(){
  fecharFichaModelo();
}


/* =========================================================
   APROVAR / REPROVAR
========================================================= */

async function alterarStatusModelo(
  id,
  novo
){

  let s=obterSupabase();

  if(!s){

    msg(
      'Supabase não inicializado',
      'error'
    );

    return false;
  }

  let r=
    await s
      .from('modelo_perfis')
      .update({
        verificacao_status:novo,
        atualizado_em:
          new Date().toISOString()
      })
      .eq('id',id);

  if(r.error){

    msg(
      'Não foi possível alterar: '+
      r.error.message,
      'error'
    );

    return false;
  }

  try{

    await s
      .from('perfis')
      .update({
        status:
          novo==='aprovado'
            ?'ativo'
            :'inativo'
      })
      .eq('id',id);

  }catch(e){}

  msg(
    novo==='aprovado'
      ?'Modelo aprovado com sucesso.'
      :'Modelo reprovado com sucesso.',
    'success'
  );

  fecharFichaModelo();

  await carregarModelos();

  return true;
}

async function aprovarModelo(id){
  return alterarStatusModelo(
    id,
    'aprovado'
  );
}

async function reprovarModelo(id){
  return alterarStatusModelo(
    id,
    'reprovado'
  );
}

async function atualizarStatusModelo(
  id,
  s
){
  return alterarStatusModelo(
    id,
    normalizarStatus(s)
  );
}

async function salvarAlteracoes(){
  msg(
    'Use a ficha e os botões de aprovação para alterar o cadastro.'
  );
}


/* =========================================================
   USUÁRIOS
========================================================= */

async function carregarUsuariosAdmin(){

  let s=obterSupabase();

  if(!s)return[];

  for(
    const tabela
    of ['perfis','usuarios']
  ){

    try{

      let r=
        await s
          .from(tabela)
          .select('*')
          .order(
            'criado_em',
            {ascending:false}
          );

      if(!r.error)
        return r.data||[];

    }catch(e){}

  }

  return[];
}

async function carregarUsuarios(){

  listaUsuariosAdmin=
    await carregarUsuariosAdmin();

  return listaUsuariosAdmin;
}

async function atualizarStatusUsuario(
  id,
  status
){

  let s=obterSupabase();

  if(!s)return;

  let r=
    await s
      .from('perfis')
      .update({status})
      .eq('id',id);

  if(r.error){

    msg(
      r.error.message,
      'error'
    );

  }else{

    msg(
      'Status atualizado.',
      'success'
    );

    abrirModuloUsuarios();

  }
}


/* =========================================================
   RECLAMAÇÕES
========================================================= */

async function carregarReclamacoesAdmin(){

  let s=obterSupabase();

  if(!s)return[];

  for(
    const tabela
    of [
      'reclamacoes',
      'reclamacoes_usuarios'
    ]
  ){

    try{

      let r=
        await s
          .from(tabela)
          .select('*')
          .order(
            'criado_em',
            {ascending:false}
          );

      if(!r.error){

        listaReclamacoesAdmin=
          r.data||[];

        return listaReclamacoesAdmin;
      }

    }catch(e){}

  }

  listaReclamacoesAdmin=[];

  return[];
}

async function carregarReclamacoes(){
  return carregarReclamacoesAdmin();
}

async function atualizarStatusReclamacao(
  id,
  status
){

  let s=obterSupabase();

  if(!s)return;

  let r=
    await s
      .from('reclamacoes')
      .update({
        status,
        atualizado_em:
          new Date().toISOString()
      })
      .eq('id',id);

  if(r.error){

    msg(
      r.error.message,
      'error'
    );

  }else{

    msg(
      'Reclamação atualizada.',
      'success'
    );

    abrirModuloReclamacoes();

  }
}

function abrirReclamacao(r){

  mostrarModulo(
    'Reclamação',
    r.assunto||'Atendimento',
    `
    <div
    style="
    color:#bbb;
    line-height:1.8
    ">
    ${esc(r.mensagem||'')}
    </div>
    `
  );
}


/* =========================================================
   PAGAMENTOS
========================================================= */

async function carregarPagamentos(){

  let s=obterSupabase();

  if(!s)return[];

  try{

    let r=
      await s
        .from('pagamentos_planos')
        .select('*')
        .order(
          'created_at',
          {ascending:false}
        );

    if(r.error)
      throw r.error;

    listaPagamentosAdmin=
      r.data||[];

    return listaPagamentosAdmin;

  }catch(e){

    return[];
  }
}


/* =========================================================
   MODAIS DOS MÓDULOS
========================================================= */

function criarBloco(
  t,
  v,
  d
){

  return`

<div
style="
padding:15px;
border:1px solid rgba(245,213,140,.15);
border-radius:14px;
background:rgba(255,255,255,.025)
">

<div
style="
font-size:9px;
letter-spacing:2px;
color:#8f858c
">

${esc(t)}

</div>

<div
style="
font-size:23px;
color:#f5d58c;
font-family:serif;
margin:7px 0
">

${esc(v)}

</div>

<div
style="
font-size:9px;
color:#777
">

${esc(d)}

</div>

</div>

`;
}


function fecharModuloAdmin(){

  document
    .getElementById(
      'modal-modulo-admin'
    )
    ?.remove();
}


function mostrarModulo(
  titulo,
  subtitulo,
  conteudo
){

  fecharModuloAdmin();

  let m=
    document.createElement(
      'div'
    );

  m.id='modal-modulo-admin';

  m.style.cssText=
    'position:fixed;inset:0;z-index:999999;background:rgba(0,0,0,.9);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:15px';

  m.innerHTML=`

<div
style="
width:min(850px,100%);
max-height:92vh;
overflow:auto;
background:#10090d;
border:1px solid rgba(245,213,140,.22);
border-radius:20px;
color:#eee;
box-shadow:0 30px 100px #000
">

<div
style="
position:sticky;
top:0;
background:#10090d;
border-bottom:1px solid rgba(255,255,255,.08);
padding:17px;
display:flex;
justify-content:space-between;
align-items:center
">

<div>

<div
style="
font-size:8px;
letter-spacing:3px;
color:#ff4da6
">

LUX-ADVANCE · ADMIN

</div>

<h2
style="
margin:5px 0;
color:#f5d58c;
font-family:serif
">

${esc(titulo)}

</h2>

<div
style="
font-size:10px;
color:#888
">

${esc(subtitulo||'')}

</div>

</div>

<button
onclick="fecharModuloAdmin()"
style="
border:1px solid #493b2c;
background:#160f13;
color:#f5d58c;
border-radius:50%;
width:38px;
height:38px;
font-size:20px
">

×

</button>

</div>

<div
style="
padding:18px
">

${conteudo}

</div>

</div>

`;

  m.addEventListener(
    'click',
    e=>{
      if(e.target===m)
        fecharModuloAdmin();
    }
  );

  document.body.appendChild(m);
}


/* =========================================================
   MÓDULO USUÁRIOS
========================================================= */

async function abrirModuloUsuarios(){

  let lista=
    await carregarUsuariosAdmin();

  mostrarModulo(
    'Usuários',
    'Contas e controle de acesso',

    lista.length

      ?lista.map(u=>`

<div
style="
padding:14px;
margin-bottom:9px;
border:1px solid rgba(245,213,140,.12);
border-radius:12px
">

<b
style="color:#f5d58c"
>

${esc(
  u.nome||
  u.nome_exibicao||
  'Usuário'
)}

</b>

<div
style="
font-size:10px;
color:#888;
margin-top:5px
">

${esc(
  u.email||
  'E-mail não informado'
)}

</div>

<div
style="
font-size:10px;
color:#777
">

Status:
${esc(u.status||'—')}

</div>

</div>

`).join('')

      :

      '<div style="padding:25px;text-align:center;color:#888">Nenhum usuário encontrado.</div>'
  );
}


/* =========================================================
   MÓDULO RECLAMAÇÕES
========================================================= */

async function abrirModuloReclamacoes(){

  let lista=
    await carregarReclamacoesAdmin();

  mostrarModulo(
    'Reclamações',
    'Atendimento e ocorrências',

    lista.length

      ?lista.map(r=>`

<div
style="
padding:15px;
margin-bottom:10px;
border:1px solid rgba(245,213,140,.12);
border-radius:13px
">

<b
style="color:#f5d58c"
>

${esc(
  r.assunto||
  'Sem assunto'
)}

</b>

<div
style="
color:#aaa;
font-size:11px;
line-height:1.7;
margin:7px 0
">

${esc(
  r.mensagem||''
)}

</div>

<div
style="
font-size:9px;
color:#777
">

Status:
${esc(r.status||'pendente')}

·

${dataHora(r.criado_em)}

</div>

</div>

`).join('')

      :

      '<div style="padding:25px;text-align:center;color:#888">Nenhuma reclamação encontrada.</div>'
  );
}


/* =========================================================
   MÓDULO PAGAMENTOS
========================================================= */

async function abrirModuloPagamentos(){

  let lista=
    await carregarPagamentos();

  mostrarModulo(
    'Pagamentos',
    'Controle financeiro',

    lista.length

      ?lista.map(p=>`

<div
style="
padding:14px;
margin-bottom:9px;
border:1px solid rgba(245,213,140,.12);
border-radius:12px
">

<b
style="color:#f5d58c"
>

${esc(
  p.plano_nome||
  p.plano_codigo||
  'Pagamento'
)}

</b>

<div
style="
font-size:10px;
color:#999;
margin-top:5px
">

Valor:
${moeda(p.valor)}

·

Status:
${esc(p.status||'—')}

</div>

</div>

`).join('')

      :

      '<div style="padding:25px;text-align:center;color:#888">Nenhum pagamento encontrado.</div>'
  );
}


/* =========================================================
   PLANOS
========================================================= */

function abrirModuloPlanos(){

  mostrarModulo(
    'Planos LUX',
    'Recursos e planos',

    `

<div
style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(150px,1fr));
gap:10px
">

${criarBloco(
  'ESSENCE',
  'GRÁTIS',
  'Sua presença começa aqui.'
)}

${criarBloco(
  'DESFIRE',
  'R$ 29,90',
  'Assinatura mensal'
)}

${criarBloco(
  'ELITE',
  'R$ 59,90',
  'Recursos avançados'
)}

${criarBloco(
  'ROYAL',
  'R$ 99,90',
  'Exclusividade e destaque'
)}

</div>

`
  );
}


/* =========================================================
   ASSINATURAS
========================================================= */

async function abrirModuloAssinaturas(){

  let s=obterSupabase();

  let lista=[];

  let erro='';

  if(s){

    let r=
      await s
        .from('assinaturas')
        .select('*')
        .order(
          'created_at',
          {ascending:false}
        );

    if(r.error)
      erro=r.error.message;
    else
      lista=r.data||[];
  }

  mostrarModulo(
    'Assinaturas',
    'Planos e status de assinatura',

    `

<div
style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
gap:10px;
margin-bottom:15px
">

${criarBloco(
  'ESSENCE',
  'GRÁTIS',
  'Plano básico'
)}

${criarBloco(
  'DESFIRE',
  'R$ 29,90',
  'Mensal'
)}

${criarBloco(
  'ELITE',
  'R$ 59,90',
  'Mensal'
)}

${criarBloco(
  'ROYAL',
  'R$ 99,90',
  'Mensal'
)}

</div>

${
erro

?

'<div style="padding:14px;color:#ff9aaa;border:1px solid #642238;border-radius:12px">'+
esc(erro)+
'</div>'

:

lista.length

?

lista.map(a=>`

<div
style="
padding:14px;
border:1px solid rgba(245,213,140,.12);
border-radius:12px;
margin-bottom:9px
">

<b style="color:#f5d58c">

${esc(
a.plano_codigo||
a.plano_nome||
'Assinatura'
)}

</b>

<div
style="
font-size:10px;
color:#999
">

Status:
${esc(a.status||'—')}

</div>

</div>

`).join('')

:

'<div style="color:#888;padding:20px;text-align:center">Nenhuma assinatura registrada.</div>'
}

`
  );
}


/* =========================================================
   AVALIAÇÕES
========================================================= */

async function abrirModuloAvaliacoes(){

  let s=obterSupabase();

  let lista=[];

  let erro='';

  if(s){

    let r=
      await s
        .from('avaliacoes')
        .select('*')
        .order(
          'criado_em',
          {ascending:false}
        );

    if(r.error)
      erro=r.error.message;
    else
      lista=r.data||[];
  }

  mostrarModulo(
    'Avaliações',
    'Notas e reputação dos perfis',

    erro

    ?

    '<div style="padding:14px;color:#ff9aaa;border:1px solid #642238;border-radius:12px">'+
    esc(erro)+
    '</div>'

    :

    lista.length

    ?

    lista.map(a=>`

<div
style="
padding:14px;
border:1px solid rgba(245,213,140,.12);
border-radius:12px;
margin-bottom:9px
">

<b style="color:#f5d58c">

${esc(
a.nota||
a.estrelas||
'—'
)}
★

</b>

<div
style="
font-size:10px;
color:#888
">

Modelo:
${esc(a.modelo_id||'—')}

</div>

<div
style="
font-size:10px;
color:#777
">

${esc(
a.comentario||
a.mensagem||
''
)}

</div>

</div>

`).join('')

    :

    '<div style="color:#888;padding:20px;text-align:center">Nenhuma avaliação encontrada.</div>'
  );
}


/* =========================================================
   DOAÇÕES
========================================================= */

function abrirModuloDoacoes(){

  let a=[];

  try{

    a=
      JSON.parse(
        localStorage.getItem(
          'luxDoacoes'
        )||'[]'
      );

  }catch(e){}

  if(!Array.isArray(a))
    a=[];

  let total=
    a.reduce(
      (s,x)=>
        s+(Number(x.valor)||0),
      0
    );

  mostrarModulo(
    'Doações',
    'Registros e acompanhamento',

    criarBloco(
      'REGISTROS',
      a.length,
      'Contribuições locais'
    )

    +

    criarBloco(
      'TOTAL',
      moeda(total),
      'Soma registrada'
    )

    +

    (

      a.length

      ?

      '<div style="margin-top:15px">'+

      a.map(x=>`

<div
style="
padding:13px;
border:1px solid rgba(245,213,140,.12);
border-radius:12px;
margin-bottom:8px;
color:#aaa
">

${esc(
x.nome||
'Não informado'
)}

·

${moeda(x.valor)}

</div>

`).join('')

      +

      '</div>'

      :

      '<div style="padding:20px;color:#888">Nenhuma contribuição local registrada.</div>'

    )
  );
}


/* =========================================================
   ESTATÍSTICAS
========================================================= */

function abrirModuloEstatisticas(){

  mostrarModulo(
    'Visão geral',
    'Indicadores do sistema',

    `

<div
style="
display:grid;
grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
gap:10px
">

${criarBloco(
  'TOTAL',
  listaPreCadastros.length,
  'Modelos'
)}

${criarBloco(
  'PENDENTES',
  listaPreCadastros.filter(
    x=>x.status==='pendente'
  ).length,
  'Aguardando análise'
)}

${criarBloco(
  'APROVADOS',
  listaPreCadastros.filter(
    x=>x.status==='aprovado'
  ).length,
  'Aprovados'
)}

${criarBloco(
  'REPROVADOS',
  listaPreCadastros.filter(
    x=>x.status==='reprovado'
  ).length,
  'Reprovados'
)}

</div>

`
  );
}


/* =========================================================
   GESTÃO DE MODELOS
========================================================= */

function abrirModuloModelos(){

  let destino=
    document.getElementById(
      'gestao-modelos'
    );

  if(destino){

    destino.scrollIntoView({
      behavior:'smooth'
    });

  }

  carregarModelos();
}

function abrirGestaoModelos(){
  abrirModuloModelos();
}


/* =========================================================
   MOTOR DOS MÓDULOS
========================================================= */

function abrirModuloAdmin(alvo){

  let v=
    String(alvo||'')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'');

  if(v.includes('modelo'))
    return abrirModuloModelos();

  if(v.includes('usu'))
    return abrirModuloUsuarios();

  if(v.includes('reclam'))
    return abrirModuloReclamacoes();

  if(v.includes('plano'))
    return abrirModuloPlanos();

  if(v.includes('pagamento'))
    return abrirModuloPagamentos();

  if(v.includes('assinatura'))
    return abrirModuloAssinaturas();

  if(v.includes('avalia'))
    return abrirModuloAvaliacoes();

  if(v.includes('doa'))
    return abrirModuloDoacoes();

  if(v.includes('estat'))
    return abrirModuloEstatisticas();

  mostrarModulo(
    'Módulo LUX',
    'Área administrativa',
    'Módulo selecionado: '+
    esc(alvo)
  );
}

function abrirModuloCorrespondente(v){
  abrirModuloAdmin(v);
}


/* =========================================================
   CLIQUE DOS CARDS
========================================================= */

function ativarModulosAdmin(){

  document
    .querySelectorAll(
      '.admin-card[data-modulo]'
    )
    .forEach(card=>{

      if(card.dataset.luxModuleBound)
        return;

      card.dataset.luxModuleBound='1';

      card.addEventListener(
        'click',
        e=>{

          e.preventDefault();
          e.stopPropagation();

          abrirModuloAdmin(
            card.dataset.modulo
          );

        }
      );

    });


  document
    .querySelectorAll(
      '[data-admin-target]'
    )
    .forEach(b=>{

      if(b.dataset.luxTargetBound)
        return;

      b.dataset.luxTargetBound='1';

      b.addEventListener(
        'click',
        e=>{

          e.preventDefault();
          e.stopPropagation();

          abrirModuloAdmin(
            b.dataset.adminTarget
          );

        }
      );

    });
}


/* =========================================================
   COMPATIBILIDADE
========================================================= */

async function recarregarPainel(){

  await carregarModelos();

  await carregarReclamacoesAdmin();

  await carregarPagamentos();

  atualizarResumo();
}

async function carregarListaPreCadastros(){
  return carregarModelos();
}

function renderizarPreCadastros(){
  renderizarModelos();
}

function carregarPreCadastros(){
  return carregarModelos();
}

function aprovarPreCadastro(id){
  return aprovarModelo(id);
}

function reprovarPreCadastro(id){
  return reprovarModelo(id);
}

function fecharModal(){
  fecharFichaModelo();
  fecharModuloAdmin();
}

function abrirModalModelo(id){
  abrirFichaModelo(id);
}

function fecharModalModelo(){
  fecharFichaModelo();
}

function atualizarListaModelos(){
  carregarModelos();
}

async function carregarModelosPendentes(){

  let a=
    await carregarModelos();

  return a.filter(
    x=>x.status==='pendente'
  );
}

function testarBancoAdmin(){
  return carregarModelos();
}

function testarModelosPendentes(){
  return carregarModelosPendentes();
}

async function carregarEstatisticas(){

  atualizarResumo();

  return{
    total:listaPreCadastros.length
  };
}


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

function configurarMenuAdmin(){

  let sair=
    document.querySelector(
      '[data-acao="sair"],#btnSair,#sairAdmin'
    );

  if(
    sair &&
    !sair.dataset.luxBound
  ){

    sair.dataset.luxBound='1';

    sair.addEventListener(
      'click',
      sairAdmin
    );
  }
}

function configurarBotoesAdmin(){

  let b=
    document.getElementById(
      'btnRecarregar'
    );

  if(b)
    b.addEventListener(
      'click',
      recarregarPainel
    );
}

function configurarEventosFicha(){

  document.addEventListener(
    'keydown',
    e=>{

      if(e.key==='Escape'){

        fecharFichaModelo();

        fecharModuloAdmin();

      }

    }
  );
}


/* =========================================================
   INICIALIZAÇÃO
========================================================= */

async function inicializarPainelAdmin(){

  if(
    !(await verificarSessaoAdmin())
  )
    return;

  configurarMenuAdmin();

  configurarBotoesAdmin();

  configurarEventosFicha();

  ativarBotoesFiltro();

  ativarModulosAdmin();

  await carregarModelos();

  atualizarResumo();
}

document.addEventListener(
  'DOMContentLoaded',
  inicializarPainelAdmin
);


/* =========================================================
   ATUALIZAÇÃO AUTOMÁTICA
========================================================= */

setInterval(
  ()=>{
    if(
      document.visibilityState===
      'visible'
    )
      carregarModelos();
  },
  60000
);


/* =========================================================
   EXPORTAÇÕES
========================================================= */

window.obterSupabase=
  obterSupabase;

window.verificarSessaoAdmin=
  verificarSessaoAdmin;

window.sairAdmin=
  sairAdmin;

window.carregarModelos=
  carregarModelos;

window.carregarListaPreCadastros=
  carregarListaPreCadastros;

window.carregarPreCadastros=
  carregarPreCadastros;

window.carregarModelosPendentes=
  carregarModelosPendentes;

window.testarModelosPendentes=
  testarModelosPendentes;

window.testarBancoAdmin=
  testarBancoAdmin;

window.renderizarModelos=
  renderizarModelos;

window.renderizarPreCadastros=
  renderizarPreCadastros;

window.abrirVerFichaPorIndice=
  i=>{
    let m=
      listaPreCadastros[i];

    if(m)
      abrirFichaModelo(m.id);
  };

window.abrirFichaModelo=
  abrirFichaModelo;

window.fecharFichaModelo=
  fecharFichaModelo;

window.fecharModalFicha=
  fecharModalFicha;

window.aprovarModelo=
  aprovarModelo;

window.reprovarModelo=
  reprovarModelo;

window.aprovarPreCadastro=
  aprovarPreCadastro;

window.reprovarPreCadastro=
  reprovarPreCadastro;

window.atualizarStatusModelo=
  atualizarStatusModelo;

window.salvarAlteracoes=
  salvarAlteracoes;

window.aplicarFiltroStatus=
  aplicarFiltroStatus;

window.filtrarModelos=
  filtrarModelos;

window.pesquisarModelos=
  pesquisarModelos;

window.carregarUsuarios=
  carregarUsuarios;

window.carregarUsuariosAdmin=
  carregarUsuariosAdmin;

window.atualizarStatusUsuario=
  atualizarStatusUsuario;

window.carregarReclamacoes=
  carregarReclamacoes;

window.carregarReclamacoesAdmin=
  carregarReclamacoesAdmin;

window.atualizarStatusReclamacao=
  atualizarStatusReclamacao;

window.abrirReclamacao=
  abrirReclamacao;

window.carregarPagamentos=
  carregarPagamentos;

window.carregarEstatisticas=
  carregarEstatisticas;

window.recarregarPainel=
  recarregarPainel;

window.abrirModuloAdmin=
  abrirModuloAdmin;

window.abrirModuloCorrespondente=
  abrirModuloCorrespondente;

window.abrirGestaoModelos=
  abrirGestaoModelos;

window.abrirModuloModelos=
  abrirModuloModelos;

window.abrirModuloUsuarios=
  abrirModuloUsuarios;

window.abrirModuloReclamacoes=
  abrirModuloReclamacoes;

window.abrirModuloPlanos=
  abrirModuloPlanos;

window.abrirModuloPagamentos=
  abrirModuloPagamentos;

window.abrirModuloAssinaturas=
  abrirModuloAssinaturas;

window.abrirModuloAvaliacoes=
  abrirModuloAvaliacoes;

window.abrirModuloDoacoes=
  abrirModuloDoacoes;

window.abrirModuloEstatisticas=
  abrirModuloEstatisticas;

window.mostrarModulo=
  mostrarModulo;

window.fecharModuloAdmin=
  fecharModuloAdmin;
