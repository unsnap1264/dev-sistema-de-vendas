import { db, estado } from './db.js';
import { validarDoc, baixarArquivo, compartilharTexto } from './formatadores.js';
import { estadoVendas } from './modulo-vendas.js';

export const estadoClientes = {
  editandoClienteIdx: null
};

export function iniciarEdicaoCliente(index) {
  const c = estado.clientes[index];
  if (!c) return null;
  estadoClientes.editandoClienteIdx = index;
  return c;
}

export function cancelarEdicaoCliente() {
  estadoClientes.editandoClienteIdx = null;
}

export function salvarCliente(dados) {
  const nome = (dados.nome || '').trim();
  const cpf = (dados.cpf || '').trim();
  const tel = (dados.tel || '').trim();
  const email = (dados.email || '').trim();
  const cep = (dados.cep || '').trim();
  const rua = (dados.rua || '').trim();
  const bairro = (dados.bairro || '').trim();
  const cidade = (dados.cidade || '').trim();

  if (!nome) {
    return { ok: false, msg: 'Digite o Nome ou Razão Social.' };
  }
  if (!validarDoc(cpf)) {
    return { ok: false, msg: 'CPF ou CNPJ inválido! Verifique os números.' };
  }

  const docLimpo = cpf.replace(/\D/g, '');
  const duplicado = estado.clientes.some(
    (c, idx) => idx !== estadoClientes.editandoClienteIdx && c.cpf.replace(/\D/g, '') === docLimpo
  );
  if (duplicado) {
    return { ok: false, msg: 'Este CPF ou CNPJ já está cadastrado.' };
  }

  const dadosCliente = { nome, cpf, tel, email, cep, rua, bairro, cidade };

  if (estadoClientes.editandoClienteIdx !== null) {
    const clienteAntigo = estado.clientes[estadoClientes.editandoClienteIdx];
    estado.clientes[estadoClientes.editandoClienteIdx] = dadosCliente;
    db.salvar('app_clientes', estado.clientes);

    if (
      estadoVendas.clienteSelecionado &&
      estadoVendas.clienteSelecionado.cpf.replace(/\D/g, '') === clienteAntigo.cpf.replace(/\D/g, '')
    ) {
      estadoVendas.clienteSelecionado = dadosCliente;
    }

    cancelarEdicaoCliente();
    return { ok: true, msg: 'Cadastro do cliente atualizado!', editado: true, cliente: dadosCliente };
  }

  estado.clientes.push(dadosCliente);
  db.salvar('app_clientes', estado.clientes);
  return { ok: true, msg: 'Cliente salvo e selecionado na venda!', editado: false, cliente: dadosCliente };
}

export function removerCliente(index) {
  let cancelouEdicao = false;
  if (estadoClientes.editandoClienteIdx === index) {
    cancelarEdicaoCliente();
    cancelouEdicao = true;
  } else if (estadoClientes.editandoClienteIdx !== null && index < estadoClientes.editandoClienteIdx) {
    estadoClientes.editandoClienteIdx--;
  }

  estado.clientes.splice(index, 1);
  db.salvar('app_clientes', estado.clientes);
  return { ok: true, msg: 'Cliente excluído.', cancelouEdicao };
}

export function compartilharCliente(index, onFallback) {
  const c = estado.clientes[index];
  if (!c) return;

  const tipoDoc = c.cpf.replace(/\D/g, '').length === 14 ? 'CNPJ' : 'CPF';
  const endereco = [c.rua, c.bairro, c.cidade, c.cep ? `CEP ${c.cep}` : ''].filter(Boolean).join(', ');

  let msg = `*CADASTRO DE CLIENTE*\n*Nome/Razão:* ${c.nome}\n*${tipoDoc}:* ${c.cpf}`;
  if (c.tel) msg += `\n*Telefone/WhatsApp:* ${c.tel}`;
  if (c.email) msg += `\n*E-mail:* ${c.email}`;
  if (endereco) msg += `\n*Endereço:* ${endereco}`;

  compartilharTexto('Cadastro de Cliente', msg, onFallback);
}

export function exportarClientesCSV() {
  if (estado.clientes.length === 0) {
    return { ok: false, msg: 'Nenhum cliente cadastrado.' };
  }

  let csv = '\uFEFFNome;CPF_CNPJ;Telefone;Email;CEP;Rua;Bairro;Cidade\n';
  estado.clientes.forEach(c => {
    csv += `"${c.nome}";"${c.cpf}";"${c.tel || ''}";"${c.email || ''}";"${c.cep || ''}";"${c.rua || ''}";"${c.bairro || ''}";"${c.cidade || ''}"\n`;
  });

  baixarArquivo(csv, 'clientes.csv', 'text/csv;charset=utf-8;');
  return { ok: true, msg: 'Planilha de clientes exportada!' };
}

export function importarClientesTextoCSV(textoCSV) {
  const linhas = textoCSV.split(/\r?\n/).slice(1);
  let novos = 0;

  linhas.forEach(linha => {
    if (!linha.trim()) return;
    const cols = linha.split(';').map(c => c.replace(/^"|"$/g, '').trim());
    const [nome, cpf, tel, email, cep, rua, bairro, cidade] = cols;
    if (nome && cpf) {
      const docLimpo = cpf.replace(/\D/g, '');
      if (!estado.clientes.some(c => c.cpf.replace(/\D/g, '') === docLimpo)) {
        estado.clientes.push({
          nome,
          cpf,
          tel: tel || '',
          email: email || '',
          cep: cep || '',
          rua: rua || '',
          bairro: bairro || '',
          cidade: cidade || ''
        });
        novos++;
      }
    }
  });

  db.salvar('app_clientes', estado.clientes);
  return { ok: true, msg: `${novos} cliente(s) importado(s) com sucesso!` };
}
