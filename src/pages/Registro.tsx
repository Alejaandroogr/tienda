import {
  useState,
  type FormEvent,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

function Registro() {
  const navigate = useNavigate();

  const [nombre, setNombre] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [mensaje, setMensaje] =
    useState('');

  const [cargando, setCargando] =
    useState(false);

  const manejarRegistro = async (
    evento: FormEvent<HTMLFormElement>
  ) => {
    evento.preventDefault();

    setError('');
    setMensaje('');

    if (
      nombre.trim() === '' ||
      email.trim() === '' ||
      password === '' ||
      confirmPassword === ''
    ) {
      setError(
        'Todos los campos son obligatorios'
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        'Las contraseñas no coinciden'
      );

      return;
    }

    try {
      setCargando(true);

      const respuesta = await fetch(
        'http://localhost/tienda/backend/usuarios/registrar.php',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            nombre: nombre.trim(),
            email: email.trim(),
            password,
          }),
        }
      );

      const datos =
        await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.error ||
            'No se ha podido registrar el usuario'
        );

        return;
      }

      setMensaje(
        datos.mensaje ||
          'Usuario registrado correctamente'
      );

      setNombre('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        navigate('/login');
      }, 1500);

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
            CREA TU CUENTA
          </p>

          <h1>
            Registrarse
          </h1>

          <p className="auth-description">
            Crea una cuenta para gestionar tus
            pedidos y realizar tus compras.
          </p>

          <form
            className="auth-form"
            onSubmit={manejarRegistro}
          >

            <div className="form-group">

              <label htmlFor="nombre">
                Nombre
              </label>

              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(evento) =>
                  setNombre(
                    evento.target.value
                  )
                }
                placeholder="Tu nombre"
                autoComplete="name"
              />

            </div>

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
                autoComplete="new-password"
              />

            </div>

            <div className="form-group">

              <label htmlFor="confirmPassword">
                Confirmar contraseña
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(evento) =>
                  setConfirmPassword(
                    evento.target.value
                  )
                }
                placeholder="••••••••"
                autoComplete="new-password"
              />

            </div>

            {error && (
              <p className="auth-error">
                {error}
              </p>
            )}

            {mensaje && (
              <p className="auth-success">
                {mensaje}
              </p>
            )}

            <button
              type="submit"
              disabled={cargando}
            >
              {cargando
                ? 'Creando cuenta...'
                : 'Crear cuenta'}
            </button>

          </form>

          <p className="auth-register">
            ¿Ya tienes una cuenta?{' '}

            <Link to="/login">
              Iniciar sesión
            </Link>
          </p>

        </div>

      </div>
    </main>
  );
}

export default Registro;