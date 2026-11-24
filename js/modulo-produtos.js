import { db, estado, salvarTudo } from './db.js';
import { baixarArquivo } from './formatadores.js';
import { estadoVendas } from './modulo-vendas.js';

export const estadoProdutos = {
  editandoProdutoIdx: null
};

export function iniciarEdicaoProduto(index) {
  const p = estado.produtos[index];
  if (!p) return null;
  estadoProdutos.editandoProdutoIdx = index;
  return p;
}

export function cancelarEdicaoProduto() {
  estadoProdutos.editandoProdutoIdx = null;
}

export function salvarProduto(nomeDigitado) {
  const nome = (nomeDigitado || '').trim().toUpperCase();

  if (!nome) {
    return { ok: false, msg: 'Digite o nome do produto.' };
  }

  const duplicado = estado.produtos.some(
    (p, idx) => idx !== estadoProdutos.editandoProdutoIdx && p === nome
  );
  if (duplicado) {
    return { ok: false, msg: 'Este produto já está cadastrado.' };
  }

  if (estadoProdutos.editandoProdutoIdx !== null) {
    const nomeAntigo = estado.produtos[estadoProdutos.editandoProdutoIdx];
    estado.produtos[estadoProdutos.editandoProdutoIdx] = nome;
    db.salvar('app_produtos', estado.produtos);

    estado.vendas.forEach(v => {
      if (Array.isArray(v.itens)) {
        v.itens.forEach(item => {
          if (item.prod === nomeAntigo) item.prod = nome;
        });
      }
    });
    db.salvar('app_vendas', estado.vendas);

    estadoVendas.carrinho.forEach(item => {
      if (item.prod === nomeAntigo) item.prod = nome;
    });
    if (estadoVendas.produtoSelecionado === nomeAntigo) {
      estadoVendas.produtoSelecionado = nome;
    }

    cancelarEdicaoProduto();
    return { ok: true, msg: 'Produto atualizado com sucesso!', editado: true, nome };
  }

  estado.produtos.push(nome);
  db.salvar('app_produtos', estado.produtos);
  return { ok: true, msg: 'Produto cadastrado com sucesso!', editado: false, nome };
}

export function removerProduto(index) {
  let cancelouEdicao = false;
  if (estadoProdutos.editandoProdutoIdx === index) {
    cancelarEdicaoProduto();
    cancelouEdicao = true;
  } else if (estadoProdutos.editandoProdutoIdx !== null && index < estadoProdutos.editandoProdutoIdx) {
    estadoProdutos.editandoProdutoIdx--;
  }

  estado.produtos.splice(index, 1);
  db.salvar('app_produtos', estado.produtos);
  return { ok: true, msg: 'Produto excluído.', cancelouEdicao };
}

export function exportarProdutosCSV() {
  if (estado.produtos.length === 0) {
    return { ok: false, msg: 'Nenhum produto cadastrado.' };
  }

  let csv = '\uFEFFProduto\n';
  estado.produtos.forEach(p => {
    csv += `"${p}"\n`;
  });

  baixarArquivo(csv, 'produtos.csv', 'text/csv;charset=utf-8;');
  return { ok: true, msg: 'Planilha de produtos exportada!' };
}

export function importarProdutosTextoCSV(textoCSV) {
  const linhas = textoCSV.split(/\r?\n/).slice(1);
  let novos = 0;

  linhas.forEach(linha => {
    const nome = linha.replace(/^"|"$/g, '').trim().toUpperCase();
    if (nome && !estado.produtos.includes(nome)) {
      estado.produtos.push(nome);
      novos++;
    }
  });

  db.salvar('app_produtos', estado.produtos);
  return { ok: true, msg: `${novos} produto(s) importado(s) com sucesso!` };
}

export function exportarBackupJSON() {
  const pacote = {
    produtos: estado.produtos,
    clientes: estado.clientes,
    vendas: estado.vendas
  };
  baixarArquivo(JSON.stringify(pacote, null, 2), 'backup_sistema_vendas.json', 'application/json');
  return { ok: true, msg: 'Backup completo salvo!' };
}

export function importarBackupTextoJSON(textoJSON) {
  try {
    const dados = JSON.parse(textoJSON);
    if (Array.isArray(dados.produtos)) estado.produtos = dados.produtos;
    if (Array.isArray(dados.clientes)) estado.clientes = dados.clientes;
    if (Array.isArray(dados.vendas)) estado.vendas = dados.vendas;
    salvarTudo();
    return { ok: true, msg: 'Backup restaurado com sucesso!' };
  } catch (err) {
    return { ok: false, msg: 'Arquivo de backup inválido.' };
  }
}
