import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, LockKeyhole, Mail } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { API_URL } from '../lib/api';

function Login() {
  const navigate = useNavigate();
  const { iniciarSesion } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarLogin = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Completa el correo electrónico y la contraseña');
      return;
    }
    try {
      setCargando(true);
      const respuesta = await fetch(`${API_URL}/usuarios/login.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        toast.error(datos.error || 'No se ha podido iniciar sesión');
        return;
      }
      iniciarSesion(datos.usuario);
      toast.success('Sesión iniciada correctamente');
      navigate('/');
    } catch {
      toast.error('No se ha podido conectar con el servidor');
    }
    finally { setCargando(false); }
  };

  return (
    <main className="store-auth-page">
      <div className="store-auth-aside"><div className="store-auth-brand"><Cpu size={24} /> TECHSTORE</div><p className="eyebrow">TECNOLOGÍA QUE TE MUEVE</p><h2>Tu próximo proyecto empieza aquí.</h2><p>Accede a tu cuenta para seguir tus pedidos y descubrir novedades pensadas para tu setup.</p><div className="store-auth-graphic"><Cpu size={118} strokeWidth={.8} /></div></div>
      <div className="store-auth-form-wrap"><Card className="store-auth-card"><CardHeader><p className="eyebrow">BIENVENIDO DE NUEVO</p><CardTitle>Iniciar sesión</CardTitle><p>Accede para gestionar tus pedidos y continuar comprando.</p></CardHeader><CardContent><form className="store-form" onSubmit={manejarLogin}>
        <div className="store-form-field"><Label htmlFor="email">Correo electrónico</Label><div className="store-input-icon"><Mail size={16} /><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" autoComplete="email" required /></div></div>
        <div className="store-form-field"><Label htmlFor="password">Contraseña</Label><div className="store-input-icon"><LockKeyhole size={16} /><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" autoComplete="current-password" required /></div></div>
        <Button type="submit" size="lg" disabled={cargando}>{cargando ? 'Iniciando sesión…' : 'Iniciar sesión'} {!cargando && <ArrowRight size={16} />}</Button>
      </form><p className="store-auth-switch">¿Todavía no tienes una cuenta? <Link to="/registro">Crear cuenta</Link></p></CardContent></Card></div>
    </main>
  );
}

export default Login;
