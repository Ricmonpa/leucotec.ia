// ---------------------------------------------------------------------------
// SEMÁFORO DEL COTIZADOR EN LÍNEA — receptor doPost
//
// Vive en el proyecto de Apps Script del Sheet construido (ahí queda el
// historial de cotizaciones), pero desde sep 2026 los COSTOS y el MARGEN
// MÍNIMO se leen de la copia V10.4 del Excel de Martin. Una sola fuente: si
// Martin cambia un costo en su hoja, la web se entera en la siguiente consulta.
//
// La cuenta es la misma que la I17 de la V10.4:
//   margen = (precio total - (costo biológico + logística)) / precio total
//   "OK" si margen >= I2 (redondeado a 4 decimales); si no, "REVISAR".
// La logística la manda la web, calculada con el mismo motor que cuadra al
// centavo con la hoja. La web no tiene pago con tarjeta: recargo 0.
//
// Un producto que no esté en Costos de la V10.4 NUNCA cuenta como costo 0: la
// respuesta es REVISAR. Antes el VLOOKUP caía a 0 y podía dar OK en falso.
//
// Al navegador regresa OK o REVISAR. El % de margen sólo se entrega a una
// sesión válida del equipo de Leucotec (ver "Acceso" abajo). Nunca costos.
// OJO: repositorio público. Nada de cifras de costo aquí.
//
// Reemplaza en el proyecto las funciones doPost y escribirLinea anteriores.
// Tras pegarlo: Implementar > Administrar implementaciones > Editar >
// Nueva versión (la URL no cambia).
// ---------------------------------------------------------------------------

var ID_V104 = '1B6nQ9KAyXIE-rgAYEoiA7LrTcgzIfwoI0rRAEW9JXpY';

// Descripción del catálogo de Martin -> nombre comercial que manda la web.
// Es el mismo MAPA de cotizador-v10-4.gs.
var MAPA_V104 = {
  'ADACELBOOST 1 FCO, SUSP, INY, 1 DS': 'Adacel Boost',
  'MENACTRA,MENINGOCOCO,FA,1DS,0.5 ML': 'Menactra',
  'STAMARIL,FAMARILLA17D,1DS,SUS.INY,0.5ML': 'Stamaril',
  'TYPHIM Vl, TIFO02, JP,0.5MLSOL.INY': 'Typhim Vi',
  'VERORAB, ANTIRRAB, FA 0.5ML+JP 0.5ML,1DS': 'Verorab',
  'GARDASIL 9 - 0.5ML 1 DOSIS JP VPH': 'Gardasil 9',
  'MMR II TRIPLE VIRAL SRP 1 DOSIS 1 0.5 ml': 'MMR II',
  'PULMOVAX, NEUMOCOCO, SUSP, 1 DS, 0.5 ML': 'Pulmovax',
  'VAQTA,HEPATITIS A, ADT,50U,FA 1ML': 'Vaqta adulto (solo A)',
  'VARIVAX, VARICELA, FA, 1 DS, 0.5 ML': 'Varivax',
  'BOOSTRIX, DPT ACELULAR, 1JP, 1DS, 0.5ML': 'Boostrix',
  'ENGERIX B ADT,HEPATITISB,1 JP, 1DS, 1ML': 'Engerix-B adulto (solo B)',
  'HAVRIX ADT, HEPATITISA14440u,1JP,1DS,1ML': 'Havrix adulto (solo A)',
  'PRIORIX, TRIPLE VIRAL, JP, 1DS, 0.5ML': 'Priorix',
  'PREVENAR 20': 'Prevenar 20',
  'VAXIGRIP TETRA 1 SUSP INY 0.5ML 1D': 'Vaxigrip Tetra',
  'FLUZACTAL TETRA, SUS,10 DS,1FCO,5ML': 'Fluzactal Tetra'
};

/** Sin acentos ni mayúsculas: la web escribe "sólo A", la hoja "solo A". */
function normalizarNombre(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

function nombreCortoV104(descripcion) {
  if (MAPA_V104[descripcion]) return MAPA_V104[descripcion];
  if (descripcion.indexOf('SHINGRIX') === 0) return 'Shingrix';
  if (descripcion.indexOf('COMIRNATY Omicron XBB 1.5 30') === 0) return 'Comirnaty XBB adulto';
  if (descripcion.indexOf('COMIRNATY Omicron XBB 1.5 10') === 0) return 'Comirnaty XBB pediatrico';
  return '';
}

/** Costos y margen mínimo, leídos en vivo de la V10.4. */
function leerV104() {
  var libro = SpreadsheetApp.openById(ID_V104);
  var costos = libro.getSheetByName('Costos');
  var filas = costos.getRange(3, 2, costos.getLastRow() - 2, 2).getValues();
  var porNombre = {};
  filas.forEach(function (f) {
    var corto = nombreCortoV104(String(f[0] || '').trim());
    var costo = Number(f[1]);
    if (corto && isFinite(costo) && costo > 0) porNombre[normalizarNombre(corto)] = costo;
  });

  var cot = libro.getSheets().filter(function (h) {
    return h.getName().indexOf('COTIZADOR') === 0;
  })[0] || libro.getSheets()[0];
  var margen = Number(cot.getRange('I2').getValue());

  return { costos: porNombre, margenMinimo: isFinite(margen) ? margen : 0.2 };
}

/**
 * Costo por dosis de un producto de la web. Los esquemas combinados
 * ("Havrix + Engerix-B") suman sus partes. null si falta alguna.
 */
function costoProducto(v104, producto) {
  var partes = String(producto || '').split('+');
  var total = 0;
  for (var i = 0; i < partes.length; i++) {
    var n = normalizarNombre(partes[i]);
    var c = v104.costos[n];
    if (c === undefined) {
      // "Havrix" en un combo es "Havrix adulto (solo A)" en la hoja.
      var clave = Object.keys(v104.costos).filter(function (k) { return k.indexOf(n) === 0; })[0];
      c = clave ? v104.costos[clave] : undefined;
    }
    if (c === undefined) return null;
    total += c;
  }
  return total;
}

// ---------------------------------------------------------------------------
// Acceso al cotizador en línea: código por correo.
//
// Leucotec usa correo de Microsoft, así que no sirve "Entrar con Google". El
// vendedor escribe su correo, le llega un código de 6 dígitos y con él obtiene
// una sesión firmada de 30 días. La firma usa un secreto que vive en las
// propiedades del script: el navegador no puede fabricar una sesión.
//
// Sólo con sesión válida se entrega el % de margen. Sin sesión, el semáforo
// sigue respondiendo OK/REVISAR como siempre (lo usa también el simulador).
// ---------------------------------------------------------------------------

var DOMINIO_PERMITIDO = '@leucotec.mx';
var CORREOS_PERMITIDOS = ['colagenart@gmail.com', 'rmmoncada5@gmail.com'];
var DIAS_SESION = 30;
var MINUTOS_CODIGO = 10;
var INTENTOS_CODIGO = 5;

function correoPermitido(correo) {
  correo = String(correo || '').trim().toLowerCase();
  return /^[^@\s]+@[^@\s]+$/.test(correo) &&
    (correo.slice(-DOMINIO_PERMITIDO.length) === DOMINIO_PERMITIDO ||
      CORREOS_PERMITIDOS.indexOf(correo) !== -1);
}

function secretoSesion() {
  var props = PropertiesService.getScriptProperties();
  var s = props.getProperty('SECRETO_SESION');
  if (!s) {
    s = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty('SECRETO_SESION', s);
  }
  return s;
}

function firmar(texto) {
  var bytes = Utilities.computeHmacSha256Signature(texto, secretoSesion());
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function crearSesion(correo) {
  var carga = correo + '|' + (Date.now() + DIAS_SESION * 86400000);
  return Utilities.base64EncodeWebSafe(carga).replace(/=+$/, '') + '.' + firmar(carga);
}

/** Correo de la sesión, o null si no es válida o ya venció. */
function leerSesion(token) {
  var partes = String(token || '').split('.');
  if (partes.length !== 2) return null;
  var carga;
  try {
    carga = Utilities.newBlob(Utilities.base64DecodeWebSafe(partes[0])).getDataAsString();
  } catch (e) {
    return null;
  }
  if (firmar(carga) !== partes[1]) return null;
  var c = carga.split('|');
  if (Number(c[1]) < Date.now() || !correoPermitido(c[0])) return null;
  return c[0];
}

function pedirCodigo(d) {
  var correo = String(d.correo || '').trim().toLowerCase();
  if (!correoPermitido(correo)) return { ok: false, error: 'correo-no-autorizado' };

  var cache = CacheService.getScriptCache();
  if (cache.get('espera:' + correo)) return { ok: false, error: 'espera' };

  var codigo = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('codigo:' + correo, JSON.stringify({ codigo: codigo, intentos: 0 }), MINUTOS_CODIGO * 60);
  cache.put('espera:' + correo, '1', 45);

  MailApp.sendEmail({
    to: correo,
    subject: 'Tu código para el cotizador Leucotec: ' + codigo,
    body: 'Tu código de acceso al cotizador de Grupo Leucotec es: ' + codigo + '\n\n' +
      'Vence en ' + MINUTOS_CODIGO + ' minutos. Si no lo pediste, ignora este correo.',
    name: 'Cotizador Leucotec'
  });
  return { ok: true };
}

function verificarCodigo(d) {
  var correo = String(d.correo || '').trim().toLowerCase();
  var cache = CacheService.getScriptCache();
  var guardado = cache.get('codigo:' + correo);
  if (!guardado) return { ok: false, error: 'codigo-vencido' };

  var g = JSON.parse(guardado);
  if (String(d.codigo || '').trim() !== g.codigo) {
    g.intentos += 1;
    if (g.intentos >= INTENTOS_CODIGO) cache.remove('codigo:' + correo);
    else cache.put('codigo:' + correo, JSON.stringify(g), MINUTOS_CODIGO * 60);
    return { ok: false, error: 'codigo-incorrecto' };
  }
  cache.remove('codigo:' + correo);
  return { ok: true, correo: correo, sesion: crearSesion(correo), dias: DIAS_SESION };
}

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.tipo === 'pedirCodigo') return responder(pedirCodigo(d));
    if (d.tipo === 'verificarCodigo') return responder(verificarCodigo(d));
    if (d.tipo !== 'cotizacion') return responder({ ok: true, ignorado: true });
    var usuario = leerSesion(d.sesion);

    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var L = libro.getSheetByName('Cotizaciones');
    var R = libro.getSheetByName('Resumen');
    var folio = d.folio || ('COT-' + new Date().getTime());
    var v104 = leerV104();

    var precioTotal = 0;
    var costoTotal = 0;
    var faltaCosto = false;

    (d.lineas || []).forEach(function (l) {
      var dosis = Number(l.personas) || 0;
      var precio = Number(l.precioUnitario) || 0;
      var costo = costoProducto(v104, l.producto);
      if (costo === null) faltaCosto = true;
      precioTotal += dosis * precio;
      costoTotal += dosis * (costo || 0);
      escribirLinea(L, folio, d, l.producto + (costo === null ? ' (SIN COSTO EN V10.4)' : ''),
        dosis, precio, costo || 0);
    });

    var log = d.logistica;
    if (log && log.total > 0) {
      costoTotal += Number(log.total) || 0;
      if (log.cobradaAlCliente) precioTotal += Number(log.total) || 0;
      escribirLinea(L, folio, d, 'Logistica de campana (' + log.dosis + ' dosis)',
        1, log.cobradaAlCliente ? log.total : 0, log.total);
    }

    var margen = precioTotal > 0 ? (precioTotal - costoTotal) / precioTotal : 0;
    // Igual o mayor al minimo = OK, como la I17 de Martin (16 sep 2026).
    var estado = !faltaCosto && Math.round(margen * 10000) / 10000 >= v104.margenMinimo ? 'OK' : 'REVISAR';

    var r = R.getLastRow() + 1;
    R.getRange(r, 1, 1, 4).setValues([[folio, d.fecha || new Date(), d.vendedor || '', d.empresa || '']]);
    R.getRange(r, 5).setFormula('=SUMIF(Cotizaciones!$A:$A;A' + r + ';Cotizaciones!$H:$H)');
    R.getRange(r, 6).setFormula('=SUMIF(Cotizaciones!$A:$A;A' + r + ';Cotizaciones!$J:$J)');
    R.getRange(r, 7).setFormula('=E' + r + '-F' + r);
    R.getRange(r, 8).setFormula('=IF(E' + r + '>0;G' + r + '/E' + r + ';0)');
    // El estado se fija al momento de cotizar, con el margen mínimo de la
    // V10.4 de ese momento: si Martin lo cambia después, el historial no se
    // reescribe solo.
    R.getRange(r, 9).setValue(estado);
    R.getRange(r, 5, 1, 3).setNumberFormat('$#,##0');
    R.getRange(r, 8).setNumberFormat('0.0%');

    SpreadsheetApp.flush();
    var respuesta = { ok: true, folio: folio, estado: estado };
    // El % sólo va a una sesión del equipo; sin sesión, sólo el semáforo.
    if (usuario && !faltaCosto) respuesta.margen = Math.round(margen * 1000) / 10;
    return responder(respuesta);
  } catch (err) {
    return responder({ ok: false, error: String(err) });
  }
}

/** Una línea del historial. El costo queda fijo al momento de cotizar. */
function escribirLinea(L, folio, d, concepto, cantidad, precio, costo) {
  var f = L.getLastRow() + 1;
  L.getRange(f, 1, 1, 7).setValues([[
    folio, d.fecha || new Date(), d.vendedor || '', d.empresa || '',
    concepto, cantidad || 0, precio || 0
  ]]);
  L.getRange(f, 8).setFormula('=F' + f + '*G' + f);
  L.getRange(f, 9).setValue(costo || 0);
  L.getRange(f, 10).setFormula('=F' + f + '*I' + f);
  L.getRange(f, 11).setFormula('=H' + f + '-J' + f);
  L.getRange(f, 12).setFormula('=IF(H' + f + '>0;K' + f + '/H' + f + ';0)');
  L.getRange(f, 7, 1, 5).setNumberFormat('$#,##0.00');
  L.getRange(f, 12).setNumberFormat('0.0%');
}

/**
 * Correr UNA vez desde el editor: hace que Google pida el permiso de enviar
 * correos (para los códigos de acceso). Solo consulta la cuota; no envía nada.
 */
function autorizarCorreo() {
  Logger.log('Correos disponibles hoy: ' + MailApp.getRemainingDailyQuota());
}
