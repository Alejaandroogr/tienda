import { useEffect, useState } from 'react';
import { PackageSearch } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/useAuth';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { formatearPrecio } from '../lib/formato';

function variantEstado(estado: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (estado === 'entregado') return 'secondary';
  if (estado === 'cancelado') return 'destructive';
  if (estado === 'enviado') return 'default';
  return 'outline';
}

interface Pedido {
  id: number;
  usuario_id: number;
  total: string;
  estado: string;
  creado_en: string;
}

function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    const obtenerPedidos = async () => {
      try {
        setCargando(true);
        setError('');

        const respuesta = await fetch(
          'http://localhost/tienda/backend/pedidos/listar.php',
          {
            credentials: 'include',
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          setError(
            datos.error ||
              'No se han podido obtener los pedidos'
          );
          return;
        }

        setPedidos(datos);
      } catch {
        setError(
          'No se ha podido conectar con el servidor'
        );
      } finally {
        setCargando(false);
      }
    };

    obtenerPedidos();
  }, [usuario, navigate]);

  if (!usuario) {
    return null;
  }

  return (
    <main>
      <div className="orders-container">
        <div className="orders-header">
          <div>
            <p className="cart-subtitle">
              TU CUENTA
            </p>

            <h1>Mis pedidos</h1>

            <p>
              Consulta todos los pedidos que has
              realizado.
            </p>
          </div>

          <Link
            to="/"
            className="continue-shopping"
          >
            ← Seguir comprando
          </Link>
        </div>

        {cargando && (
          <div className="orders-loading" aria-label="Cargando pedidos" aria-busy="true">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="orders-error-alert">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!cargando &&
          !error &&
          pedidos.length === 0 && (
            <Card className="orders-empty">
              <PackageSearch size={38} aria-hidden="true" />
              <h2>Todavía no tienes pedidos</h2>
              <p>Cuando realices una compra, aparecerá aquí.</p>
              <Button render={<Link to="/" />}>Ver productos</Button>
            </Card>
          )}

        {!cargando &&
          !error &&
          pedidos.length > 0 && (
            <div className="orders-list">
              {pedidos.map((pedido) => (
                <Card
                  className="order-card"
                  key={pedido.id}
                >
                  <div className="order-card-main">
                    <div>
                      <span className="order-label">
                        Pedido
                      </span>

                      <h2>
                        #{pedido.id}
                      </h2>
                    </div>

                    <div>
                      <span className="order-label">
                        Fecha
                      </span>

                      <p>
                        {new Date(
                          pedido.creado_en
                        ).toLocaleDateString(
                          'es-ES'
                        )}
                      </p>
                    </div>

                    <div>
                      <span className="order-label">
                        Estado
                      </span>

                      <Badge variant={variantEstado(pedido.estado)} className={`order-status order-status-${pedido.estado}`}>
                        {pedido.estado}
                      </Badge>
                    </div>

                    <div>
                      <span className="order-label">
                        Total
                      </span>

                      <strong>
                        {formatearPrecio(pedido.total)}
                      </strong>
                    </div>
                  </div>

                  <div className="order-card-actions">
                    <Button render={<Link to={`/pedidos/${pedido.id}`} />} className="order-view-button">Ver pedido</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}

export default Pedidos;
