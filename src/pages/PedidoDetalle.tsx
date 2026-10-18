import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';
import { Table } from '../components/ui/table';

interface DetallePedido {
  id: number;
  producto_id: number;
  cantidad: number;
  precio: string;
  nombre: string;
  imagen: string | null;
}

interface Pedido {
  id: number;
  usuario_id: number;
  total: string;
  estado: string;
  creado_en: string;
  detalles: DetallePedido[];
}

interface RespuestaPedido {
  error?: string;
  pedido?: Omit<Pedido, 'detalles'>;
  detalles?: DetallePedido[];
}

function obtenerVarianteEstado(
  estado: string,
): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (estado === 'entregado') return 'secondary';
  if (estado === 'cancelado') return 'destructive';
  if (estado === 'enviado') return 'default';
  return 'outline';
}

function PedidoDetalle() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) {
      return;
    }

    const controlador = new AbortController();

    const cargarPedido = async () => {
      setCargando(true);
      setError('');
      setPedido(null);

      try {
        const respuesta = await fetch(
          `http://localhost/tienda/backend/pedidos/obtener.php?id=${id}`,
          {
            credentials: 'include',
            signal: controlador.signal,
          },
        );

        let datos: RespuestaPedido;

        try {
          datos = (await respuesta.json()) as RespuestaPedido;
        } catch {
          setError('No se ha podido cargar el pedido');
          return;
        }

        if (respuesta.status === 401) {
          setError('Debes iniciar sesión');
          return;
        }

        if (respuesta.status === 403) {
          setError('No tienes permiso para consultar este pedido');
          return;
        }

        if (respuesta.status === 404) {
          setError('Pedido no encontrado');
          return;
        }

        if (!respuesta.ok) {
          setError('No se ha podido cargar el pedido');
          return;
        }

        if (!datos.pedido || !Array.isArray(datos.detalles)) {
          setError('No se ha podido cargar el pedido');
          return;
        }

        setPedido({
          ...datos.pedido,
          detalles: datos.detalles,
        });
      } catch (errorPeticion) {
        if (
          errorPeticion instanceof DOMException &&
          errorPeticion.name === 'AbortError'
        ) {
          return;
        }

        setError('No se ha podido conectar con el servidor');
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    void cargarPedido();

    return () => controlador.abort();
  }, [id, usuario]);

  if (!usuario) {
    return (
      <main className="order-detail-page">
        <div className="order-detail-container order-detail-error-state">
          <Alert variant="destructive">
            <AlertTitle>Debes iniciar sesión</AlertTitle>
            <AlertDescription>
              Inicia sesión para consultar los pedidos de tu cuenta.
            </AlertDescription>
          </Alert>
          <Button render={<Link to="/login" />}>Iniciar sesión</Button>
        </div>
      </main>
    );
  }

  if (cargando) {
    return (
      <main className="order-detail-page">
        <div className="order-detail-container">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-72 w-full" />
        </div>
      </main>
    );
  }

  if (error || !pedido) {
    return (
      <main className="order-detail-page">
        <div className="order-detail-container order-detail-error-state">
          <Alert variant="destructive">
            <AlertTitle>{error || 'No se ha podido cargar el pedido'}</AlertTitle>
            <AlertDescription>
              {error === 'Pedido no encontrado'
                ? 'Comprueba el número del pedido e inténtalo de nuevo.'
                : error === 'Debes iniciar sesión'
                  ? 'Inicia sesión para consultar los pedidos de tu cuenta.'
                  : error === 'No tienes permiso para consultar este pedido'
                    ? 'Solo puedes consultar los pedidos asociados a tu cuenta.'
                    : 'Inténtalo de nuevo más tarde.'}
            </AlertDescription>
          </Alert>
          {error === 'Debes iniciar sesión' ? (
            <Button render={<Link to="/login" />}>Iniciar sesión</Button>
          ) : null}
          <Button variant="outline" render={<Link to="/pedidos" />}>
            <ArrowLeft /> Volver a mis pedidos
          </Button>
        </div>
      </main>
    );
  }

  const unidades = pedido.detalles.reduce(
    (total, detalle) => total + detalle.cantidad,
    0,
  );

  return (
    <main className="order-detail-page">
      <div className="order-detail-container order-detail-redesign">
        <header className="order-detail-header">
          <div>
            <p className="eyebrow">DETALLE DEL PEDIDO</p>
            <h1>Pedido #{pedido.id}</h1>
            <p>
              Realizado el{' '}
              {new Date(pedido.creado_en).toLocaleDateString('es-ES')}
            </p>
          </div>
          <Badge
            variant={obtenerVarianteEstado(pedido.estado)}
            className={`order-status order-status-${pedido.estado}`}
          >
            {pedido.estado}
          </Badge>
        </header>

        <Card className="order-detail-metadata">
          <div>
            <span>Cliente</span>
            <strong>{usuario.nombre}</strong>
          </div>
          <div>
            <span>Fecha del pedido</span>
            <strong>
              {new Date(pedido.creado_en).toLocaleDateString('es-ES')}
            </strong>
          </div>
          <div>
            <span>Unidades</span>
            <strong>{unidades}</strong>
          </div>
          <div>
            <span>Total del pedido</span>
            <strong>{Number(pedido.total).toFixed(2)} €</strong>
          </div>
        </Card>

        <Card className="order-detail-table-card">
          <div className="order-detail-card-heading">
            <div>
              <p className="eyebrow">RESUMEN</p>
              <h2>Productos del pedido</h2>
            </div>
            <Badge
              variant={obtenerVarianteEstado(pedido.estado)}
              className={`order-status order-status-${pedido.estado}`}
            >
              {pedido.estado}
            </Badge>
          </div>
          <Separator />
          <div className="order-detail-table-scroll">
            <Table className="order-detail-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {pedido.detalles.map((detalle) => (
                  <tr key={detalle.id}>
                    <td className="order-detail-table-product-cell">
                      <div className="order-detail-table-product">
                        {detalle.imagen ? (
                          <img src={detalle.imagen} alt="" />
                        ) : (
                          <span className="order-detail-table-placeholder" />
                        )}
                        <strong>{detalle.nombre}</strong>
                      </div>
                    </td>
                    <td data-label="Cantidad">{detalle.cantidad}</td>
                    <td data-label="Precio">{Number(detalle.precio).toFixed(2)} €</td>
                    <td data-label="Subtotal">
                      {(
                        Number(detalle.precio) * detalle.cantidad
                      ).toFixed(2)}{' '}
                      €
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="order-detail-total-row">
            <span>Total del pedido</span>
            <strong>{Number(pedido.total).toFixed(2)} €</strong>
          </div>
        </Card>

        <Button variant="outline" render={<Link to="/pedidos" />}>
          <ArrowLeft /> Volver a mis pedidos
        </Button>
      </div>
    </main>
  );
}

export default PedidoDetalle;
