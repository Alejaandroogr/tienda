import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ErrorRecomendaciones,
  solicitarRecomendaciones,
} from '../src/services/recomendacionesService.ts';

const solicitud = {
  consulta: 'portátil para jugar',
  uso: 'jugar',
  presupuesto: 1500,
};

const producto = {
  id: 6,
  nombre: 'Portátil de prueba',
  descripcion: 'Descripción',
  precio: '1200.00',
  stock: 2,
  imagen: null,
  categoria: 'Portátiles',
};

function conFetchMock(body, status = 200) {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  return () => {
    globalThis.fetch = fetchOriginal;
  };
}

function conJsonMalformado() {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response('{malformado', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  return () => {
    globalThis.fetch = fetchOriginal;
  };
}

test('acepta recomendaciones sin mensaje', async () => {
  const restaurar = conFetchMock({
    recommendations: [{ producto, reason: 'Criterio técnico verificado.', source: 'php' }],
  });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.equal(respuesta.recommendations.length, 1);
    assert.equal(respuesta.recommendations[0].reason, 'Criterio técnico verificado.');
    assert.equal(respuesta.message, undefined);
  } finally {
    restaurar();
  }
});

test('descarta el grupo candidates de un backend anterior', async () => {
  const restaurar = conFetchMock({
    recommendations: [{ producto, reason: 'Confirmada.' }],
    candidates: [{ producto: { ...producto, id: 7 }, reason: 'No confirmada.' }],
  });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.equal(respuesta.recommendations.length, 1);
    assert.equal('candidates' in respuesta, false);
  } finally {
    restaurar();
  }
});

test('no muestra candidatos aunque lleguen sin recomendados ni mensaje', async () => {
  const restaurar = conFetchMock({
    recommendations: [],
    candidates: [{ producto, reason: 'Idoneidad no confirmada.' }],
  });
  try {
    await assert.rejects(solicitarRecomendaciones(solicitud), (error) => {
      assert.ok(error instanceof ErrorRecomendaciones);
      assert.equal(error.code, 'invalid_response');
      return true;
    });
  } finally {
    restaurar();
  }
});

test('conserva el mensaje cuando no hay recomendados', async () => {
  const message = 'No hay productos que cumplan todo lo que pides. Prueba a ampliar el presupuesto o cambiar la búsqueda.';
  const restaurar = conFetchMock({ recommendations: [], message });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.deepEqual(respuesta.recommendations, []);
    assert.equal(respuesta.message, message);
  } finally {
    restaurar();
  }
});

test('acepta el mensaje dinámico con el producto más barato', async () => {
  const message = 'No hay productos de Auriculares dentro de tu presupuesto (100,00 €). El más barato disponible es «Logitech G Pro X», por 129,00 €.';
  const restaurar = conFetchMock({ recommendations: [], message });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.equal(respuesta.message, message);
  } finally {
    restaurar();
  }
});

test('convierte un error HTTP del backend conservando código y status', async () => {
  const restaurar = conFetchMock(
    { error: { code: 'catalog_unavailable', message: 'Catálogo no disponible.' } },
    500,
  );
  try {
    await assert.rejects(solicitarRecomendaciones(solicitud), (error) => {
      assert.ok(error instanceof ErrorRecomendaciones);
      assert.equal(error.code, 'catalog_unavailable');
      assert.equal(error.status, 500);
      return true;
    });
  } finally {
    restaurar();
  }
});

test('rechaza JSON malformado como respuesta inválida', async () => {
  const restaurar = conJsonMalformado();
  try {
    await assert.rejects(solicitarRecomendaciones(solicitud), (error) => {
      assert.ok(error instanceof ErrorRecomendaciones);
      assert.equal(error.code, 'invalid_response');
      return true;
    });
  } finally {
    restaurar();
  }
});

test('rechaza recomendaciones malformadas y mensajes vacíos o demasiado largos', async (context) => {
  const respuestasInvalidas = [
    { recommendations: { producto, reason: 'no es lista' } },
    { recommendations: [] },
    { recommendations: [{ producto, reason: 42 }] },
    { recommendations: [], message: '   ' },
    { recommendations: [], message: 'x'.repeat(501) },
  ];

  for (const respuestaInvalida of respuestasInvalidas) {
    await context.test('estructura inválida', async () => {
      const restaurar = conFetchMock(respuestaInvalida);
      try {
        await assert.rejects(solicitarRecomendaciones(solicitud), (error) => {
          assert.ok(error instanceof ErrorRecomendaciones);
          assert.equal(error.code, 'invalid_response');
          return true;
        });
      } finally {
        restaurar();
      }
    });
  }
});

test('acepta la lista «Disponibles» con su aviso, separada de las recomendaciones', async () => {
  const message = 'No hemos identificado para qué lo quieres. Estos son los productos de Smartwatch disponibles; dinos el uso y te recomendaremos los que mejor encajen.';
  const restaurar = conFetchMock({
    recommendations: [],
    available: { categoria: 'Smartwatch', productos: [producto, { ...producto, id: 9 }] },
    message,
    detection: { usos: [], via: 'ninguna' },
  });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.deepEqual(respuesta.recommendations, []);
    assert.equal(respuesta.available.categoria, 'Smartwatch');
    assert.equal(respuesta.available.productos.length, 2);
    assert.equal(respuesta.message, message);
  } finally {
    restaurar();
  }
});

test('conserva los avisos sobre la consulta', async () => {
  const aviso = 'No valoramos Smartwatch para programar, así que no hemos tenido en cuenta ese uso.';
  const restaurar = conFetchMock({ recommendations: [], message: 'Sin resultados.', notices: [aviso] });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.deepEqual(respuesta.notices, [aviso]);
  } finally {
    restaurar();
  }
});

test('rechaza una lista «Disponibles» o unos avisos malformados', async (context) => {
  const invalidas = [
    { recommendations: [], message: 'x', available: { categoria: 'Smartwatch', productos: [{ id: 'no' }] } },
    { recommendations: [], message: 'x', available: { productos: [producto] } },
    { recommendations: [], message: 'x', notices: 'no es una lista' },
    { recommendations: [], message: 'x', notices: [''] },
  ];
  for (const invalida of invalidas) {
    await context.test('estructura inválida', async () => {
      const restaurar = conFetchMock(invalida);
      try {
        await assert.rejects(solicitarRecomendaciones(solicitud), (error) => error instanceof ErrorRecomendaciones && error.code === 'invalid_response');
      } finally {
        restaurar();
      }
    });
  }
});
