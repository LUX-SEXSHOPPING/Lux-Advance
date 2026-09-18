// =============================================================
// LUX‑ADVANCE — PAINEL ADMINISTRATIVO | VERSÃO V‑1.01
// =============================================================
let listaPreCadastros = [];
let filtroStatus = 'todos';
let indiceSelecionado = null;

document.addEventListener('DOMContentLoaded', async () => {
 await carregarListaPreCadastros();
 ativarBotoesFiltro();
});

async function carregarListaPreCadastros(){
 try{
  listaPreCadastros = JSON.parse(localStorage.getItem('fichasPreCadastro') || '[]');
  aplicarFiltroERenderizar();
 }catch(erro){console.error('Erro:',erro);document.getElementById('lista‑precadastros').innerHTML=`<p>Erro ao carregar.</p>`;}
}

function ativarBotoesFiltro(){
 document.querySelectorAll('.btn‑filtro').forEach(b=>{b.addEventListener('click',()=>{
  document.querySelectorAll('.btn‑filtro').forEach(x=>x.classList.remove('ativo'));b.classList.add('ativo');
  filtroStatus = b.dataset.filtro;aplicarFiltroERenderizar();
 });});
}

function aplicarFiltroERenderizar(){
 let dados = [...listaPreCadastros];
 if(filtroStatus!=='todos') dados = dados.filter(f=>f.status===filtroStatus);
 desenharLista(dados);
}

function desenharLista(lista){
 const container=document.getElementById('lista‑precadastros');
 if(!lista.length){container.innerHTML=`<p style="grid‑column:1/‑1;text‑align:center;color:#777">Nenhum registro encontrado.</p>`;return;}
 container.innerHTML=lista.map((f,i)=>`<div class="card‑registro">
  <h4>${f.nome||'Sem nome'}</h4>
  <p>📱 ${f.whatsapp||'—'}</p>
  <p>📅 ${f.dataEnvio||'—'}</p>
  <p>Status: <span class="status‑${f.status||'pendente'}">${(f.status||'pendente').toUpperCase()}</span></p>
  <button class="btn btn‑secundario" style="margin‑top:8px" onclick="abrirVerFicha(${i})">Ver ficha completa</button>
 </div>`).join('');
}

function abrirVerFicha(indice){
 indiceSelecionado=indice;const d=listaPreCadastros[indice];
 document.getElementById('corpo‑ficha').innerHTML=`
  <p><strong>Nome/Apelido:</strong> ${d.nome||'—'}</p>
  <p><strong>WhatsApp:</strong> ${d.whatsapp||'—'}</p>
  <p><strong>Idade:</strong> ${d.idade||'—'} anos</p>
  <p><strong>Altura:</strong> ${d.altura||'—'} m</p>
  <p><strong>Cidade/UF:</strong> ${d.cidade||'—'}</p>
  <p><strong>Informações:</strong><br>${d.sobre||'—'}</p>
  ${(d.fotos?.length)?`<p><strong>Fotos:</strong><br>${d.fotos.map(u=>`<img src="${u}">`).join('')}</p>`:'<p><strong>Fotos:</strong> Nenhuma</p>'}
  ${d.video?`<p><strong>Vídeo:</strong><br><video controls src="${d.video}"></video></p>`:'<p><strong>Vídeo:</strong> Nenhum enviado</p>'}
 `;
 document.getElementById('modal‑ver‑ficha').style.display='flex';
}
function fecharModalFicha(){document.getElementById('modal‑ver‑ficha').style.display='none';indiceSelecionado=null;}
async function salvarAlteracoes(){localStorage.setItem('fichasPreCadastro',JSON.stringify(listaPreCadastros));aplicarFiltroERenderizar();}
document.addEventListener('click',async e=>{
 if(e.target.id==='botao‑aprovar'&&indiceSelecionado!==null){listaPreCadastros[indiceSelecionado].status='aprovado';await salvarAlteracoes();fecharModalFicha();}
 if(e.target.id==='botao‑rejeitar'&&indiceSelecionado!==null){listaPreCadastros[indiceSelecionado].status='rejeitado';await salvarAlteracoes();fecharModalFicha();}
});
function imprimirFicha(){if(indiceSelecionado===null)return;window.print();}
window.onclick=e=>{const m=document.getElementById('modal‑ver‑ficha');if(e.target===m)fecharModalFicha();};
