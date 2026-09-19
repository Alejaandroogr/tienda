interface SearchBarProps {
  valor: string;
  alBuscar: (valor: string) => void;
}

function SearchBar({ valor, alBuscar }: SearchBarProps) {
  return (
    <div className="search-bar">
      <input
        type="text"
        value={valor}
        onChange={(evento) => alBuscar(evento.target.value)}
        placeholder="Buscar productos..."
      />
    </div>
  );
}

export default SearchBar;