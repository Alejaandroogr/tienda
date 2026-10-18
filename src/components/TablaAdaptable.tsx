import type { ComponentProps } from 'react';
import { cn } from 'cn';

/**
 * Tabla que nunca necesita scroll horizontal. Cuando su contenedor es más estrecho
 * de lo que la tabla necesita, cada fila se muestra como una tarjeta con un dato por
 * línea («Cliente: …»). Lo decide una container query según el espacio real de la
 * tabla, no el ancho de la pantalla (ver .tabla-adaptable en App.css).
 *
 * Cada <td> debe llevar data-label con el nombre de su columna: es la etiqueta que
 * se muestra en modo tarjeta.
 *
 * ancho: «ancha» (5 o 6 columnas) se apila por debajo de 710 px; «estrecha»
 * (3 o 4 columnas), por debajo de 440 px.
 */
function TablaAdaptable({
  ancho = 'ancha',
  className,
  ...props
}: ComponentProps<'table'> & { ancho?: 'ancha' | 'estrecha' }) {
  return (
    <div className={`tabla-adaptable tabla-adaptable-${ancho}`}>
      <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  );
}

export default TablaAdaptable;
