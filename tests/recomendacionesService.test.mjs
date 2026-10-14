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

test('acepta solo recomendaciones confirmadas', async () => {
  const restaurar = conFetchMock({
    recommendations: [{ producto, reason: 'Criterio técnico verificado.' }],
    candidates: [],
  });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.equal(respuesta.recommendations.length, 1);
    assert.deepEqual(respuesta.candidates, []);
  } finally {
    restaurar();
  }
});

test('acepta solo candidatos sin message', async () => {
  const restaurar = conFetchMock({
    recommendations: [],
    candidates: [{ producto, reason: 'Idoneidad no confirmada.' }],
  });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.deepEqual(respuesta.recommendations, []);
    assert.equal(respuesta.candidates.length, 1);
    assert.equal(respuesta.candidates[0].reason, 'Idoneidad no confirmada.');
  } finally {
    restaurar();
  }
});

test('acepta recomendaciones y candidatos en listas separadas', async () => {
  const restaurar = conFetchMock({
    recommendations: [{ producto, reason: 'Confirmada.' }],
    candidates: [{ producto: { ...producto, id: 7 }, reason: 'No confirmada.' }],
  });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.equal(respuesta.recommendations.length, 1);
    assert.equal(respuesta.candidates.length, 1);
  } finally {
    restaurar();
  }
});

test('exige y conserva un mensaje válido cuando ambas listas están vacías', async () => {
  const message = 'No encontramos coincidencias claras en el catálogo para esa búsqueda y uso. Prueba con otros términos.';
  const restaurar = conFetchMock({ recommendations: [], candidates: [], message });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.deepEqual(respuesta.recommendations, []);
    assert.deepEqual(respuesta.candidates, []);
    assert.equal(respuesta.message, message);
  } finally {
    restaurar();
  }
});

test('normaliza respuestas antiguas sin candidates', async () => {
  const restaurar = conFetchMock({
    recommendations: [{ producto, reason: 'Respuesta anterior.' }],
  });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.deepEqual(respuesta.candidates, []);
  } finally {
    restaurar();
  }
});

test('mantiene compatibilidad con la respuesta antigua vacía con message', async () => {
  const message = 'No hay productos disponibles dentro de ese presupuesto.';
  const restaurar = conFetchMock({ recommendations: [], message });
  try {
    const respuesta = await solicitarRecomendaciones(solicitud);
    assert.deepEqual(respuesta.candidates, []);
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

test('rechaza listas malformadas y respuesta vacía sin mensaje', async (context) => {
  const respuestasInvalidas = [
    { recommendations: [], candidates: { producto, reason: 'no es lista' } },
    { recommendations: [], candidates: [] },
    { recommendations: [], candidates: [{ producto, reason: 42 }] },
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
