/**
 * Campos del perfil de recomendación dentro del formulario de producto del panel:
 * valoración de cada uso y especificaciones conocidas, según la categoría.
 *
 * Es un componente controlado: recibe el perfil y devuelve uno nuevo en cada cambio.
 * Las reglas (qué campos tiene cada categoría y cómo se aplica un cambio) están en
 * perfilRecomendacionService.
 */
import type { ChangeEvent } from 'react';
import type { CampoAtributoPerfil, EstadoUso, PerfilRecomendacion } from '../../types/PerfilRecomendacion';
import {
  aplicarCambioAtributo,
  aplicarCambioUso,
  ESTADOS_USO,
  filtrarAtributosPerfil,
  filtrarUsosPerfil,
  obtenerCamposAtributoCategoria,
  obtenerCamposUsoCategoria,
} from '../../services/perfilRecomendacionService';

interface Props {
  categoria: string;
  perfil: PerfilRecomendacion;
  onChange: (perfil: PerfilRecomendacion) => void;
}

export function PerfilRecomendacionFields({ categoria, perfil, onChange }: Props) {
  const campos = obtenerCamposAtributoCategoria(categoria);
  const camposUso = obtenerCamposUsoCategoria(categoria);
  // Solo los valores válidos para la categoría actual: si el producto cambia de categoría
  // en el formulario, no se muestran los atributos de la anterior.
  const atributos = filtrarAtributosPerfil(perfil.atributos, categoria) as Record<string, unknown>;
  const usos = filtrarUsosPerfil(perfil.usos, categoria);

  const cambiarAtributo = (
    campo: CampoAtributoPerfil,
    evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    // Del valor del control al tipo del esquema. Vacío («Desconocido») es undefined: sin dato.
    const valor = evento.target.value;
    let convertido: unknown = valor;

    if (campo.tipo === 'numero') {
      convertido = valor === '' ? undefined : Number(valor);
    } else if (campo.tipo === 'booleano') {
      convertido = valor === '' ? undefined : valor === 'true';
    } else if (campo.tipo === 'lista') {
      convertido = evento.target instanceof HTMLSelectElement
        ? Array.from(evento.target.selectedOptions, (opcion) => opcion.value)
        : [];
    }

    onChange(aplicarCambioAtributo(perfil, campo, convertido));
  };

  // «Sin valorar» (valor vacío) no está en ESTADOS_USO: queda undefined y el uso se quita del perfil.
  const cambiarUso = (clave: string, valor: string) => {
    const estado = ESTADOS_USO.find((opcion) => opcion.valor === valor)?.valor;
    onChange(aplicarCambioUso(perfil, clave, estado as EstadoUso | undefined));
  };

  return (
    <section className="admin-ai-profile" aria-labelledby="perfil-ia-titulo">
      <header>
        <p className="admin-section-subtitle">ESPECIFICACIONES OPCIONALES</p>
        <h3 id="perfil-ia-titulo">Especificaciones para recomendaciones IA</h3>
        <p>
          Completa únicamente las especificaciones que conozcas. Deja en blanco
          lo que desconozcas; un dato vacío no significa que el producto no sea
          adecuado para un uso.
        </p>
      </header>
      {campos.length === 0 ? (
        <p>Esta categoría no tiene especificaciones para recomendaciones IA.</p>
      ) : (
        <>
          <div className="admin-ai-profile-group">
            <h4>Usos valorados por el administrador</h4>
            <div className="admin-ai-uses-grid">
              {camposUso.map((uso) => (
                <label className="admin-ai-field" key={uso.clave}>
                  <span>{uso.etiqueta}</span>
                  <select value={usos[uso.clave] ?? ''} onChange={(evento) => cambiarUso(uso.clave, evento.target.value)}>
                    <option value="">Sin valorar</option>
                    {ESTADOS_USO.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>
          <div className="admin-ai-profile-group">
            <h4>Especificaciones conocidas</h4>
            <div className="admin-ai-attributes-grid">
              {campos.map((campo) => {
                const actual = atributos[campo.clave];
                const valorSelect = campo.tipo === 'booleano'
                  ? typeof actual === 'boolean' ? String(actual) : ''
                  : typeof actual === 'string' ? actual : '';

                return (
                  <label className="admin-ai-field" key={campo.clave}>
                    <span>
                      {campo.etiqueta}
                      {campo.tipo === 'numero' && campo.unidad ? ` (${campo.unidad})` : ''}
                    </span>
                    {campo.tipo === 'texto' && (
                      <input
                        type="text"
                        maxLength={120}
                        placeholder={campo.placeholder ?? 'Desconocido'}
                        value={typeof actual === 'string' ? actual : ''}
                        onChange={(evento) => cambiarAtributo(campo, evento)}
                      />
                    )}
                    {campo.tipo === 'numero' && (
                      <input
                        type="number"
                        min={campo.paso ? '0.0001' : 1}
                        max={campo.maximo}
                        step={campo.paso ? 'any' : 1}
                        placeholder="Desconocido"
                        value={typeof actual === 'number' ? actual : ''}
                        onChange={(evento) => cambiarAtributo(campo, evento)}
                      />
                    )}
                    {(campo.tipo === 'enum' || campo.tipo === 'booleano') && (
                      <select value={valorSelect} onChange={(evento) => cambiarAtributo(campo, evento)}>
                        <option value="">Desconocido</option>
                        {campo.tipo === 'booleano'
                          ? <>
                              <option value="true">Sí</option>
                              <option value="false">No</option>
                            </>
                          : campo.opciones.map((opcion) => (
                              <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                            ))}
                      </select>
                    )}
                    {campo.tipo === 'lista' && (
                      <select
                        multiple
                        value={Array.isArray(actual) ? actual.filter((item): item is string => typeof item === 'string') : []}
                        onChange={(evento) => cambiarAtributo(campo, evento)}
                        aria-label={`${campo.etiqueta}; usa Ctrl o Command para varias opciones`}
                      >
                        {campo.opciones.map((opcion) => (
                          <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
                        ))}
                      </select>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
