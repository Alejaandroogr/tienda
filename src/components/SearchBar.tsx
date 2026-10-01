import { Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SearchBarProps {
  valor: string;
  alBuscar: (valor: string) => void;
}

function SearchBar({ valor, alBuscar }: SearchBarProps) {
  return (
    <div className="search-bar store-search">
      <Search className="store-search-icon" size={19} aria-hidden="true" />
      <Input
        type="search"
        value={valor}
        onChange={(evento) => alBuscar(evento.target.value)}
        placeholder="Busca ordenadores, componentes, periféricos…"
        aria-label="Buscar productos"
      />
      {valor && <Button variant="ghost" size="icon-sm" aria-label="Borrar búsqueda" onClick={() => alBuscar('')}><X size={16} /></Button>}
      <kbd className="store-search-shortcut">⌘ K</kbd>
    </div>
  );
}

export default SearchBar;
