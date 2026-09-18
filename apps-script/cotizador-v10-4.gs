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
var EDITORES = [
  'martinc@leucotec.mx',
  'colagenart@gmail.com',
  'rmmoncada5@gmail.com'
];

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

  var filas = h.getRange('B5:J12').getValues();
  var partes = [];
  for (var f = 0; f < filas.length; f++) {
    var d = String(filas[f][0] || '').trim();
    // Dosis reales (J) y precio por dosis: 2 cajas a $9,500 viajan como
    // 20 dosis a $950, igual que si se hubieran capturado en dosis.
    var dos = Number(filas[f][8]) || 0;
    var pre = dos > 0 ? (Number(filas[f][6]) || 0) / dos : 0;
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

  var filas = h.getRange('B5:J12').getValues();
  var lineas = [];
  for (var f = 0; f < filas.length; f++) {
    var d = String(filas[f][0] || '').trim();
    // Dosis reales (J) y precio por dosis: 2 cajas a $9,500 viajan como
    // 20 dosis a $950, igual que si se hubieran capturado en dosis.
    var dos = Number(filas[f][8]) || 0;
    var pre = dos > 0 ? (Number(filas[f][6]) || 0) / dos : 0;
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
  var deps = 'B5:C12;G5:G12;G22:J25;H30:I33;G38:I41;B46:B48;I5:I12';
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
    h.getRange('I5:I12'),  // unidad: DOSIS o CAJA 10
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
  // Una sede marcada LOCAL o FORANEO sin dosis tambien es descuadre: la suma
  // puede cuadrar y aun asi quedar una sede activa olvidada (sep 2026).
  var sinDosis = 'SUMPRODUCT((G22:G25<>"NINGUNA")*(G22:G25<>"")*(H22:H25<=0))>0';
  var descuadre = 'OR(' + suma + '<>C13;' + sinDosis + ')';

  // Margen igual o mayor al minimo = ok (Martin, 16 sep 2026). Se redondea a
  // 4 decimales para que un margen de exactamente 20% no salga 19.9999%.
  var unidadMal = 'SUMPRODUCT((I5:I12="CAJA 10")*NOT(ISNUMBER(SEARCH("COMIRNATY Omicron XBB";B5:B12))))>0';
  h.getRange('I17').setFormula(
    '=IF(' + unidadMal + ';"revisar unidad";IF(' + descuadre + ';"revisar dosis por sede";IF(ROUND((H17-F17)/H17;4)>=I2;"ok";"revisar precios")))'
  );

  // Las celdas de dosis por sede se pintan de rojo mientras no cuadren, para
  // que el vendedor vea donde esta el problema.
  var rango = h.getRange('H22:H25');
  var reglas = h.getConditionalFormatRules().filter(function (r) {
    return !r.getRanges().some(function (x) { return x.getA1Notation() === 'H22:H25'; });
  });
  reglas.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=' + descuadre.replace(/(G|H)(2[25])/g, '$$$1$$$2').replace('C13', '$C$13'))
    .setBackground('#F4CCCC').setFontColor('#990000')
    .setRanges([rango])
    .build());
  h.setConditionalFormatRules(reglas);
}

/**
 * Pone la formula de costo total que falta en los renglones 4 y 6 de vacunas.
 *
 * En el Excel de Martin F8 y F10 quedaron vacias: una vacuna capturada ahi no
 * sumaba su costo en F13 y el semaforo podia dar "ok" en falso. Es la misma
 * formula que el resto de la columna. Martin lo aprobo (sep 2026).
 *
 * Solo escribe si la celda esta vacia: se puede correr las veces que sea.
 * La columna F no esta entre los rangos editables de protegerHoja().
 */
function repararCostosFaltantes() {
  var h = hojaCotizador();
  [8, 10].forEach(function (fila) {
    var celda = h.getRange('F' + fila);
    if (!celda.getFormula() && celda.getValue() === '') {
      celda.setFormula('=E' + fila + '+D' + fila + '*C' + fila);
    }
  });
}

/**
 * Ajustes al Excel de Martin aprobados el 15 sep 2026. Idempotente.
 *
 * 1. Recargo por tarjeta (E5:E12). Su formula multiplicaba precio x % x costo
 *    de compra. Martin confirmo que es el % sobre lo que paga el cliente:
 *    precio x dosis x %. G3 tiene formato de porcentaje pero la nota dice
 *    "poner 2.5": si alguien escribe 2.5 se toma como 2.5%, no como 250%.
 *
 * 2. Sede en NINGUNA no cuesta nada. Antes una sede apagada con enfermeras o
 *    transporte capturados seguia sumando a la logistica. Ahora su tarifa
 *    (G30:G33) y su total (N38:N41) dan 0, y sus capturas se ven en gris.
 *
 * 3. Catalogo con espacio. La lista de productos de Costos llegaba justo a la
 *    fila 38 y debajo viven otras listas (margenes, horas, sedes). Se insertan
 *    filas vacias debajo de los productos para que Martin pueda agregar mas;
 *    esas listas se recorren solas. Un producto que no este en Costos ya no da
 *    un #N/A mudo: la celda dice "FALTA COSTO" y el semaforo no puede dar ok.
 */
var FILAS_EXTRA_CATALOGO = 60;

// Comirnaty se compra en cajas de 10 dosis. El vendedor puede capturarla en
// DOSIS o en CAJA 10 y la hoja debe dar exactamente lo mismo: 2 cajas a
// $9,500 = 20 dosis a $950. Aprobado por Martin (sep 2026). Solo aplica a las
// presentaciones "COMIRNATY Omicron XBB" (caja con 10 viales de 1 dosis).
var UNIDAD_CAJA = 'CAJA 10';
var PRODUCTO_CON_CAJA = 'COMIRNATY Omicron XBB';

/** Factor de la fila f: 10 si esa fila se capturo en cajas de Comirnaty. */
function factorCaja(f) {
  return 'IF(AND($I' + f + '="' + UNIDAD_CAJA + '";ISNUMBER(SEARCH("' + PRODUCTO_CON_CAJA + '";$B' + f + ')));10;1)';
}

function aplicarAjustesAprobados() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = hojaCotizador();
  var costos = libro.getSheetByName('Costos');

  // --- 3. Catalogo -------------------------------------------------------
  var ultima = 38;
  var yaAmpliado = /Costos!B\$3:C\$(\d+)/.exec(h.getRange('D5').getFormula());
  if (yaAmpliado && Number(yaAmpliado[1]) > 38) {
    ultima = Number(yaAmpliado[1]);
  } else {
    costos.insertRowsAfter(38, FILAS_EXTRA_CATALOGO);
    ultima = 38 + FILAS_EXTRA_CATALOGO;
  }
  for (var f = 5; f <= 12; f++) {
    h.getRange('D' + f).setFormula(
      '=IF(OR(B' + f + '="";B' + f + '="NINGUNA");0;IFERROR(VLOOKUP(B' + f + ';Costos!B$3:C$' + ultima + ';2;FALSE)*' + factorCaja(f) + ';"FALTA COSTO"))'
    );
  }
  var lista = costos.getRange('B3:B' + ultima);
  h.getRange('B5:B12').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInRange(lista, true).build()
  );

  // --- 1. Recargo por tarjeta --------------------------------------------
  for (var r = 5; r <= 12; r++) {
    h.getRange('E' + r).setFormula(
      '=G' + r + '*C' + r + '*IF(G$3>1;G$3/100;G$3)'
    );
  }

  // --- 2. Sede en NINGUNA ------------------------------------------------
  for (var i = 0; i < 4; i++) {
    var sede = 'G' + (22 + i);
    var horas = 'J' + (22 + i);
    h.getRange('G' + (30 + i)).setFormula(
      '=IF(' + sede + '="NINGUNA";0;IF(' + sede + '="FORANEO";801;IF(' + horas +
      '="ninguna";0;IF(' + horas + '="1 a 4";600;800))))'
    );
    h.getRange('N' + (38 + i)).setFormula(
      '=IF(' + sede + '="NINGUNA";0;J' + (30 + i) + '+J' + (38 + i) + '+L' + (38 + i) + ')'
    );
  }

  var reglas = h.getConditionalFormatRules().filter(function (regla) {
    return !regla.getRanges().some(function (x) {
      var a = x.getA1Notation();
      return /^H3[0-3]:I3[0-3]$|^G3[8-9]:I[34][0-9]$|^G4[01]:I4[01]$/.test(a);
    });
  });
  for (var k = 0; k < 4; k++) {
    reglas.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$G$' + (22 + k) + '="NINGUNA"')
      .setBackground('#EFEFEF').setFontColor('#999999')
      .setRanges([h.getRange('H' + (30 + k) + ':I' + (30 + k)), h.getRange('G' + (38 + k) + ':I' + (38 + k))])
      .build());
  }
  h.setConditionalFormatRules(reglas);

  // --- 4. Costos e Insumos protegidas (ocultar no es un candado) ---------
  protegerInternas();

  SpreadsheetApp.flush();
  Logger.log('Internas protegidas: ' + ['Costos', 'Insumos'].map(function (n) {
    return n + ' ' + libro.getSheetByName(n).getProtections(SpreadsheetApp.ProtectionType.SHEET).length;
  }).join(', '));
  Logger.log('Catalogo hasta fila ' + ultima + '. Listas: I2 ' +
    listaDe(h.getRange('I2')) + ' | J22 ' + listaDe(h.getRange('J22')) + ' | G22 ' + listaDe(h.getRange('G22')));
}

/**
 * Columna UNIDAD (I5:I12) y DOSIS REALES (J5:J12).
 *
 * - I: el vendedor elige DOSIS o CAJA 10. Verde, como toda captura.
 * - J: dosis que de verdad se aplican (cajas x 10). Calculada.
 * - C13 suma dosis reales: de ahi salen las dosis por sede, los insumos y el
 *   descuadre. D5:D12 ya multiplica el costo por el factor (ver arriba).
 * - Precio total (H) y costo total (F) no cambian: unidades x precio y
 *   unidades x costo por unidad. Por eso 2 cajas y 20 dosis dan lo mismo.
 * Idempotente.
 */
function aplicarUnidadCaja() {
  var h = hojaCotizador();

  h.getRange('H4').copyTo(h.getRange('I4:J4'), SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false);
  h.getRange('I4:J4').setValues([['UNIDAD', 'DOSIS REALES']]);

  var unidad = h.getRange('I5:I12');
  var actuales = unidad.getValues();
  unidad.setValues(actuales.map(function (r) { return [r[0] === UNIDAD_CAJA ? UNIDAD_CAJA : 'DOSIS']; }));
  unidad.setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['DOSIS', UNIDAD_CAJA], true).setAllowInvalid(false).build());
  unidad.setBackground(VERDE).setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true);

  for (var f = 5; f <= 12; f++) {
    h.getRange('J' + f).setFormula('=C' + f + '*' + factorCaja(f));
  }
  h.getRange('J5:J12').setHorizontalAlignment('center').setFontColor('#666666')
    .setBorder(true, true, true, true, true, true);

  h.getRange('C13').setFormula('=SUM(J5:J12)');

  // CAJA 10 en un producto que no se vende por caja: rojo, y el semaforo
  // (aplicarRevisionDosis) dice "revisar unidad".
  var reglas = h.getConditionalFormatRules().filter(function (regla) {
    return !regla.getRanges().some(function (x) { return x.getA1Notation() === 'I5:I12'; });
  });
  reglas.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($I5="' + UNIDAD_CAJA + '";NOT(ISNUMBER(SEARCH("' + PRODUCTO_CON_CAJA + '";$B5))))')
    .setBackground('#F4CCCC').setFontColor('#990000')
    .setRanges([unidad]).build());
  h.setConditionalFormatRules(reglas);
}

/** A que rango apunta la lista desplegable de una celda (para verificar). */
function listaDe(celda) {
  var dv = celda.getDataValidation();
  if (!dv) return 'sin lista';
  var v = dv.getCriteriaValues();
  return v && v[0] && v[0].getA1Notation ? v[0].getSheet().getName() + '!' + v[0].getA1Notation() : String(v);
}

/**
 * Costos e Insumos quedan protegidas: ocultar una hoja no es un candado.
 * Ojo: un editor del archivo igual puede LEERLAS. Si los vendedores no deben
 * ver costos, no pueden ser editores de este archivo.
 */
function protegerInternas() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  ['Costos', 'Insumos'].forEach(function (nombre) {
    var hoja = libro.getSheetByName(nombre);
    if (!hoja) return;
    hoja.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function (p) { p.remove(); });
    var prot = hoja.protect().setDescription('Costos internos. Solo editan: ' + EDITORES.join(', '));
    prot.addEditors(EDITORES);
    prot.getEditors().forEach(function (u) {
      if (EDITORES.indexOf(u.getEmail()) === -1) {
        try { prot.removeEditor(u.getEmail()); } catch (e) { /* dueño del archivo */ }
      }
    });
    if (prot.canDomainEdit()) prot.setDomainEdit(false);
  });
}

function conectar() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  prepararEnlace();
  repararCostosFaltantes();
  aplicarAjustesAprobados();
  aplicarUnidadCaja();
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
