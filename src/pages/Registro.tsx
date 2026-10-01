import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Cpu, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

function Registro() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarRegistro = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (!nombre.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error('Completa todos los campos');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    try {
      setCargando(true);
      const respuesta = await fetch('http://localhost/tienda/backend/usuarios/registrar.php', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        toast.error(datos.error || 'No se ha podido registrar el usuario');
        return;
      }
      toast.success('Cuenta creada correctamente');
      setNombre(''); setEmail(''); setPassword(''); setConfirmPassword('');
      window.setTimeout(() => navigate('/login'), 1200);
    } catch {
      toast.error('No se ha podido conectar con el servidor');
    }
    finally { setCargando(false); }
  };

  return (
    <main className="store-auth-page">
      <div className="store-auth-aside"><div className="store-auth-brand"><Cpu size={24} /> TECHSTORE</div><p className="eyebrow">ÚNETE A LA COMUNIDAD</p><h2>Mejor tecnología.<br />Mejor experiencia.</h2><p>Crea tu cuenta y mantén todos tus pedidos y compras organizados en un solo lugar.</p><div className="store-auth-graphic"><Cpu size={118} strokeWidth={.8} /></div></div>
      <div className="store-auth-form-wrap"><Card className="store-auth-card"><CardHeader><p className="eyebrow">EMPIEZA EN TECHSTORE</p><CardTitle>Crear una cuenta</CardTitle><p>Completa tus datos para registrarte.</p></CardHeader><CardContent><form className="store-form" onSubmit={manejarRegistro}>
        <div className="store-form-field"><Label htmlFor="nombre">Nombre</Label><div className="store-input-icon"><UserRound size={16} /><Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" autoComplete="name" required /></div></div>
        <div className="store-form-field"><Label htmlFor="email">Correo electrónico</Label><div className="store-input-icon"><Mail size={16} /><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" autoComplete="email" required /></div></div>
        <div className="store-form-field"><Label htmlFor="password">Contraseña</Label><div className="store-input-icon"><LockKeyhole size={16} /><Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Crea una contraseña" autoComplete="new-password" required /></div></div>
        <div className="store-form-field"><Label htmlFor="confirmPassword">Confirmar contraseña</Label><div className="store-input-icon"><LockKeyhole size={16} /><Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" autoComplete="new-password" required /></div></div>
        <Button type="submit" size="lg" disabled={cargando}>{cargando ? 'Creando cuenta…' : 'Crear cuenta'} {!cargando && <ArrowRight size={16} />}</Button>
      </form><p className="store-auth-switch">¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link></p></CardContent></Card></div>
    </main>
  );
}

export default Registro;
