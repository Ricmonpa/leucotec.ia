// ---------------------------------------------------------------------------
// COTIZADOR LEUCOTEC V10.4 — copia fiel, conectada al simulador de ROI
//
// Esta hoja es el Excel de Martin subido tal cual y convertido a Sheets:
// mismas celdas, mismas fórmulas, mismo formato, las hojas Costos e Insumos
// siguen ocultas y las columnas D:F también. Aquí NO se reconstruyó nada.
//
// Lo único que se agrega es un bloque DEBAJO de su rejilla (filas 45 a 53):
// los datos del cliente que su archivo no tenía, el botón IMPRIMIR COTIZACION
// y el botón VER RETORNO DE LA INVERSION, que abre la propuesta de ROI de solo
// lectura con los mismos datos y el mismo folio. Su área de trabajo, de la fila 1 a la 42,
// queda intacta.
//
// Hoja:   1B6nQ9KAyXIE-rgAYEoiA7LrTcgzIfwoI0rRAEW9JXpY
// Origen: COTIZADOR Campaña Vacunas varias 022024 V10.4.xlsx
//
// Verificado contra el caso que Martin capturó en su archivo:
//   30 dosis de Fluzactal a $405, sede LOCAL "1 a 4", 1 enfermera, 1 jornada,
//   transporte $800  ->  logística $2,277.19, precio $12,150, semáforo "ok".
//
// OJO: este repositorio es público. Nunca escribas aquí costos de compra ni
// márgenes, ni siquiera de ejemplo: con el margen y el precio se despeja el
// costo con una resta.
//
// Para conectarlo: Leucotec > Conectar con el simulador.
// ---------------------------------------------------------------------------

var URL_SIMULADOR = 'https://leucotec.ia.potenttial.site/';

// La cotizacion impresa vive en la web: es el mismo documento que imprime el
// dashboard. Si cada puerta armara su propia cotizacion, en un mes dejarian
// de coincidir.
var URL_COTIZACION = 'https://leucotec.ia.potenttial.site/cotizacion';

// Quién puede editar las fórmulas. Los vendedores solo tocan las celdas
// verdes. En Sheets no hay contraseña: se nombra por correo, que además es
// mejor, porque si alguien se va se le quita el acceso sin cambiarle la clave
// a todo el equipo.
var EDITORES = ['martinc@leucotec.mx', 'rmmoncada5@gmail.com'];

var VERDE = '#D9EAD3';

// Descripción del catálogo de Martin -> nombre corto que entiende el
// simulador. Los que no tienen equivalente en campaña corporativa
// (pediátricos, rotavirus, hexavalentes) se quedan fuera a propósito.
var MAPA = {
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

/** La hoja del cotizador, sin depender de como se llame exactamente. */
function hojaCotizador() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hojas = libro.getSheets();
  for (var i = 0; i < hojas.length; i++) {
    if (hojas[i].getRange('N42').getFormula() || hojas[i].getName().indexOf('COTIZADOR') === 0) {
      return hojas[i];
    }
  }
  return hojas[0];
}

/** Shingrix trae un nombre larguísimo: se busca por prefijo. */
function nombreCorto(descripcion) {
  if (MAPA[descripcion]) return MAPA[descripcion];
  if (descripcion.indexOf('SHINGRIX') === 0) return 'Shingrix';
  if (descripcion.indexOf('COMIRNATY Omicron XBB 1.5 30') === 0) return 'Comirnaty XBB adulto';
  if (descripcion.indexOf('COMIRNATY Omicron XBB 1.5 10') === 0) return 'Comirnaty XBB pediatrico';
  return '';
}

/**
 * Arma el enlace que abre el simulador con esta cotización cargada.
 *
 * Solo viaja lo que el cliente ya tiene enfrente: empresa, personas y PRECIO
 * DE VENTA. El costo de compra de las columnas ocultas nunca sale de aquí.
 *
 * Los argumentos no se usan dentro: existen para que Sheets sepa de qué
 * celdas depende el enlace y lo vuelva a calcular cuando cambien.
 */
function ENLACEROI(dosis, precio, logistica, cliente, empleados, costoDia) {
  var h = hojaCotizador();

  var filas = h.getRange('B5:H12').getValues();
  var partes = [];
  for (var f = 0; f < filas.length; f++) {
    var d = String(filas[f][0] || '').trim();
    var dos = Number(filas[f][1]) || 0;
    var pre = Number(filas[f][5]) || 0;
    if (!d || d === 'NINGUNA' || dos <= 0) continue;
    var corto = nombreCorto(d);
    if (!corto) continue;
    partes.push(corto + ':' + dos + ':' + pre);
  }
  if (!partes.length) return 'Elige al menos una vacuna con dosis.';

  var empresa = String(h.getRange('B46').getValue() || '').trim();
  var emp = Number(h.getRange('B47').getValue()) || 0;
  var dia = Number(h.getRange('B48').getValue()) || 0;
  if (!emp) emp = Number(h.getRange('C13').getValue()) || 0;

  // Las cuatro sedes viajan completas. Pueden operar al mismo tiempo, así que
  // los días NO se suman entre ellas: cada una lleva su propio equipo.
  var sedes = h.getRange('G22:J25').getValues(); // sede, dosis, destino, horas
  var enf = h.getRange('H30:I33').getValues();   // enfermeras por dia, dias
  var via = h.getRange('G38:I41').getValues();   // transporte, covid, comidas
  var bloques = [];
  for (var s = 0; s < 4; s++) {
    var tipo = String(sedes[s][0] || '').toUpperCase();
    if (!tipo || tipo === 'NINGUNA') continue;
    var horas = String(sedes[s][3] || '');
    var destino = String(sedes[s][2] || '').trim().replace(/[:|]/g, ' ');
    bloques.push([
      destino,
      Number(sedes[s][1]) || 0,
      tipo === 'FORANEO' ? 'foranea' : 'local',
      horas === '1 a 4' ? '1a4' : 'mas4',
      Number(enf[s][0]) || 0,
      Number(enf[s][1]) || 0,
      Number(via[s][0]) || 0,
      Number(via[s][2]) || 0
    ].join(':'));
  }

  var q = [
    'empresa=' + encodeURIComponent(empresa),
    'emp=' + emp,
    'dia=' + dia,
    'v=' + encodeURIComponent(partes.join(',')),
    'log=0',
    'sedes=' + encodeURIComponent(bloques.join('|'))
  ];
  return URL_SIMULADOR + '?' + q.join('&');
}

/**
 * Arma el enlace que abre la cotizacion detallada lista para imprimir.
 *
 * A diferencia del enlace al ROI, aqui viajan TODOS los renglones: un
 * producto sin equivalente en el simulador igual se cotiza y tiene que salir
 * impreso, o el total del documento no cuadra con la hoja. Si el producto
 * tiene nombre comercial se usa ese, que es el que entiende el cliente; si
 * no, la descripcion del catalogo.
 *
 * La cotizacion viaja como JSON en base64: las descripciones de Martin traen
 * comas, dos puntos y acentos, y con separadores un renglon se partiria.
 *
 * Solo viajan PRECIOS DE VENTA. Los costos de compra nunca salen de la hoja.
 *
 * Los argumentos no se usan dentro: son TODAS las celdas que el vendedor
 * captura, para que Sheets rehaga el enlace en cuanto cambie cualquiera. Si
 * falta una, el vendedor imprime la cotizacion anterior sin darse cuenta.
 */
function COTIZACIONURL(vacunas, precios, sedesCaptura, equipo, viaticos, cliente) {
  var h = hojaCotizador();

  var filas = h.getRange('B5:H12').getValues();
  var lineas = [];
  for (var f = 0; f < filas.length; f++) {
    var d = String(filas[f][0] || '').trim();
    var dos = Number(filas[f][1]) || 0;
    var pre = Number(filas[f][5]) || 0;
    if (!d || d === 'NINGUNA' || dos <= 0) continue;
    lineas.push([nombreCorto(d) || d, dos, pre]);
  }
  if (!lineas.length) return '';

  var sedes = h.getRange('G22:J25').getValues(); // sede, dosis, destino, horas
  var enf = h.getRange('H30:I33').getValues();   // enfermeras por dia, dias
  var via = h.getRange('G38:I41').getValues();   // transporte, covid, comidas
  var s = [];
  for (var i = 0; i < 4; i++) {
    var tipo = String(sedes[i][0] || '').toUpperCase();
    if (!tipo || tipo === 'NINGUNA') continue;
    s.push([
      String(sedes[i][2] || '').trim(),
      Number(sedes[i][1]) || 0,
      tipo === 'FORANEO' ? 1 : 0,
      String(sedes[i][3] || '') === '1 a 4' ? 0 : 1,
      Number(enf[i][0]) || 0,
      Number(enf[i][1]) || 0,
      Number(via[i][0]) || 0,
      Number(via[i][2]) || 0
    ]);
  }

  var ahora = new Date();
  var dos2 = function (n) { return (n < 10 ? '0' : '') + n; };
  var folio = 'COT-' + ahora.getFullYear() + dos2(ahora.getMonth() + 1) + dos2(ahora.getDate()) +
    '-' + dos2(ahora.getHours()) + dos2(ahora.getMinutes());

  var carga = {
    f: folio,
    c: String(h.getRange('B46').getValue() || '').trim(),
    e: Number(h.getRange('B47').getValue()) || 0,
    l: lineas,
    s: s,
    cl: 0, // la operacion va dentro del precio por dosis: se enumera como "Incluido"
    d: Number(h.getRange('B48').getValue()) || 0 // costo dia: solo lo usa la propuesta de ROI
  };
  var b64 = Utilities.base64EncodeWebSafe(JSON.stringify(carga), Utilities.Charset.UTF_8)
    .replace(/=+$/, '');
  return URL_COTIZACION + '?c=' + b64;
}

/**
 * Agrega el bloque del ROI DEBAJO de la rejilla de Martin.
 *
 * Su hoja trabaja de la fila 1 a la 42 y ahí no se toca nada. El bloque va en
 * la 45 en adelante, con las celdas de captura en el mismo verde claro que el
 * resto de sus campos editables, para que el vendedor lo reconozca solo.
 */
function prepararEnlace() {
  var h = hojaCotizador();
  if (h.getMaxRows() < 53) h.insertRowsAfter(h.getMaxRows(), 53 - h.getMaxRows());

  // Lo que el vendedor ya capturo no se pierde al reacomodar el bloque.
  var capturado = h.getRange('B46:B48').getValues();

  // Por si la hoja trae el acomodo anterior del bloque.
  h.getRange('A45:F53').breakApart();
  h.getRange('A45:F53').clearContent().clearFormat();

  h.getRange('A45').setValue('DATOS DEL CLIENTE').setFontWeight('bold');
  h.getRange('A46:A48').setValues([['CLIENTE'], ['No. DE EMPLEADOS'], ['COSTO DIA / EMPLEADO']])
    .setFontWeight('bold');
  h.getRange('B46:B48').setValues([
    [capturado[0][0]], [capturado[1][0]], [capturado[2][0] || 1300]
  ]);
  h.getRange('B48').setNumberFormat('"$"#,##0.00');
  h.getRange('B46:B48').setBackground(VERDE)
    .setBorder(true, true, true, true, true, true);

  // El boton que importa: la cotizacion es el producto final del proceso.
  var deps = 'B5:C12;G5:G12;G22:J25;H30:I33;G38:I41;B46:B48';
  h.getRange('A50').setValue('COTIZACION').setFontWeight('bold');
  h.getRange('B50:F50').merge();
  h.getRange('B50')
    // LET calcula el enlace una sola vez; sin eso se arma dos veces por celda.
    .setFormula('=LET(u;COTIZACIONURL(' + deps + ');' +
      'IF(u="";"Captura al menos una vacuna con dosis";HYPERLINK(u;"IMPRIMIR COTIZACION")))')
    .setBackground('#DC052B').setFontColor('#FFFFFF').setFontWeight('bold')
    .setFontSize(13).setHorizontalAlignment('center').setVerticalAlignment('middle');
  h.setRowHeight(50, 36);

  // La propuesta de retorno lee el MISMO enlace que la cotizacion: mismo folio,
  // mismos renglones, y su inversion es el total de la cotizacion al peso. Es
  // de solo lectura: el cliente no puede acomodar los numeros. (El simulador
  // editable de ENLACEROI queda para la fase de captacion de leads.)
  h.getRange('A52').setValue('RETORNO DE LA INVERSION').setFontWeight('bold');
  h.getRange('B52:F52').merge();
  h.getRange('B52')
    .setFormula('=LET(u;COTIZACIONURL(' + deps + ');' +
      'IF(u="";"";HYPERLINK(SUBSTITUTE(u;"/cotizacion?";"/propuesta?");"VER RETORNO DE LA INVERSION")))')
    .setBackground('#1F2A44').setFontColor('#FFFFFF').setFontWeight('bold')
    .setFontSize(11).setHorizontalAlignment('center').setVerticalAlignment('middle');
  h.setRowHeight(52, 30);

  h.getRange('A53').setValue(
    'Las celdas verdes se capturan. Lo demas se calcula solo y esta bloqueado.'
  ).setFontColor('#666666').setFontStyle('italic');
}

/**
 * Bloquea todo menos lo que el vendedor debe capturar.
 *
 * Son exactamente las celdas que Martin dejó en verde en su Excel, más las
 * tres del bloque del ROI.
 */
function protegerHoja() {
  var h = hojaCotizador();
  var previas = h.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (var i = 0; i < previas.length; i++) previas[i].remove();

  var prot = h.protect().setDescription(
    'Solo se editan las celdas verdes. Lo demas se calcula solo.'
  );
  prot.setUnprotectedRanges([
    h.getRange('I2'),      // margen objetivo
    h.getRange('G3'),      // recargo por pago con tarjeta
    h.getRange('B5:C12'),  // vacuna y dosis
    h.getRange('G5:G12'),  // precio unitario
    h.getRange('G22:J25'), // sede, dosis, destino y horas
    h.getRange('H30:I33'), // enfermeras por dia y jornadas
    h.getRange('G38:G41'), // transporte
    h.getRange('I38:I41'), // comidas
    h.getRange('B46:B48')  // datos para el ROI
  ]);

  prot.addEditors(EDITORES);
  var actuales = prot.getEditors();
  for (var j = 0; j < actuales.length; j++) {
    var correo = actuales[j].getEmail();
    if (EDITORES.indexOf(correo) === -1) {
      try {
        prot.removeEditor(correo);
      } catch (e) {
        // Es el dueño del archivo: Google no deja quitarlo.
      }
    }
  }
  if (prot.canDomainEdit()) prot.setDomainEdit(false);
}

/** Deja las hojas internas ocultas, por si alguien las mostró. */
function ocultarInternas() {
  var hojas = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  for (var i = 0; i < hojas.length; i++) {
    var n = hojas[i].getName();
    if (n === 'Costos' || n === 'Insumos') hojas[i].hideSheet();
  }
}

/**
 * Semaforo con doble condicion, aprobado por Martin (14 sep 2026).
 *
 * Las dosis de cada sede se escriben a mano. Si las sedes activas no suman el
 * total de vacunas (C13), los insumos salen mal y el margen no es confiable:
 * el semaforo no puede decir "ok". Primero se revisan las dosis; despues, el
 * margen, igual que siempre.
 *
 * Las sedes en NINGUNA no cuentan, por si quedo un numero olvidado.
 * Es idempotente: se puede correr las veces que sea.
 */
function aplicarRevisionDosis() {
  var h = hojaCotizador();
  var suma = 'SUMIF(G22:G25;"<>NINGUNA";H22:H25)';

  h.getRange('I17').setFormula(
    '=IF(' + suma + '<>C13;"revisar dosis por sede";IF((H17-F17)/H17>I2;"ok";"revisar precios"))'
  );

  // Las celdas de dosis por sede se pintan de rojo mientras no cuadren, para
  // que el vendedor vea donde esta el problema.
  var rango = h.getRange('H22:H25');
  var reglas = h.getConditionalFormatRules().filter(function (r) {
    return !r.getRanges().some(function (x) { return x.getA1Notation() === 'H22:H25'; });
  });
  reglas.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=' + suma.replace(/(G|H)(2[25])/g, '$$$1$$$2') + '<>$C$13')
    .setBackground('#F4CCCC').setFontColor('#990000')
    .setRanges([rango])
    .build());
  h.setConditionalFormatRules(reglas);
}

function conectar() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  prepararEnlace();
  aplicarRevisionDosis();
  ocultarInternas();
  protegerHoja();
  SpreadsheetApp.flush();
  libro.toast('Conectado. Pueden editar todo: ' + EDITORES.join(', '), 'Leucotec', 8);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Leucotec')
    .addItem('Conectar con el simulador', 'conectar')
    .addToUi();
}
