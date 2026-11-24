import { estado } from './db.js';
import { formatarBR, lerMoeda } from './formatadores.js';
import {
  estadoVendas,
  selecionarClienteVenda,
  limparClienteVenda,
  selecionarProdutoVenda,
  limparProdutoVenda,
  removerItemCarrinho,
  calcularResumoCarrinho,
  iniciarEdicaoVenda,
  compartilharVenda
} from './modulo-vendas.js';
import {
  iniciarEdicaoCliente,
  removerCliente,
  compartilharCliente
} from './modulo-clientes.js';
import {
  iniciarEdicaoProduto,
  removerProduto
} from './modulo-produtos.js';

let timerAviso = null;
let callbacksAcoes = {};

export function registrarCallbacksUI(callbacks) {
  callbacksAcoes = callbacks || {};
}

export function avisar(msg, erro = false) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.style.display = 'block';
  el.style.background = erro ? '#f8d7da' : '#d4edda';
  el.style.color = erro ? '#721c24' : '#155724';
  clearTimeout(timerAviso);
  timerAviso = setTimeout(() => {
    el.style.display = 'none';
  }, 3500);
}

export function mudarAba(idAba, botao) {
  document.querySelectorAll('.aba').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(idAba).classList.add('active');
  if (botao) botao.classList.add('active');
}

export function ativarAbaPorId(idAba) {
  const btns = document.querySelectorAll('.tab-btn');
  const mapa = { 'aba-vendas': 0, 'aba-clientes': 1, 'aba-produtos': 2 };
  mudarAba(idAba, btns[mapa[idAba]]);
}

export function fecharSugestoes() {
  document.getElementById('sugestoes-clientes').style.display = 'none';
  document.getElementById('sugestoes-produtos').style.display = 'none';
}

// --- CLIENTE SELECIONADO E AUTOCOMPLETE ---
export function renderizarClienteSelecionado(cliente) {
  if (cliente) {
    document.getElementById('busca-cliente').style.display = 'none';
    document.getElementById('sugestoes-clientes').style.display = 'none';
    document.getElementById('cliente-selecionado-texto').textContent = `${cliente.nome} (${cliente.cpf})`;
    document.getElementById('cliente-selecionado-box').style.display = 'flex';
  } else {
    document.getElementById('cliente-selecionado-box').style.display = 'none';
    const input = document.getElementById('busca-cliente');
    input.value = '';
    input.style.display = 'block';
  }
}

export function filtrarClientesUI() {
  const termo = document.getElementById('busca-cliente').value.toLowerCase().trim();
  const box = document.getElementById('sugestoes-clientes');
  box.innerHTML = '';

  const filtrados = estado.clientes.filter(
    c => c.nome.toLowerCase().includes(termo) || c.cpf.includes(termo)
  );

  if (filtrados.length === 0) {
    box.innerHTML = '<div class="sugestao-item" style="color:#888;">Nenhum cliente encontrado</div>';
  } else {
    filtrados.forEach(c => {
      const div = document.createElement('div');
      div.className = 'sugestao-item';
      div.textContent = `${c.nome} (${c.cpf})`;
      div.onclick = () => {
        selecionarClienteVenda(c);
        renderizarClienteSelecionado(c);
      };
      box.appendChild(div);
    });
  }
  box.style.display = 'block';
}

export function trocarClienteUI() {
  limparClienteVenda();
  renderizarClienteSelecionado(null);
  document.getElementById('busca-cliente').focus();
}

// --- PRODUTO SELECIONADO E AUTOCOMPLETE ---
export function renderizarProdutoSelecionado(produto) {
  if (produto) {
    document.getElementById('busca-produto').style.display = 'none';
    document.getElementById('sugestoes-produtos').style.display = 'none';
    document.getElementById('produto-selecionado-texto').textContent = produto;
    document.getElementById('produto-selecionado-box').style.display = 'flex';
  } else {
    document.getElementById('produto-selecionado-box').style.display = 'none';
    const input = document.getElementById('busca-produto');
    input.value = '';
    input.style.display = 'block';
  }
}

export function filtrarProdutosUI() {
  const termo = document.getElementById('busca-produto').value.toLowerCase().trim();
  const box = document.getElementById('sugestoes-produtos');
  box.innerHTML = '';

  const filtrados = estado.produtos.filter(p => p.toLowerCase().includes(termo));

  if (filtrados.length === 0) {
    box.innerHTML = '<div class="sugestao-item" style="color:#888;">Nenhum produto encontrado</div>';
  } else {
    filtrados.forEach(p => {
      const div = document.createElement('div');
      div.className = 'sugestao-item';
      div.textContent = p;
      div.onclick = () => {
        selecionarProdutoVenda(p);
        renderizarProdutoSelecionado(p);
        document.getElementById('valor').focus();
      };
      box.appendChild(div);
    });
  }
  box.style.display = 'block';
}

export function trocarProdutoUI() {
  limparProdutoVenda();
  renderizarProdutoSelecionado(null);
  document.getElementById('busca-produto').focus();
}

// --- CARRINHO E TOTAIS ---
export function calcularTotaisCarrinhoUI() {
  const descValor = lerMoeda(document.getElementById('desconto').value);
  const { sub, desc, tot } = calcularResumoCarrinho(descValor);

  document.getElementById('sub-pedido').textContent = formatarBR(sub);
  document.getElementById('desc-pedido').textContent = formatarBR(desc);
  document.getElementById('tot-pedido').textContent = formatarBR(tot);
}

export function desenharCarrinho() {
  const box = document.getElementById('lista-carrinho');
  box.innerHTML = '';

  estadoVendas.carrinho.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'item-carrinho';

    const info = document.createElement('div');
    info.className = 'item-carrinho-info';
    info.innerHTML = `<strong>${item.qtd}x ${item.prod}</strong><br><small>Unit: R$ ${formatarBR(item.val)} | Subtotal: <strong>R$ ${formatarBR(item.sub)}</strong></small>`;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-del';
    btn.textContent = 'X';
    btn.onclick = () => {
      removerItemCarrinho(i);
      desenharCarrinho();
    };

    div.appendChild(info);
    div.appendChild(btn);
    box.appendChild(div);
  });

  calcularTotaisCarrinhoUI();
}

// --- BANNERS E FORMULÁRIOS DE EDIÇÃO ---
export function aplicarModoEdicaoVendaUI(resultadoEdicao) {
  if (!resultadoEdicao) return;
  const { venda, clienteEncontrado } = resultadoEdicao;

  if (clienteEncontrado) {
    renderizarClienteSelecionado(clienteEncontrado);
  } else {
    renderizarClienteSelecionado(null);
    document.getElementById('busca-cliente').value = venda.cliente || '';
  }

  document.getElementById('desconto').value = formatarBR(venda.desc || 0);
  document.getElementById('obs').value = venda.obs || '';
  document.getElementById('banner-edit-venda').style.display = 'flex';
  document.getElementById('btn-salvar-venda').textContent = 'Salvar Alterações da Venda';
  document.getElementById('btn-cancelar-venda').style.display = 'block';

  desenharCarrinho();
  ativarAbaPorId('aba-vendas');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  avisar('Modo de edição de pedido ativado.');
}

export function resetarFormularioVendaUI() {
  document.getElementById('desconto').value = '0,00';
  document.getElementById('obs').value = '';
  document.getElementById('banner-edit-venda').style.display = 'none';
  document.getElementById('btn-salvar-venda').textContent = 'Finalizar e Registrar Venda';
  document.getElementById('btn-cancelar-venda').style.display = 'none';
  renderizarClienteSelecionado(null);
  desenharCarrinho();
}

export function limparFormClienteUI() {
  ['cli-nome', 'cli-cpf', 'cli-tel', 'cli-email', 'cli-cep', 'cli-rua', 'cli-bairro', 'cli-cidade'].forEach(id => {
    document.getElementById(id).value = '';
  });
}

export function preencherFormClienteUI(c) {
  document.getElementById('cli-nome').value = c.nome || '';
  document.getElementById('cli-cpf').value = c.cpf || '';
  document.getElementById('cli-tel').value = c.tel || '';
  document.getElementById('cli-email').value = c.email || '';
  document.getElementById('cli-cep').value = c.cep || '';
  document.getElementById('cli-rua').value = c.rua || '';
  document.getElementById('cli-bairro').value = c.bairro || '';
  document.getElementById('cli-cidade').value = c.cidade || '';

  document.getElementById('titulo-form-cliente').textContent = 'Editar Cliente';
  document.getElementById('banner-edit-cliente').style.display = 'flex';
  document.getElementById('btn-salvar-cliente').textContent = 'Salvar Alterações do Cliente';
  document.getElementById('btn-cancelar-cliente').style.display = 'block';
  document.getElementById('cli-nome').focus();
  avisar('Modo de edição de cliente ativado.');
}

export function resetarFormClienteUI() {
  limparFormClienteUI();
  document.getElementById('titulo-form-cliente').textContent = 'Novo Cliente';
  document.getElementById('banner-edit-cliente').style.display = 'none';
  document.getElementById('btn-salvar-cliente').textContent = 'Salvar Cliente';
  document.getElementById('btn-cancelar-cliente').style.display = 'none';
}

export function preencherFormProdutoUI(nome) {
  document.getElementById('prod-nome').value = nome;
  document.getElementById('titulo-form-produto').textContent = 'Editar Produto';
  document.getElementById('banner-edit-produto').style.display = 'flex';
  document.getElementById('btn-salvar-produto').textContent = 'Salvar Alterações do Produto';
  document.getElementById('btn-cancelar-produto').style.display = 'block';
  document.getElementById('prod-nome').focus();
  avisar('Modo de edição de produto ativado.');
}

export function resetarFormProdutoUI() {
  document.getElementById('prod-nome').value = '';
  document.getElementById('titulo-form-produto').textContent = 'Novo Produto';
  document.getElementById('banner-edit-produto').style.display = 'none';
  document.getElementById('btn-salvar-produto').textContent = 'Salvar Produto';
  document.getElementById('btn-cancelar-produto').style.display = 'none';
}

// --- RENDERIZAÇÃO DE LISTAS ---
export function desenharVendas() {
  const container = document.getElementById('lista-vendas');
  container.innerHTML = '';

  let somaVendido = 0;
  let somaDesconto = 0;

  estado.vendas.forEach((v, i) => {
    somaVendido += v.tot;
    somaDesconto += v.desc;
    const itensHtml = v.itens.map(item => `• ${item.qtd}x ${item.prod} (R$ ${formatarBR(item.sub)})`).join('<br>');

    const card = document.createElement('div');
    card.className = 'venda-card';
    card.innerHTML = `
      <div class="venda-card-header">
        <span>${v.cliente}</span>
        <span style="color:#666; font-weight:normal; white-space:nowrap;">${v.data}</span>
      </div>
      <div class="venda-card-itens">${itensHtml}</div>
      <div class="venda-card-footer">
        <span>Desc: <strong>R$ ${formatarBR(v.desc)}</strong></span>
        <span style="font-size:16px; color:#28a745;">Total: <strong>R$ ${formatarBR(v.tot)}</strong></span>
      </div>
      ${v.obs ? `<div style="font-size:12px; color:#666; margin-bottom:8px;"><strong>Obs:</strong> ${v.obs}</div>` : ''}
      <div class="acoes-card"></div>
    `;

    const acoes = card.querySelector('.acoes-card');

    const btnShare = document.createElement('button');
    btnShare.type = 'button';
    btnShare.className = 'btn-share-full';
    btnShare.textContent = 'Compartilhar Pedido';
    btnShare.onclick = () => compartilharVenda(i, () => avisar('Texto copiado! Abrindo WhatsApp...'));

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn-edit-full';
    btnEdit.textContent = 'Editar';
    btnEdit.onclick = () => aplicarModoEdicaoVendaUI(iniciarEdicaoVenda(i));

    acoes.appendChild(btnShare);
    acoes.appendChild(btnEdit);
    container.appendChild(card);
  });

  document.getElementById('total-geral-vendido').textContent = `R$ ${formatarBR(somaVendido)}`;
  document.getElementById('total-geral-desconto').textContent = `R$ ${formatarBR(somaDesconto)}`;
}

export function desenharClientesCards() {
  const container = document.getElementById('lista-clientes-cards');
  container.innerHTML = '';

  estado.clientes.forEach((c, i) => {
    const contato = [c.tel, c.email].filter(Boolean).join(' • ') || 'Sem contato';
    const endereco = [c.rua, c.bairro, c.cidade, c.cep].filter(Boolean).join(', ') || 'Sem endereço';
    const tipoDoc = c.cpf.replace(/\D/g, '').length === 14 ? 'CNPJ' : 'CPF';

    const card = document.createElement('div');
    card.className = 'venda-card';
    card.style.borderLeftColor = '#007bff';
    card.innerHTML = `
      <div class="venda-card-header">
        <span>${c.nome}</span>
        <div class="acoes-card"></div>
      </div>
      <div style="font-size: 13px; color: #555; line-height: 1.5;">
        <strong>${tipoDoc}:</strong> ${c.cpf}<br>
        <strong>Contato:</strong> ${contato}<br>
        <strong>End:</strong> ${endereco}
      </div>
    `;

    const acoes = card.querySelector('.acoes-card');

    const btnShare = document.createElement('button');
    btnShare.type = 'button';
    btnShare.className = 'btn-share-sm';
    btnShare.textContent = 'Enviar';
    btnShare.onclick = () => compartilharCliente(i, () => avisar('Texto copiado! Abrindo WhatsApp...'));

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn-edit';
    btnEdit.textContent = 'Editar';
    btnEdit.onclick = () => {
      const cli = iniciarEdicaoCliente(i);
      if (cli) preencherFormClienteUI(cli);
    };

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'btn-del';
    btnDel.textContent = 'Excluir';
    btnDel.onclick = () => {
      const res = removerCliente(i);
      if (res.cancelouEdicao) resetarFormClienteUI();
      desenharClientesCards();
      avisar(res.msg);
    };

    acoes.appendChild(btnShare);
    acoes.appendChild(btnEdit);
    acoes.appendChild(btnDel);
    container.appendChild(card);
  });
}

export function desenharProdutosCards() {
  const container = document.getElementById('lista-produtos-cards');
  container.innerHTML = '';

  estado.produtos.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'venda-card';
    card.style.borderLeftColor = '#6c757d';
    card.style.padding = '10px 12px';
    card.innerHTML = `
      <div class="venda-card-header" style="margin: 0; align-items: center;">
        <span style="font-size: 13px; padding-right: 8px; flex: 1;">${p}</span>
        <div class="acoes-card"></div>
      </div>
    `;

    const acoes = card.querySelector('.acoes-card');

    const btnEdit = document.createElement('button');
    btnEdit.type = 'button';
    btnEdit.className = 'btn-edit';
    btnEdit.textContent = 'Editar';
    btnEdit.onclick = () => {
      const prod = iniciarEdicaoProduto(i);
      if (prod) preencherFormProdutoUI(prod);
    };

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'btn-del';
    btnDel.textContent = 'Excluir';
    btnDel.onclick = () => {
      const res = removerProduto(i);
      if (res.cancelouEdicao) resetarFormProdutoUI();
      desenharProdutosCards();
      avisar(res.msg);
    };

    acoes.appendChild(btnEdit);
    acoes.appendChild(btnDel);
    container.appendChild(card);
  });
}
