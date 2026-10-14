import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import {
  aplicarCambioAtributo,
  aplicarCambioUso,
  categoriaAdmitePerfil,
  crearPayloadPerfil,
  filtrarAtributosPerfil,
  filtrarUsosPerfil,
  obtenerCamposAtributoCategoria,
  obtenerCamposUsoCategoria,
  obtenerPerfilRecomendacion,
} from '../src/services/perfilRecomendacionService.ts';

const campo = (categoria, clave) =>
  obtenerCamposAtributoCategoria(categoria).find((item) => item.clave === clave);

test('no envía perfil en categorías sin esquema IA', () => {
  const perfil = { usos: {}, atributos: {} };
  assert.equal(categoriaAdmitePerfil('Accesorios'), false);
  assert.equal(crearPayloadPerfil(perfil, 'Accesorios', 'listo'), undefined);
  assert.equal(crearPayloadPerfil(perfil, '', 'listo'), undefined);
});

test('no envía perfil si la carga falló o sigue en curso', () => {
  const perfil = { usos: {}, atributos: {} };
  assert.equal(crearPayloadPerfil(perfil, 'Portátiles', 'error'), undefined);
  assert.equal(crearPayloadPerfil(perfil, 'Portátiles', 'cargando'), undefined);
  assert.deepEqual(crearPayloadPerfil(perfil, 'Portátiles', 'listo'), perfil);
});

test('editar un atributo conserva las claves que el formulario no muestra', () => {
  const cargado = {
    usos: { gaming: 'adecuado', uso_futuro: 'adecuado' },
    atributos: { vram_gb: 12, rendimiento_gaming: 'alta', clave_futura: 'x' },
  };
  const editado = aplicarCambioAtributo(cargado, campo('Tarjetas gráficas', 'vram_gb'), 16);
  assert.deepEqual(crearPayloadPerfil(editado, 'Tarjetas gráficas', 'listo'), {
    usos: { gaming: 'adecuado', uso_futuro: 'adecuado' },
    atributos: { vram_gb: 16, rendimiento_gaming: 'alta', clave_futura: 'x' },
  });
  assert.equal(cargado.atributos.vram_gb, 12, 'no muta el perfil original');
});

test('vaciar o introducir un valor inválido elimina solo esa clave', () => {
  const cargado = { usos: {}, atributos: { ram_gb: 16, cpu_modelo: 'Apple M5' } };
  const ram = campo('Portátiles', 'ram_gb');
  assert.deepEqual(aplicarCambioAtributo(cargado, ram, undefined).atributos, { cpu_modelo: 'Apple M5' });
  assert.deepEqual(aplicarCambioAtributo(cargado, ram, -4).atributos, { cpu_modelo: 'Apple M5' });
  assert.deepEqual(aplicarCambioAtributo(cargado, ram, 2048).atributos, { cpu_modelo: 'Apple M5' });
});

test('los núcleos deben ser enteros', () => {
  const nucleos = campo('Procesadores', 'nucleos');
  assert.deepEqual(aplicarCambioAtributo({ usos: {}, atributos: {} }, nucleos, 7.5).atributos, {});
  assert.deepEqual(aplicarCambioAtributo({ usos: {}, atributos: {} }, nucleos, 8).atributos, { nucleos: 8 });
});

test('los campos de texto admiten espacios mientras se escribe', () => {
  const cpu = campo('Portátiles', 'cpu_modelo');
  const perfil = aplicarCambioAtributo({ usos: {}, atributos: {} }, cpu, 'Ryzen ');
  assert.equal(perfil.atributos.cpu_modelo, 'Ryzen ');
  assert.equal(aplicarCambioAtributo(perfil, cpu, 'Ryzen 7').atributos.cpu_modelo, 'Ryzen 7');
});

test('los usos se pueden valorar y dejar sin valorar', () => {
  let perfil = { usos: { trabajo: 'adecuado' }, atributos: {} };
  perfil = aplicarCambioUso(perfil, 'gaming', 'no_recomendado');
  assert.deepEqual(perfil.usos, { trabajo: 'adecuado', gaming: 'no_recomendado' });
  perfil = aplicarCambioUso(perfil, 'trabajo', undefined);
  assert.deepEqual(perfil.usos, { gaming: 'no_recomendado' });
  assert.deepEqual(filtrarUsosPerfil({ gaming: 'adecuado', gimnasio: 'adecuado', trabajo: 'otro' }, 'Portátiles'), {
    gaming: 'adecuado',
  });
});

test('muestra los campos de rendimiento de gráficas y procesadores', () => {
  assert.deepEqual(filtrarAtributosPerfil({ vram_gb: 12, rendimiento_gaming: 'alta' }, 'Tarjetas gráficas'), {
    vram_gb: 12,
    rendimiento_gaming: 'alta',
  });
  assert.deepEqual(filtrarAtributosPerfil({ rendimiento: 'media', nucleos: 8 }, 'Procesadores'), {
    nucleos: 8,
    rendimiento: 'media',
  });
});

test('la carga conserva el perfil completo, incluidas claves desconocidas', async () => {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({
      producto_id: 2,
      categoria_id: 2,
      categoria: 'Tarjetas gráficas',
      existe_perfil: true,
      perfil_ia: { usos: { gaming: 'adecuado' }, atributos: { vram_gb: 12, clave_futura: 'x' } },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  try {
    const respuesta = await obtenerPerfilRecomendacion(2);
    assert.deepEqual(respuesta.perfil_ia, {
      usos: { gaming: 'adecuado' },
      atributos: { vram_gb: 12, clave_futura: 'x' },
    });
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

test('la carga rechaza un perfil con formato inválido en vez de vaciarlo', async () => {
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ categoria: 'Portátiles', existe_perfil: true, perfil_ia: { atributos: [] } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  try {
    await assert.rejects(() => obtenerPerfilRecomendacion(1));
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

const php = process.env.PHP_BIN ?? 'C:/xampp/php/php.exe';

test('el esquema del frontend coincide con el del backend', { skip: !existsSync(php) && 'PHP no disponible' }, () => {
  const script = `require 'backend/productos/perfil_recomendacion.php';
    $r = [];
    foreach (['Portátiles','Tarjetas gráficas','Procesadores','Móviles','Auriculares','Smartwatch','Televisores'] as $c) {
      $e = esquemaPerfilPorCategoria($c);
      $r[$c] = ['usos' => $e['usos'], 'atributos' => array_keys($e['atributos'])];
    }
    echo json_encode($r);`;
  const backend = JSON.parse(execFileSync(php, ['-r', script], { encoding: 'utf8' }));

  for (const [categoria, esquema] of Object.entries(backend)) {
    assert.deepEqual(
      obtenerCamposAtributoCategoria(categoria).map((item) => item.clave),
      esquema.atributos,
      `atributos de ${categoria}`,
    );
    assert.deepEqual(
      obtenerCamposUsoCategoria(categoria).map((item) => item.clave),
      esquema.usos,
      `usos de ${categoria}`,
    );
  }
});
