/** Monta o link wa.me a partir de um telefone como veio da planilha (com
 * DDD, com ou sem +55, com espaços/traços/parênteses). Números com 12+
 * dígitos já são tratados como tendo o código do país; o resto (DDD de 2 +
 * 8 ou 9 dígitos = 10-11 dígitos) ganha o 55 do Brasil na frente. */
export function linkWhatsApp(telefoneBruto: string): string {
  const digitos = telefoneBruto.replace(/\D/g, "");
  const comPais = digitos.length >= 12 ? digitos : `55${digitos}`;
  return `https://wa.me/${comPais}`;
}
