import { db, estado } from './db.js';
import { formatarBR, baixarArquivo, compartilharTexto } from './formatadores.js';

export const estadoVendas = {
  clienteSelecionado: null,
  produtoSelecionado: null,
  carrinho: [],
  editandoVendaIdx: null
};

export function selecionarClienteVenda(cliente) {
  estadoVendas.clienteSelecionado = cliente;
}

export function limparClienteVenda() {
  estadoVendas.clienteSelecionado = null;
}

export function selecionarProdutoVenda(produto) {
  estadoVendas.produtoSelecionado = produto;
}

export function limparProdutoVenda() {
  estadoVendas.produtoSelecionado = null;
}

export function adicionarItemCarrinho(qtd, val) {
  if (!estadoVendas.produtoSelecionado) {
    return { ok: false, msg: 'Pesquise e toque em um produto primeiro.' };
  }
  if (isNaN(qtd) || qtd <= 0) {
    return { ok: false, msg: 'Quantidade inválida.' };
  }
  if (val <= 0) {
    return { ok: false, msg: 'Digite um valor maior que zero.' };
  }

  estadoVendas.carrinho.push({
    prod: estadoVendas.produtoSelecionado,
    qtd,
    val,
    sub: qtd * val
  });

  estadoVendas.produtoSelecionado = null;
  return { ok: true, msg: 'Item adicionado!' };
}

export function removerItemCarrinho(index) {
  estadoVendas.carrinho.splice(index, 1);
}

export function calcularResumoCarrinho(descontoValor) {
  const sub = estadoVendas.carrinho.reduce((acc, item) => acc + item.sub, 0);
  const desc = Math.max(0, descontoValor || 0);
  const tot = Math.max(0, sub - desc);
  return { sub, desc, tot };
}

export function iniciarEdicaoVenda(index) {
  const v = estado.vendas[index];
  if (!v) return null;

  estadoVendas.editandoVendaIdx = index;
  estadoVendas.carrinho = (v.itens || []).map(item => ({
    prod: item.prod,
    qtd: item.qtd,
    val: item.val,
    sub: item.sub !== undefined ? item.sub : item.qtd * item.val
  }));

  const clienteEncontrado = estado.clientes.find(
    c => `${c.nome} (${c.cpf})` === v.cliente || c.nome === v.cliente
  );

  estadoVendas.clienteSelecionado = clienteEncontrado || null;
  return {
    venda: v,
    clienteEncontrado
  };
}

export function cancelarEdicaoVenda() {
  estadoVendas.editandoVendaIdx = null;
  estadoVendas.carrinho = [];
  estadoVendas.clienteSelecionado = null;
}

export function salvarVenda(textoClienteManual, descontoValor, obsTexto) {
  const nomeClienteFinal = estadoVendas.clienteSelecionado
    ? `${estadoVendas.clienteSelecionado.nome} (${estadoVendas.clienteSelecionado.cpf})`
    : (estadoVendas.editandoVendaIdx !== null && textoClienteManual ? textoClienteManual : '');

  if (!nomeClienteFinal) {
    return { ok: false, msg: 'Selecione um cliente antes de finalizar.' };
  }
  if (estadoVendas.carrinho.length === 0) {
    return { ok: false, msg: 'Adicione pelo menos 1 produto.' };
  }

  const { sub, desc, tot } = calcularResumoCarrinho(descontoValor);
  const obs = (obsTexto || '').trim();

  if (estadoVendas.editandoVendaIdx !== null) {
    const vendaOriginal = estado.vendas[estadoVendas.editandoVendaIdx];
    estado.vendas[estadoVendas.editandoVendaIdx] = {
      data: vendaOriginal ? vendaOriginal.data : new Date().toLocaleDateString('pt-BR'),
      cliente: nomeClienteFinal,
      itens: [...estadoVendas.carrinho],
      sub,
      desc,
      tot,
      obs
    };
    db.salvar('app_vendas', estado.vendas);
    cancelarEdicaoVenda();
    return { ok: true, msg: 'Venda atualizada com sucesso!', editado: true };
  }

  estado.vendas.unshift({
    data: new Date().toLocaleDateString('pt-BR'),
    cliente: nomeClienteFinal,
    itens: [...estadoVendas.carrinho],
    sub,
    desc,
    tot,
    obs
  });

  db.salvar('app_vendas', estado.vendas);
  estadoVendas.carrinho = [];
  estadoVendas.clienteSelecionado = null;
  return { ok: true, msg: 'Venda registrada com sucesso!', editado: false };
}

export function compartilharVenda(index, onFallback) {
  const v = estado.vendas[index];
  if (!v) return;

  const listaItens = v.itens
    .map(i => `• ${i.qtd}x ${i.prod} (R$ ${formatarBR(i.val)}) = R$ ${formatarBR(i.sub)}`)
    .join('\n');

  let msg = `*RESUMO DO PEDIDO*\n*Data:* ${v.data}\n*Cliente:* ${v.cliente}\n\n*Itens:*\n${listaItens}\n\n*Subtotal:* R$ ${formatarBR(v.sub)}\n`;
  if (v.desc > 0) msg += `*Desconto:* R$ ${formatarBR(v.desc)}\n`;
  msg += `*Total Final:* R$ ${formatarBR(v.tot)}`;
  if (v.obs) msg += `\n*Obs:* ${v.obs}`;

  compartilharTexto('Resumo do Pedido', msg, onFallback);
}

export function exportarVendasCSV() {
  if (estado.vendas.length === 0) {
    return { ok: false, msg: 'Nenhuma venda registrada.' };
  }

  let csv = '\uFEFFData;Cliente;Produtos;Subtotal;Desconto;Total Final;Observacao\n';
  estado.vendas.forEach(v => {
    const itens = v.itens.map(i => `${i.qtd}x ${i.prod} (R$ ${formatarBR(i.val)})`).join(' | ');
    csv += `"${v.data}";"${v.cliente}";"${itens}";"${formatarBR(v.sub)}";"${formatarBR(v.desc)}";"${formatarBR(v.tot)}";"${v.obs || ''}"\n`;
  });

  baixarArquivo(csv, 'vendas.csv', 'text/csv;charset=utf-8;');
  return { ok: true, msg: 'Planilha de vendas exportada!' };
}
