/**
 * Formato de precios de toda la web: español, con punto de miles y coma decimal
 * («2.199,99 €»). useGrouping 'always' es necesario porque el español no agrupa
 * por defecto las cifras de cuatro dígitos («2199,99 €»). Intl separa el «€» con
 * un espacio no separable, así que el precio no se parte en dos líneas.
 */
const FORMATO_EUROS = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  useGrouping: 'always',
});

/** Para unir un importe y un «€» con estilo propio sin que se separen al cambiar de línea. */
export const ESPACIO_NO_SEPARABLE = ' ';

function aNumero(valor: number | string): number {
  return typeof valor === 'number' ? valor : Number(valor);
}

/** «2.199,99 €». Admite el precio como número o como el texto que devuelve la API («2199.99»). */
export function formatearPrecio(valor: number | string): string {
  const numero = aNumero(valor);

  return Number.isFinite(numero)
    ? FORMATO_EUROS.format(numero)
    : `${valor}${ESPACIO_NO_SEPARABLE}€`;
}

/** Solo el importe con el mismo formato («2.199,99»), para los sitios que dan al «€» un estilo propio. */
export function formatearImporte(valor: number | string): string {
  const numero = aNumero(valor);

  if (!Number.isFinite(numero)) {
    return String(valor);
  }

  return FORMATO_EUROS.formatToParts(numero)
    .filter((parte) => parte.type !== 'currency' && parte.type !== 'literal')
    .map((parte) => parte.value)
    .join('');
}
