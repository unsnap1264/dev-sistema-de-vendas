export const db = (function () {
  const mem = {};
  try {
    window.localStorage.setItem('__t', '1');
    window.localStorage.removeItem('__t');
    return {
      ler: (k) => JSON.parse(window.localStorage.getItem(k)),
      salvar: (k, v) => window.localStorage.setItem(k, JSON.stringify(v))
    };
  } catch (e) {
    return {
      ler: (k) => mem[k] || null,
      salvar: (k, v) => { mem[k] = v; }
    };
  }
})();

export const produtosIniciais = [
  "TENÉBRIO MOLITOR VIVO - POTE",
  "TENÉBRIO GIGANTE VIVO - POTE",
  "SOLAPA TENÉBRIO MOLITOR 15G",
  "SOLAPA TENÉBRIO GIGANTE 20G",
  "TENBÉBRIO GIGANTE TRITURADO EM PÓ PARC DESNG 80G",
  "TENÉBRIO MOLITOR TRITURADO EM PÓ 80G"
];

export const clientesIniciais = [
  {
    nome: "Cliente Teste 01",
    cpf: "111.444.777-35",
    tel: "(98) 99999-1111",
    email: "teste01@email.com",
    cep: "65000-000",
    rua: "Rua Exemplo, 100",
    bairro: "Centro",
    cidade: "São Luís - MA"
  }
];

export const estado = {
  produtos: db.ler('app_produtos') || [...produtosIniciais],
  clientes: db.ler('app_clientes') || [...clientesIniciais],
  vendas: db.ler('app_vendas') || []
};

export function salvarTudo() {
  db.salvar('app_produtos', estado.produtos);
  db.salvar('app_clientes', estado.clientes);
  db.salvar('app_vendas', estado.vendas);
}
