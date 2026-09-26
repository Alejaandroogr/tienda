import {
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import { useAuth } from '../context/useAuth';

function Login() {
  const navigate = useNavigate();

  const { iniciarSesion } = useAuth();

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [cargando, setCargando] =
    useState(false);

  const manejarLogin = async (
    evento: FormEvent<HTMLFormElement>
  ) => {
    evento.preventDefault();

    setError('');

    if (
      email.trim() === '' ||
      password === ''
    ) {
      setError(
        'Todos los campos son obligatorios'
      );

      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        'http://localhost/tienda/backend/usuarios/login.php',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido iniciar sesión'
        );

        return;
      }

      /*
       * Guardamos el usuario en el contexto.
       *
       * El backend ya ha creado la sesión PHP.
       */
      iniciarSesion(datos.usuario);

      /*
       * Vamos directamente al inicio.
       */
      navigate('/');

    } catch {
      setError(
        'No se ha podido conectar con el servidor'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <main>
      <div className="auth-container">

        <div className="auth-card">

          <p className="auth-subtitle">
            BIENVENIDO DE NUEVO
          </p>

          <h1>
            Iniciar sesión
          </h1>

          <p className="auth-description">
            Accede a tu cuenta para gestionar tus
            pedidos y continuar comprando.
          </p>

          <form
            className="auth-form"
            onSubmit={manejarLogin}
          >

            <div className="form-group">

              <label htmlFor="email">
                Correo electrónico
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(evento) =>
                  setEmail(
                    evento.target.value
                  )
                }
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />

            </div>

            <div className="form-group">

              <label htmlFor="password">
                Contraseña
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(evento) =>
                  setPassword(
                    evento.target.value
                  )
                }
                placeholder="••••••••"
                autoComplete="current-password"
              />

            </div>

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
            >
              {cargando
                ? 'Iniciando sesión...'
                : 'Iniciar sesión'}
            </button>

          </form>

          <p className="auth-register">
            ¿No tienes una cuenta?{' '}

            <Link to="/registro">
              Crear cuenta
            </Link>
          </p>

        </div>

      </div>
    </main>
  );
}

export default Login;