import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Boxes, CircleDollarSign, ClipboardList, Package, Users } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';

interface DashboardData {
  usuarios: { total: number };
  productos: { total: number; sin_stock: number; stock_bajo: number };
  pedidos: { total: number; pendientes: number; procesando: number; enviados: number; entregados: number; cancelados: number };
  ventas: { total: string };
}

const estados: { key: keyof DashboardData['pedidos']; label: string; tone: string }[] = [
  { key: 'pendientes', label: 'Pendientes', tone: 'pending' },
  { key: 'procesando', label: 'Procesando', tone: 'processing' },
  { key: 'enviados', label: 'Enviados', tone: 'shipped' },
  { key: 'entregados', label: 'Entregados', tone: 'delivered' },
  { key: 'cancelados', label: 'Cancelados', tone: 'cancelled' },
];

function AdminDashboard() {
  const { usuario } = useAuth();
  const [datos, setDatos] = useState<DashboardData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [reintento, setReintento] = useState(0);

  useEffect(() => {
    if (!error) return;

    toast.error('No se ha podido cargar el dashboard', {
      description: error,
      action: {
        label: 'Reintentar',
        onClick: () => setReintento((count) => count + 1),
      },
    });
  }, [error]);

  useEffect(() => {
    if (usuario?.rol !== 'admin') return;
    const obtenerDashboard = async () => {
      setCargando(true);
      setError('');
      try {
        const respuesta = await fetch('http://localhost/tienda/backend/admin/dashboard.php', { credentials: 'include' });
        const resultado = await respuesta.json();
        if (!respuesta.ok) throw new Error(resultado.error || 'No se han podido obtener las estadísticas');
        setDatos(resultado as DashboardData);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'No se ha podido conectar con el servidor');
      } finally { setCargando(false); }
    };
    void obtenerDashboard();
  }, [usuario, reintento]);

  if (!usuario || usuario.rol !== 'admin') return <main className="admin-container"><Alert variant="destructive"><AlertTitle>Acceso restringido</AlertTitle><AlertDescription>No tienes permisos para acceder al panel.</AlertDescription></Alert></main>;

  const metricas = datos ? [
    { label: 'Usuarios registrados', value: datos.usuarios.total.toLocaleString('es-ES'), icon: Users, href: '/admin/usuarios', caption: 'Ver usuarios' },
    { label: 'Productos', value: datos.productos.total.toLocaleString('es-ES'), icon: Boxes, href: '/admin/productos', caption: 'Gestionar catálogo' },
    { label: 'Pedidos', value: datos.pedidos.total.toLocaleString('es-ES'), icon: ClipboardList, href: '/admin/pedidos', caption: 'Ver pedidos' },
    { label: 'Ventas acumuladas', value: `${Number(datos.ventas.total).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`, icon: CircleDollarSign, href: '/admin/pedidos', caption: 'Revisar pedidos' },
  ] : [];

  return (
    <main className="admin-container admin-dashboard-page">
      <header className="admin-header admin-dashboard-heading"><div><p className="admin-subtitle">VISTA GENERAL</p><h1>Dashboard</h1><p>Hola, {usuario.nombre}. Este es el estado actual de tu tienda.</p></div><Badge variant="outline" className="admin-live-badge"><span /> Datos de la tienda</Badge></header>
      {cargando ? <section className="admin-metric-grid" aria-label="Cargando estadísticas" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <Card className="admin-metric-card" key={index}><CardHeader><Skeleton className="h-4 w-28" /><Skeleton className="size-9 rounded-lg" /></CardHeader><CardContent><Skeleton className="h-8 w-24" /><Skeleton className="mt-4 h-3 w-24" /></CardContent></Card>)}</section> : datos && <>
        <section className="admin-metric-grid" aria-label="Estadísticas principales">{metricas.map(({ label, value, icon: Icon, href, caption }) => <Link to={href} key={label} className="admin-metric-link"><Card className="admin-metric-card"><CardHeader><CardTitle>{label}</CardTitle><span className="admin-metric-icon"><Icon size={18} /></span></CardHeader><CardContent><strong>{value}</strong><span className="admin-metric-caption">{caption} <ArrowRight size={13} /></span></CardContent></Card></Link>)}</section>
        <div className="admin-dashboard-columns">
          <Card className="admin-dashboard-panel"><CardHeader><div><p className="admin-section-subtitle">OPERACIONES</p><CardTitle>Estado de pedidos</CardTitle></div><Button variant="outline" size="sm" render={<Link to="/admin/pedidos" />}>Gestionar <ArrowRight size={14} /></Button></CardHeader><CardContent><div className="admin-status-grid">{estados.map(({ key, label, tone }) => <div className={`admin-status-tile ${tone}`} key={key}><span className="admin-status-indicator" /><span>{label}</span><strong>{datos.pedidos[key]}</strong></div>)}</div></CardContent></Card>
          <Card className="admin-dashboard-panel admin-quicklinks"><CardHeader><div><p className="admin-section-subtitle">ACCESOS RÁPIDOS</p><CardTitle>Gestión</CardTitle></div></CardHeader><CardContent><Link to="/admin/productos"><Package size={17} /> Productos <ArrowRight size={15} /></Link><Link to="/admin/categorias"><Boxes size={17} /> Categorías <ArrowRight size={15} /></Link><Link to="/admin/pedidos"><ClipboardList size={17} /> Pedidos <ArrowRight size={15} /></Link><Link to="/admin/usuarios"><Users size={17} /> Usuarios <ArrowRight size={15} /></Link></CardContent></Card>
        </div>
        <section className="admin-stock-grid" aria-label="Alertas de inventario">
          <Link to="/admin/productos"><Card className={`admin-stock-card ${datos.productos.sin_stock ? 'has-alert' : ''}`}><span className="admin-stock-card-icon"><Package size={18} /></span><span><small>Productos sin stock</small><strong>{datos.productos.sin_stock}</strong></span><ArrowRight size={15} /></Card></Link>
          <Link to="/admin/productos"><Card className={`admin-stock-card ${datos.productos.stock_bajo ? 'has-alert' : ''}`}><span className="admin-stock-card-icon"><AlertTriangle size={18} /></span><span><small>Stock bajo · 10 unidades o menos</small><strong>{datos.productos.stock_bajo}</strong></span><ArrowRight size={15} /></Card></Link>
        </section>
      </>}
    </main>
  );
}

export default AdminDashboard;
