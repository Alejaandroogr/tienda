import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { cn } from 'cn';

/**
 * Tabla del panel con scroll horizontal visible: la primera columna queda fija y
 * aparece una sombra en el borde por el que queda contenido oculto.
 */
function AdminTable({ className, ...props }: ComponentProps<'table'>) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const [sombraInicio, setSombraInicio] = useState(false);
  const [sombraFin, setSombraFin] = useState(false);

  useEffect(() => {
    const contenedor = contenedorRef.current;

    if (!contenedor) {
      return;
    }

    const actualizar = () => {
      setSombraInicio(contenedor.scrollLeft > 1);
      setSombraFin(contenedor.scrollLeft + contenedor.clientWidth < contenedor.scrollWidth - 1);
    };

    actualizar();
    contenedor.addEventListener('scroll', actualizar, { passive: true });

    // Cambia el tamaño al girar la pantalla, al filtrar o al cambiar de página.
    const observador = new ResizeObserver(actualizar);
    observador.observe(contenedor);

    if (contenedor.firstElementChild) {
      observador.observe(contenedor.firstElementChild);
    }

    return () => {
      contenedor.removeEventListener('scroll', actualizar);
      observador.disconnect();
    };
  }, []);

  return (
    <div
      className="admin-table-scroll"
      data-sombra-inicio={sombraInicio || undefined}
      data-sombra-fin={sombraFin || undefined}
    >
      <div ref={contenedorRef} data-slot="table-container" className="relative w-full overflow-x-auto">
        <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props} />
      </div>
    </div>
  );
}

export default AdminTable;
