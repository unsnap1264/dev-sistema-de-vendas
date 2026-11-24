import {
  cursorNoFinal,
  mascaraMoeda,
  lerMoeda,
  mascaraDoc,
  mascaraTel,
  mascaraCEP
} from './formatadores.js';
import {
  estadoVendas,
  adicionarItemCarrinho,
  cancelarEdicaoVenda,
  salvarVenda,
  exportarVendasCSV
} from './modulo-vendas.js';
import {
  cancelarEdicaoCliente,
  salvarCliente,
  exportarClientesCSV,
  importarClientesTextoCSV
} from './modulo-clientes.js';
import {
  cancelarEdicaoProduto,
  salvarProduto,
  exportarProdutosCSV,
  importarProdutosTextoCSV,
  exportarBackupJSON,
  importarBackupTextoJSON
} from './modulo-produtos.js';
import {
  avisar,
  mudarAba,
  fecharSugestoes,
  renderizarClienteSelecionado,
  filtrarClientesUI,
  trocarClienteUI,
  renderizarProdutoSelecionado,
  filtrarProdutosUI,
  trocarProdutoUI,
  calcularTotaisCarrinhoUI,
  desenharCarrinho,
  resetarFormularioVendaUI,
  limparFormClienteUI,
  resetarFormClienteUI,
  resetarFormProdutoUI,
  desenharVendas,
  desenharClientesCards,
  desenharProdutosCards
} from './ui.js';

function lerArquivoTexto(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => callback(e.target.result);
  reader.readAsText(file, 'UTF-8');
}

function vincularEventos() {
  // Navegação entre abas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mudarAba(btn.dataset.aba, btn);
    });
  });

  // Fechar sugestões ao clicar fora de .campo
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.campo')) {
      fecharSugestoes();
    }
  });

  // --- ABA 1: VENDAS ---
  const inputBuscaCliente = document.getElementById('busca-cliente');
  inputBuscaCliente.addEventListener('focus', filtrarClientesUI);
  inputBuscaCliente.addEventListener('input', filtrarClientesUI);
  document.getElementById('btn-trocar-cliente').addEventListener('click', trocarClienteUI);

  const inputBuscaProduto = document.getElementById('busca-produto');
  inputBuscaProduto.addEventListener('focus', filtrarProdutosUI);
  inputBuscaProduto.addEventListener('input', filtrarProdutosUI);
  document.getElementById('btn-trocar-produto').addEventListener('click', trocarProdutoUI);

  const inputValor = document.getElementById('valor');
  inputValor.addEventListener('focus', () => cursorNoFinal(inputValor));
  inputValor.addEventListener('click', () => cursorNoFinal(inputValor));
  inputValor.addEventListener('input', () => mascaraMoeda(inputValor));

  document.getElementById('btn-add-item').addEventListener('click', () => {
    const qtd = parseInt(document.getElementById('qtd').value, 10);
    const val = lerMoeda(document.getElementById('valor').value);
    const res = adicionarItemCarrinho(qtd, val);

    if (!res.ok) {
      return avisar(res.msg, true);
    }

    document.getElementById('qtd').value = 1;
    document.getElementById('valor').value = '0,00';
    renderizarProdutoSelecionado(null);
    desenharCarrinho();
    avisar(res.msg);
  });

  const inputDesconto = document.getElementById('desconto');
  inputDesconto.addEventListener('focus', () => cursorNoFinal(inputDesconto));
  inputDesconto.addEventListener('click', () => cursorNoFinal(inputDesconto));
  inputDesconto.addEventListener('input', () => {
    mascaraMoeda(inputDesconto);
    calcularTotaisCarrinhoUI();
  });

  document.getElementById('btn-salvar-venda').addEventListener('click', () => {
    const textoClienteManual = document.getElementById('busca-cliente').value.trim();
    const descValor = lerMoeda(document.getElementById('desconto').value);
    const obsTexto = document.getElementById('obs').value;

    const res = salvarVenda(textoClienteManual, descValor, obsTexto);
    if (!res.ok) {
      return avisar(res.msg, true);
    }

    resetarFormularioVendaUI();
    desenharVendas();
    avisar(res.msg);
  });

  const aoCancelarVenda = () => {
    cancelarEdicaoVenda();
    resetarFormularioVendaUI();
  };
  document.getElementById('btn-cancelar-venda').addEventListener('click', aoCancelarVenda);
  document.getElementById('btn-banner-cancelar-venda').addEventListener('click', aoCancelarVenda);

  document.getElementById('btn-exportar-vendas').addEventListener('click', () => {
    const res = exportarVendasCSV();
    avisar(res.msg, !res.ok);
  });

  // --- ABA 2: CLIENTES ---
  const inputCpf = document.getElementById('cli-cpf');
  inputCpf.addEventListener('input', () => mascaraDoc(inputCpf));

  const inputTel = document.getElementById('cli-tel');
  inputTel.addEventListener('input', () => mascaraTel(inputTel));

  const inputCep = document.getElementById('cli-cep');
  inputCep.addEventListener('input', () => mascaraCEP(inputCep));

  document.getElementById('btn-salvar-cliente').addEventListener('click', () => {
    const dados = {
      nome: document.getElementById('cli-nome').value,
      cpf: document.getElementById('cli-cpf').value,
      tel: document.getElementById('cli-tel').value,
      email: document.getElementById('cli-email').value,
      cep: document.getElementById('cli-cep').value,
      rua: document.getElementById('cli-rua').value,
      bairro: document.getElementById('cli-bairro').value,
      cidade: document.getElementById('cli-cidade').value
    };

    const res = salvarCliente(dados);
    if (!res.ok) {
      return avisar(res.msg, true);
    }

    if (res.editado) {
      resetarFormClienteUI();
      if (estadoVendas.clienteSelecionado) {
        renderizarClienteSelecionado(estadoVendas.clienteSelecionado);
      }
    } else {
      limparFormClienteUI();
      renderizarClienteSelecionado(res.cliente);
    }

    desenharClientesCards();
    avisar(res.msg);
  });

  const aoCancelarCliente = () => {
    cancelarEdicaoCliente();
    resetarFormClienteUI();
  };
  document.getElementById('btn-cancelar-cliente').addEventListener('click', aoCancelarCliente);
  document.getElementById('btn-banner-cancelar-cliente').addEventListener('click', aoCancelarCliente);

  document.getElementById('btn-exportar-clientes').addEventListener('click', () => {
    const res = exportarClientesCSV();
    avisar(res.msg, !res.ok);
  });

  const inputImportClientes = document.getElementById('input-import-clientes');
  document.getElementById('btn-gatilho-import-clientes').addEventListener('click', () => {
    inputImportClientes.click();
  });
  inputImportClientes.addEventListener('change', (event) => {
    const file = event.target.files[0];
    lerArquivoTexto(file, (texto) => {
      const res = importarClientesTextoCSV(texto);
      desenharClientesCards();
      avisar(res.msg, !res.ok);
      event.target.value = '';
    });
  });

  // --- ABA 3: PRODUTOS E BACKUP ---
  document.getElementById('btn-salvar-produto').addEventListener('click', () => {
    const nomeDigitado = document.getElementById('prod-nome').value;
    const res = salvarProduto(nomeDigitado);

    if (!res.ok) {
      return avisar(res.msg, true);
    }

    if (res.editado) {
      resetarFormProdutoUI();
      if (estadoVendas.produtoSelecionado) {
        renderizarProdutoSelecionado(estadoVendas.produtoSelecionado);
      }
      desenharCarrinho();
      desenharVendas();
    } else {
      document.getElementById('prod-nome').value = '';
    }

    desenharProdutosCards();
    avisar(res.msg);
  });

  const aoCancelarProduto = () => {
    cancelarEdicaoProduto();
    resetarFormProdutoUI();
  };
  document.getElementById('btn-cancelar-produto').addEventListener('click', aoCancelarProduto);
  document.getElementById('btn-banner-cancelar-produto').addEventListener('click', aoCancelarProduto);

  document.getElementById('btn-exportar-produtos').addEventListener('click', () => {
    const res = exportarProdutosCSV();
    avisar(res.msg, !res.ok);
  });

  const inputImportProdutos = document.getElementById('input-import-produtos');
  document.getElementById('btn-gatilho-import-produtos').addEventListener('click', () => {
    inputImportProdutos.click();
  });
  inputImportProdutos.addEventListener('change', (event) => {
    const file = event.target.files[0];
    lerArquivoTexto(file, (texto) => {
      const res = importarProdutosTextoCSV(texto);
      desenharProdutosCards();
      avisar(res.msg, !res.ok);
      event.target.value = '';
    });
  });

  document.getElementById('btn-exportar-backup').addEventListener('click', () => {
    const res = exportarBackupJSON();
    avisar(res.msg, !res.ok);
  });

  const inputImportBackup = document.getElementById('input-import-backup');
  document.getElementById('btn-gatilho-import-backup').addEventListener('click', () => {
    inputImportBackup.click();
  });
  inputImportBackup.addEventListener('change', (event) => {
    const file = event.target.files[0];
    lerArquivoTexto(file, (texto) => {
      const res = importarBackupTextoJSON(texto);
      if (res.ok) {
        cancelarEdicaoVenda();
        cancelarEdicaoCliente();
        cancelarEdicaoProduto();
        resetarFormularioVendaUI();
        resetarFormClienteUI();
        resetarFormProdutoUI();
        desenharClientesCards();
        desenharProdutosCards();
        desenharVendas();
      }
      avisar(res.msg, !res.ok);
      event.target.value = '';
    });
  });
}

function inicializar() {
  vincularEventos();
  desenharClientesCards();
  desenharProdutosCards();
  desenharVendas();
  calcularTotaisCarrinhoUI();
}

inicializar();
