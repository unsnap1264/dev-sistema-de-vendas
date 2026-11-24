export function cursorNoFinal(input) {
  setTimeout(() => {
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }, 0);
}

export function mascaraMoeda(input) {
  const n = input.value.replace(/\D/g, '') || '0';
  const dec = (parseInt(n, 10) / 100).toFixed(2);
  input.value = dec.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  cursorNoFinal(input);
}

export function lerMoeda(txt) {
  return parseFloat((txt || '0').replace(/\./g, '').replace(',', '.')) || 0;
}

export function formatarBR(num) {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function mascaraDoc(input) {
  let v = input.value.replace(/\D/g, '');
  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    v = v.replace(/^(\d{2})(\d)/, '$1.$2');
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
  }
  input.value = v;
}

export function mascaraTel(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
  input.value = v;
}

export function mascaraCEP(input) {
  input.value = input.value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
}

export function validarDoc(doc) {
  doc = doc.replace(/[^\d]+/g, '');
  if (/^(\d)\1+$/.test(doc)) return false;

  if (doc.length === 11) {
    let soma = 0;
    for (let i = 0; i < 9; i++) soma += parseInt(doc.charAt(i), 10) * (10 - i);
    let resto = 11 - (soma % 11);
    const dig1 = (resto === 10 || resto === 11) ? 0 : resto;
    if (dig1 !== parseInt(doc.charAt(9), 10)) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) soma += parseInt(doc.charAt(i), 10) * (11 - i);
    resto = 11 - (soma % 11);
    const dig2 = (resto === 10 || resto === 11) ? 0 : resto;
    return dig2 === parseInt(doc.charAt(10), 10);
  }

  if (doc.length === 14) {
    let tamanho = doc.length - 2;
    let numeros = doc.substring(0, tamanho);
    const digitos = doc.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = doc.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado == digitos.charAt(1);
  }

  return false;
}

export function baixarArquivo(conteudo, nomeArquivo, tipo) {
  const blob = new Blob([conteudo], { type: tipo });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function compartilharTexto(titulo, msg, onFallback) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(msg).catch(() => {});
  }

  if (navigator.share) {
    navigator.share({ title: titulo, text: msg }).catch(() => {});
  } else {
    if (typeof onFallback === 'function') onFallback();
    window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
  }
}
