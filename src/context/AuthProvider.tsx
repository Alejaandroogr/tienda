import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import {
  AuthContext,
  type Usuario,
} from './AuthContext';
import { API_URL } from '../lib/api';

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({
  children,
}: AuthProviderProps) {
  const [usuario, setUsuario] =
    useState<Usuario | null>(null);

  const [cargando, setCargando] =
    useState(true);

  useEffect(() => {
    const comprobarSesion = async () => {
      try {
        const respuesta = await fetch(
          `${API_URL}/auth/me.php`,
          {
            credentials: 'include',
          }
        );

        if (!respuesta.ok) {
          setUsuario(null);
          localStorage.removeItem('usuario');
          return;
        }

        const datos = await respuesta.json();

        if (
          datos.autenticado &&
          datos.usuario
        ) {
          setUsuario(datos.usuario);

          localStorage.setItem(
            'usuario',
            JSON.stringify(datos.usuario)
          );
        } else {
          setUsuario(null);
          localStorage.removeItem('usuario');
        }

      } catch {
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    };

    comprobarSesion();
  }, []);

  const iniciarSesion = (
    usuario: Usuario
  ) => {
    setUsuario(usuario);

    localStorage.setItem(
      'usuario',
      JSON.stringify(usuario)
    );
  };

  const cerrarSesion = () => {
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        iniciarSesion,
        cerrarSesion,
      }}
    >
      {cargando ? (
        <p>Cargando sesión...</p>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export default AuthProvider;