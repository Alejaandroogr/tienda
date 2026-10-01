import type { MouseEvent } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../ui/pagination';

interface AdminPaginationProps {
  paginaActual: number;
  totalPaginas: number;
  alCambiarPagina: (pagina: number) => void;
  ariaLabel: string;
}

function AdminPagination({
  paginaActual,
  totalPaginas,
  alCambiarPagina,
  ariaLabel,
}: AdminPaginationProps) {
  const anteriorDeshabilitado = paginaActual <= 1;
  const siguienteDeshabilitado = paginaActual >= totalPaginas;

  const manejarAnterior = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (!anteriorDeshabilitado) {
      alCambiarPagina(paginaActual - 1);
    }
  };

  const manejarSiguiente = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (!siguienteDeshabilitado) {
      alCambiarPagina(paginaActual + 1);
    }
  };

  return (
    <Pagination
      className="admin-list-pagination"
      aria-label={ariaLabel}
    >
      <PaginationContent className="catalog-pagination-content">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Anterior"
            aria-disabled={anteriorDeshabilitado}
            tabIndex={anteriorDeshabilitado ? -1 : 0}
            className={anteriorDeshabilitado ? 'is-disabled' : undefined}
            onClick={manejarAnterior}
          />
        </PaginationItem>

        <PaginationItem>
          <PaginationLink
            href="#"
            isActive
            aria-label={`Página ${paginaActual} de ${totalPaginas}`}
            aria-current="page"
            tabIndex={-1}
            className="catalog-pagination-current"
            onClick={(event) => event.preventDefault()}
          >
            {paginaActual} / {totalPaginas}
          </PaginationLink>
        </PaginationItem>

        <PaginationItem>
          <PaginationNext
            href="#"
            text="Siguiente"
            aria-disabled={siguienteDeshabilitado}
            tabIndex={siguienteDeshabilitado ? -1 : 0}
            className={siguienteDeshabilitado ? 'is-disabled' : undefined}
            onClick={manejarSiguiente}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

export default AdminPagination;
