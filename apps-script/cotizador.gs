// ---------------------------------------------------------------------------
// COTIZADOR LEUCOTEC — parte "Cotizar" del Apps Script del Google Sheet
//
// Este archivo es la porción que N3 escribió para replicar el cotizador de
// Leucotec. El script desplegado en la hoja contiene además las funciones que
// ya existían: los arreglos COSTOS y CATALOGO, crearCostos, crearCatalogo,
// crearCotizaciones, crearResumen, crearConfig, y el receptor doPost que
// registra las cotizaciones que manda el simulador. Esas no se tocaron.
//
// Hoja:    1ZXaWwevHDBcUutGOA1b4Lf11zsVERzu8_E3vzhiI9t4
// Script:  1B7Ew18lOOavScUpmRtmp2tZIGcUupjpKEE6DueHclYeLy5c_FWdbnsDX
//
// Réplica de "COTIZADOR Campaña Vacunas varias 022024 V10.3.xlsx". Se
// conservan las direcciones de celda del Excel original para poder
// compararlas lado a lado. Lo que cambia es el formato, no el cálculo.
//
// CONVENCIÓN DE COLOR, la que explicó Martín:
//   Verde fuerte -> el ejecutivo ELIGE de una lista
//   Verde claro  -> el ejecutivo ESCRIBE el valor
//   Gris         -> se calcula solo, no se toca
//
// EL CANDADO DE MARTIN, replicado en sus tres capas:
//   1. Las columnas D:F llevan el costo de compra y van OCULTAS, igual que en
//      su Excel, donde literalmente dicen "Datos ocultos".
//   2. Las hojas Costos, Catalogo e Insumos van ocultas: sus vendedores no
//      deben ver los costos de compra.
//   3. La hoja Cotizar va protegida, asi que las formulas no se pisan por
//      accidente. Solo quedan libres las celdas verdes.
//
// OJO: la hoja está en es-ES. Las fórmulas separan argumentos con PUNTO Y
// COMA. Con coma devuelven #ERROR!.
// ---------------------------------------------------------------------------

/**
 * Arma el enlace que abre el simulador de ROI ya cargado con esta cotizacion.
 * Solo viaja lo que el cliente ya tiene enfrente: empresa, personas y PRECIO
 * DE VENTA. El costo de compra nunca sale de esta hoja.
 *
 * Los argumentos NO se usan dentro: existen para que la hoja sepa de que
 * celdas depende el enlace. Sin ellos, Sheets nunca lo vuelve a calcular y
 * el vendedor se lleva al cliente el enlace de la cotizacion anterior.
 */
function ENLACEROI(dosis, precio, logistica, cliente, empleados, costoDia) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var h = libro.getSheetByName('Cotizar');
  var cat = libro.getSheetByName('Catalogo');
  if (!h || !cat) return '';

  // Descripcion larga del catalogo -> nombre corto que entiende el simulador.
  var mapa = {};
  var nCat = Math.max(1, cat.getLastRow() - 1);
  var filasCat = cat.getRange(2, 1, nCat, 2).getValues();
  for (var i = 0; i < filasCat.length; i++) {
    var desc = String(filasCat[i][1] || '').trim();
    if (desc) mapa[desc] = String(filasCat[i][0] || '').trim();
  }

  var filas = h.getRange('B5:H12').getValues();
  var partes = [];
  for (var f = 0; f < filas.length; f++) {
    var d = String(filas[f][0] || '').trim();
    var dos = Number(filas[f][1]) || 0;
    var pre = Number(filas[f][5]) || 0;
    if (!d || d === 'NINGUNA' || dos <= 0) continue;
    var corto = mapa[d];
    if (!corto) continue; // producto sin equivalente en el simulador
    partes.push(corto + ':' + dos + ':' + pre);
  }
  if (!partes.length) return 'Elige al menos una vacuna con dosis.';

  var empresa = String(h.getRange('B1').getValue() || '').trim();
  var empleados = Number(h.getRange('B2').getValue()) || 0;
  var costoDia = Number(h.getRange('B3').getValue()) || 0;
  if (!empleados) empleados = Number(h.getRange('C13').getValue()) || 0;

  // Cada sede viaja completa. Su cotizador admite cuatro y pueden operar al
  // mismo tiempo, asi que los dias NO se suman entre ellas: cada sede lleva su
  // propio equipo y el simulador las calcula por separado.
  var filasSede = h.getRange('G22:J25').getValues(); // sede, dosis, destino, horas
  var filasEnf = h.getRange('H30:I33').getValues();  // enfermeras por dia, dias
  var filasVia = h.getRange('G38:I41').getValues();  // transporte, covid, comidas
  var bloques = [];
  for (var s = 0; s < 4; s++) {
    var tipo = String(filasSede[s][0] || '').toUpperCase();
    if (!tipo || tipo === 'NINGUNA') continue;
    var horas = String(filasSede[s][3] || '');
    // Los dos puntos y la barra separan los campos: si el destino los trae,
    // el enlace se parte en pedazos equivocados.
    var destino = String(filasSede[s][2] || '').trim().replace(/[:|]/g, ' ');
    bloques.push([
      destino,
      Number(filasSede[s][1]) || 0,
      tipo === 'FORANEO' ? 'foranea' : 'local',
      horas === '1 a 4' ? '1a4' : 'mas4',
      Number(filasEnf[s][0]) || 0,
      Number(filasEnf[s][1]) || 0,
      Number(filasVia[s][0]) || 0,
      Number(filasVia[s][2]) || 0
    ].join(':'));
  }

  var q = [
    'empresa=' + encodeURIComponent(empresa),
    'emp=' + empleados,
    'dia=' + costoDia,
    'v=' + encodeURIComponent(partes.join(',')),
    'log=0',
    'sedes=' + encodeURIComponent(bloques.join('|'))
  ];
  return URL_SIMULADOR + '?' + q.join('&');
}

var V_FUERTE = '#93C47D';
var V_CLARO = '#D9EAD3';
var V_TITULO = '#92D050';
var OCULTO = '#FCE5CD';
var AMARILLO = '#FFFF00';
var GRIS = '#F3F3F3';
var MONEDA = '"$"#,##0.00';

function crearCotizar(libro) {
  var h = hoja(libro, 'Cotizar');
  h.setHiddenGridlines(true);

  // Su catalogo debe ofrecer NINGUNA para poder apagar un renglon.
  var costos = libro.getSheetByName('Costos');
  var descs = costos.getRange(2, 1, Math.max(1, costos.getLastRow() - 1), 1).getValues();
  var hayNinguna = false;
  for (var k = 0; k < descs.length; k++) {
    if (String(descs[k][0]).trim().toUpperCase() === 'NINGUNA') hayNinguna = true;
  }
  if (!hayNinguna) {
    costos.getRange(costos.getLastRow() + 1, 1, 1, 2).setValues([['NINGUNA', 0]]);
  }

  // ---- Datos del cliente. Su Excel no los tenia; los necesita el ROI. -----
  h.getRange('A1:A3').setValues([['CLIENTE'], ['No. DE EMPLEADOS'], ['COSTO DIA / EMPLEADO']])
    .setFontWeight('bold');
  h.getRange('B2').setValue(0);
  h.getRange('B3').setValue(1300).setNumberFormat(MONEDA);
  h.getRange('B1:B3').setBackground(V_CLARO)
    .setBorder(true, true, true, true, true, true);

  // ---- Margen objetivo y recargo por tarjeta ------------------------------
  h.getRange('I1').setValue('SELECCIONA MARGEN').setFontWeight('bold').setBackground(V_FUERTE);
  h.getRange('I2').setValue(0.2).setNumberFormat('0%').setBackground(V_FUERTE);
  h.getRange('J2').setValue('Para COVID 60 dosis considerar margen de 30%').setFontColor('#FF0000');
  h.getRange('G2').setValue('Si el pago es con tarjeta poner 2.5 abajo. Si no, dejar 0.')
    .setFontColor('#666666');
  h.getRange('G3').setValue(0).setBackground(V_CLARO)
    .setBorder(true, true, true, true, true, true);
  h.getRange('D3:F3').merge().setValue('Datos ocultos').setBackground(OCULTO)
    .setHorizontalAlignment('center').setFontWeight('bold');
  h.getRange('I3').setValue('RESULTADO').setFontWeight('bold');

  // ---- Bloque de vacunas (filas 4 a 17) ----------------------------------
  h.getRange('A4:I4').setValues([['VACUNA', 'VACUNA', 'DOSIS', 'Costo U', 'Costo TC',
    'Costo Total', 'PRECIO UNITARIO', 'PRECIO TOTAL', 'Precio de lista']])
    .setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
  h.getRange('A4:C4').setBackground(V_TITULO);
  h.getRange('D4:F4').setBackground(OCULTO);
  h.getRange('G4:H4').setBackground(V_TITULO);
  h.getRange('I4').setBackground(GRIS);

  for (var i = 0; i < 8; i++) {
    var f = 5 + i;
    h.getRange(f, 1).setValue(i + 1).setHorizontalAlignment('center');
    h.getRange(f, 2).setValue('NINGUNA');
    h.getRange(f, 3).setValue(0);
    h.getRange(f, 7).setValue(0);
    // Su formula truena con #N/A si el producto no esta; aqui devuelve 0 para
    // que el margen no se rompa en pantalla.
    h.getRange(f, 4).setFormula('=IF(B' + f + '="NINGUNA";0;IFERROR(VLOOKUP(B' + f + ';Costos!$A:$B;2;FALSE);0))');
    h.getRange(f, 5).setFormula('=G' + f + '*$G$3*D' + f);
    h.getRange(f, 6).setFormula('=E' + f + '+D' + f + '*C' + f);
    h.getRange(f, 8).setFormula('=IF(B' + f + '="NINGUNA";0;G' + f + '*C' + f + ')');
    // Referencia: precio de lista del catalogo. No obliga nada, solo evita
    // que el vendedor tenga que acordarse del precio de memoria.
    h.getRange(f, 9).setFormula('=IF(B' + f + '="NINGUNA";"";IFERROR(VLOOKUP(B' + f + ';Catalogo!$B:$D;3;FALSE);""))');
  }
  h.getRange('B5:B12').setBackground(V_FUERTE).setWrap(true);
  h.getRange('C5:C12').setBackground(V_CLARO).setHorizontalAlignment('center');
  h.getRange('G5:G12').setBackground(V_FUERTE).setNumberFormat(MONEDA);
  h.getRange('D5:F12').setBackground(OCULTO).setNumberFormat(MONEDA);
  h.getRange('H5:H12').setBackground(V_TITULO).setNumberFormat(MONEDA);
  h.getRange('I5:I12').setBackground(GRIS).setNumberFormat(MONEDA).setFontColor('#666666');

  h.getRange('C13').setFormula('=SUM(C5:C12)').setFontWeight('bold').setHorizontalAlignment('center');
  h.getRange('F13').setFormula('=SUM(F5:F12)');
  h.getRange('E15').setValue('LOGISTICA');
  h.getRange('F15').setFormula('=N42');
  h.getRange('B17').setValue('GRAN TOTAL').setFontWeight('bold');
  h.getRange('F17').setFormula('=F13+F15').setFontWeight('bold');
  h.getRange('D13:F17').setBackground(OCULTO);
  h.getRange('F13:F17').setNumberFormat(MONEDA);

  h.getRange('H16').setValue('Precio total Campana').setFontWeight('bold');
  h.getRange('H17').setFormula('=SUM(H5:H12)').setFontWeight('bold')
    .setBackground(V_TITULO).setNumberFormat(MONEDA);
  // Semaforo identico al suyo, pero sin dividir entre cero.
  h.getRange('I17').setFormula('=IF(H17=0;"";IF((H17-F17)/H17>$I$2;"ok";"revisar precios"))')
    .setFontWeight('bold').setHorizontalAlignment('center');
  // El margen real en porcentaje. Su Excel no lo mostraba y es la cifra que
  // el vendedor necesita para negociar.
  h.getRange('J16').setValue('Margen real').setFontWeight('bold');
  h.getRange('J17').setFormula('=IF(H17=0;"";(H17-F17)/H17)')
    .setNumberFormat('0.0%').setFontWeight('bold');

  // ---- Enlace al simulador de ROI ----------------------------------------
  h.getRange('A19').setValue('SIMULADOR DE ROI').setFontWeight('bold');
  h.getRange('B19:F19').merge();
  h.getRange('B19').setFormula('=ENLACEROI(C13;H17;N42;B1;B2;B3)')
    .setWrap(true).setFontColor('#1155CC');

  // ---- Logistica, paso 1: sedes (filas 21 a 25) --------------------------
  // Su Excel admite hasta CUATRO sedes por campana, cada una con sus dosis,
  // destino, enfermeras, dias, transporte y comidas.
  h.getRange('B21').setValue('Seguir el orden de datos a ingresar para logistica').setBackground(AMARILLO);
  h.getRange('C21').setValue(1).setBackground(AMARILLO).setHorizontalAlignment('center').setFontWeight('bold');
  h.getRange('G21:J21').setValues([['SEDE DE CAMPANA', 'DOSIS', 'DESTINO', 'HORAS POR DIA']])
    .setFontWeight('bold').setBackground(V_TITULO).setWrap(true);
  h.getRange('G22:G25').setValue('NINGUNA').setBackground(V_FUERTE);
  h.getRange('J22:J25').setValue('Ninguna').setBackground(V_FUERTE);
  h.getRange('H22:I25').setBackground(V_CLARO);
  h.getRange('G22').setValue('LOCAL');
  h.getRange('J22').setValue('1 a 4');
  // La primera sede arranca con TODAS las dosis. Si hay varias, se reparten.
  h.getRange('H22').setFormula('=C13');

  // ---- Logistica, paso 2: enfermeras (filas 29 a 33) ---------------------
  h.getRange('B29').setValue('Seguir el orden de datos a ingresar para logistica').setBackground(AMARILLO);
  h.getRange('C29').setValue(2).setBackground(AMARILLO).setHorizontalAlignment('center').setFontWeight('bold');
  h.getRange('G29:J29').setValues([['COSTO DE ENFERMERA POR DIA', 'ENFERMERAS POR DIA',
    'DIAS DE VACUNACION', 'COSTO TOTAL ENFERMERAS']])
    .setFontWeight('bold').setBackground(V_TITULO).setWrap(true);

  // ---- Logistica, paso 3: viaticos e insumos (filas 37 a 42) -------------
  h.getRange('B37').setValue('Seguir el orden de datos a ingresar para logistica').setBackground(AMARILLO);
  h.getRange('C37').setValue(3).setBackground(AMARILLO).setHorizontalAlignment('center').setFontWeight('bold');
  h.getRange('G37:N37').setValues([['COSTO TRANSPORTE (taxi, camion, avion)', 'PRUEBA COVID',
    'Comidas (120 Des, 150 Com, 130 Cen)', 'TOTAL VIATICOS', '', 'Insumos aplicacion',
    '', 'TOTAL LOGISTICA']])
    .setFontWeight('bold').setBackground(V_TITULO).setWrap(true);

  for (var s = 0; s < 4; s++) {
    var fs = 22 + s; // sede
    var fe = 30 + s; // enfermeras
    var fv = 38 + s; // viaticos
    h.getRange(fe, 7).setFormula('=IF(G' + fs + '="FORANEO";801;IF(J' + fs + '="Ninguna";0;IF(J' + fs + '="1 a 4";600;800)))');
    h.getRange(fe, 10).setFormula('=G' + fe + '*H' + fe + '*I' + fe);
    // La prueba COVID se paga UNA vez por sede, no por jornada.
    h.getRange(fv, 8).setFormula('=IF(H' + fe + '>0;335;0)');
    h.getRange(fv, 10).setFormula('=I' + fv + '+G' + fv + '+H' + fv);
    // El costo por dosis YA incluye botes y servicio de RPBI: no se suma aparte.
    h.getRange(fv, 12).setFormula('=IF(N(H' + fs + ')=0;0;H' + fs + '*Insumos!$B$22)');
    h.getRange(fv, 14).setFormula('=J' + fe + '+J' + fv + '+L' + fv);
  }
  h.getRange('H30:I33').setBackground(V_CLARO).setHorizontalAlignment('center');
  h.getRange('H30').setValue(1);
  h.getRange('I30').setValue(3);
  h.getRange('G30:G33').setBackground(GRIS).setNumberFormat(MONEDA);
  h.getRange('J30:J33').setBackground(GRIS).setNumberFormat(MONEDA);
  h.getRange('G38:G41').setBackground(V_CLARO).setNumberFormat(MONEDA);
  h.getRange('I38:I41').setBackground(V_CLARO).setNumberFormat(MONEDA);
  h.getRange('G38').setValue(1500);
  h.getRange('I38').setValue(0);
  h.getRange('H38:H41').setBackground(GRIS).setNumberFormat(MONEDA);
  h.getRange('J38:J41').setBackground(GRIS).setNumberFormat(MONEDA);
  h.getRange('L38:L41').setBackground(GRIS).setNumberFormat(MONEDA);
  h.getRange('N38:N41').setBackground(GRIS).setNumberFormat(MONEDA);
  h.getRange('M42').setValue('TOTAL').setFontWeight('bold').setHorizontalAlignment('right');
  h.getRange('N42').setFormula('=SUM(N38:N41)').setFontWeight('bold')
    .setBackground(V_TITULO).setNumberFormat(MONEDA);

  // ---- Leyenda de color ---------------------------------------------------
  h.getRange('A44').setValue('Como se llena esta hoja').setFontWeight('bold');
  h.getRange('A45').setValue('Elige de la lista').setBackground(V_FUERTE);
  h.getRange('B45').setValue('Vacuna, precio unitario, sede y horas por dia.');
  h.getRange('A46').setValue('Escribe el valor').setBackground(V_CLARO);
  h.getRange('B46').setValue('Dosis, enfermeras, dias, transporte y comidas.');
  h.getRange('A47').setValue('No se toca').setBackground(GRIS);
  h.getRange('B47').setValue('Todo lo demas se calcula solo.');
  h.getRange('A45:A47').setHorizontalAlignment('center');

  validacionesCotizar(libro, h);

  h.setColumnWidth(1, 130);
  h.setColumnWidth(2, 330);
  h.setColumnWidth(3, 70);
  h.setColumnWidths(7, 4, 130);
  h.setColumnWidth(12, 130);
  h.setColumnWidth(14, 130);
  h.hideColumns(4, 3);
  prepararConfig(libro);
  protegerCotizar(libro, h);
  ocultarInternas(libro);
  SpreadsheetApp.flush();
}

// ---------------------------------------------------------------------------
// El candado de Martin.
//
// En su Excel el libro lleva contraseña. Sheets no tiene contraseñas: usa
// IDENTIDAD. En vez de un secreto que se comparte y se filtra, se nombra por
// correo a quien sí puede editar lo bloqueado. Para Martin es mejor: no tiene
// que acordarse de nada, y si un vendedor se va, se le quita el acceso sin
// cambiarle la clave a todo el mundo.
//
// Los correos se capturan en la hoja Config. Si no hay ninguno, el candado se
// queda en modo aviso a propósito: un bloqueo duro mal configurado dejaría
// fuera al equipo entero, incluido Martin.
// ---------------------------------------------------------------------------

/** Renglón de Config donde se capturan los correos con permiso. */
var ETIQUETA_CORREOS = 'Correos que pueden editar lo bloqueado';

/** Se asegura de que Config tenga el renglón de correos. */
function prepararConfig(libro) {
  var c = libro.getSheetByName('Config');
  if (!c) return;
  var valores = c.getRange(1, 1, Math.max(1, c.getLastRow()), 1).getValues();
  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][0]).trim() === ETIQUETA_CORREOS) return;
  }
  var f = c.getLastRow() + 1;
  c.getRange(f, 1, 1, 3).setValues([[
    ETIQUETA_CORREOS, '',
    'Separados por coma. Solo ellos pueden tocar las formulas y las celdas ' +
    'grises. Despues de cambiarlos, corre Leucotec > Aplicar candado.'
  ]]);
  c.getRange(f, 2).setBackground('#D9EAD3');
}

/** Lee de Config los correos con permiso para editar lo bloqueado. */
function correosAutorizados(libro) {
  var c = libro.getSheetByName('Config');
  if (!c) return [];
  var valores = c.getRange(1, 1, Math.max(1, c.getLastRow()), 2).getValues();
  var crudo = '';
  for (var i = 0; i < valores.length; i++) {
    if (String(valores[i][0]).trim() === ETIQUETA_CORREOS) crudo = String(valores[i][1] || '');
  }
  var lista = [];
  var partes = crudo.split(/[,;\s]+/);
  for (var j = 0; j < partes.length; j++) {
    var correo = partes[j].trim();
    if (correo.indexOf('@') > 0) lista.push(correo);
  }
  return lista;
}

/**
 * Deja una hoja bloqueada para todos menos para los correos autorizados.
 *
 * La protección nace heredando a TODOS los editores del archivo, así que hay
 * que sacarlos uno por uno. Al dueño del archivo no se le puede quitar: eso es
 * de Google y no tiene vuelta.
 */
function candar(h, correos, libres, descripcion) {
  var previas = h.getProtections(SpreadsheetApp.ProtectionType.SHEET);
  for (var i = 0; i < previas.length; i++) previas[i].remove();

  var prot = h.protect().setDescription(descripcion);
  if (libres && libres.length) prot.setUnprotectedRanges(libres);

  if (!correos.length) {
    // Sin nadie configurado, un bloqueo duro dejaría fuera al equipo entero.
    prot.setWarningOnly(true);
    return;
  }

  prot.addEditors(correos);
  var actuales = prot.getEditors();
  for (var j = 0; j < actuales.length; j++) {
    var correo = actuales[j].getEmail();
    if (correos.indexOf(correo) === -1) {
      try {
        prot.removeEditor(correo);
      } catch (e) {
        // Es el dueño del archivo: Google no permite quitarlo.
      }
    }
  }
  if (prot.canDomainEdit()) prot.setDomainEdit(false);
}

function protegerCotizar(libro, h) {
  var correos = correosAutorizados(libro);
  candar(h, correos, [
    h.getRange('B1:B3'),   // cliente, empleados, costo dia
    h.getRange('G3'),      // recargo por tarjeta
    h.getRange('I2'),      // margen objetivo
    h.getRange('B5:C12'),  // vacuna y dosis
    h.getRange('G5:G12'),  // precio unitario
    h.getRange('G22:J25'), // sede, dosis, destino y horas
    h.getRange('H30:I33'), // enfermeras por dia y jornadas
    h.getRange('G38:G41'), // transporte
    h.getRange('I38:I41')  // comidas
  ], 'Solo se editan las celdas verdes. Lo demas se calcula solo.');

  // Config manda sobre el candado: si un vendedor pudiera escribir ahí, se
  // agregaría su propio correo y abriría la hoja entera.
  var c = libro.getSheetByName('Config');
  if (c) candar(c, correos, null, 'Configuracion del cotizador.');
}

/**
 * Esconde las hojas internas.
 *
 * OJO, y esto importa: esconder y proteger NO esconden los VALORES. La
 * protección impide escribir, no leer, y cualquier editor puede volver a
 * mostrar una hoja desde Ver > Hojas ocultas. Sheets no tiene el equivalente
 * a la contraseña de estructura del Excel de Martin.
 *
 * Para que los vendedores no vean los costos de compra hay que moverlos a
 * OTRO archivo que ellos no puedan abrir y traerlos con IMPORTRANGE. Ahí el
 * permiso de Google sí hace de contraseña. Mientras eso no pase, esto evita
 * el descuido, no al curioso.
 */
function ocultarInternas(libro) {
  var internas = ['Costos', 'Catalogo', 'Insumos'];
  for (var i = 0; i < internas.length; i++) {
    var h = libro.getSheetByName(internas[i]);
    if (h) h.hideSheet();
  }
}

/** Vuelve a aplicar el candado con los correos que estén hoy en Config. */
function aplicarCandado() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  prepararConfig(libro);
  var h = libro.getSheetByName('Cotizar');
  if (h) protegerCotizar(libro, h);
  ocultarInternas(libro);
  var correos = correosAutorizados(libro);
  libro.toast(
    correos.length
      ? 'Candado puesto. Pueden editar: ' + correos.join(', ')
      : 'Sin correos en Config: el candado quedo solo como aviso.',
    'Leucotec', 8
  );
}

/** Desplegables: exactamente los campos verde fuerte. */
function validacionesCotizar(libro, h) {
  var costos = libro.getSheetByName('Costos');
  var n = Math.max(1, costos.getLastRow() - 1);
  var vacunas = SpreadsheetApp.newDataValidation()
    .requireValueInRange(costos.getRange(2, 1, n, 1), true)
    .setAllowInvalid(false).setHelpText('Elige la vacuna del catalogo.').build();
  h.getRange('B5:B12').setDataValidation(vacunas);

  var sede = SpreadsheetApp.newDataValidation()
    .requireValueInList(['NINGUNA', 'LOCAL', 'FORANEO'], true).setAllowInvalid(false).build();
  h.getRange('G22:G25').setDataValidation(sede);

  var horas = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Ninguna', '1 a 4', '4 mas'], true).setAllowInvalid(false)
    .setHelpText('De 1 a 4 horas la enfermera cuesta 600; mas de 4 horas, 800.').build();
  h.getRange('J22:J25').setDataValidation(horas);
}

// ---------------------------------------------------------------------------
// Insumos: cuanto cuesta aplicar UNA dosis.
//
// Su Excel arma tres escenarios de volumen (100 / 500 / 1000 dosis) y luego se
// queda con el PROMEDIO de los tres, sin importar cuantas dosis lleve la
// campana. No es lo que uno esperaria, porque el costo por dosis baja fuerte
// con el volumen, pero es su criterio y aqui se replica igual. El desglose
// queda a la vista para que puedan cambiarlo cuando quieran.
//
// Este costo YA incluye los botes de RPBI y el servicio de recoleccion
// certificada. No hay que sumarlos aparte.
// ---------------------------------------------------------------------------
function sembrarInsumos(libro) {
  var h = hoja(libro, 'Insumos');
  h.getRange('A1').setValue('COSTO DE INSUMOS POR DOSIS APLICADA').setFontWeight('bold');
  h.getRange('A2').setValue('El cotizador usa el PROMEDIO de los tres escenarios.')
    .setFontColor('#666666');

  h.getRange('A4:E4').setValues([['Insumo', 'Por dosis', '100 dosis', '500 dosis', '1000 dosis']])
    .setFontWeight('bold').setBackground(V_TITULO);
  h.getRange('A5:E10').setValues([
    ['Parche vacuna', 0.46, 46, 230, 460],
    ['Torunda algodon', 0.35, 35, 175, 350],
    ['Gel 200ml (2ml)', 0.24, 24, 120, 240],
    ['Cubrebocas (1 c/10)', 0.24, 24, 120, 240],
    ['Guantes latex par', 2.5, 250, 1250, 2500],
    ['Campo (1 c/20)', 0.75, 75, 375, 750]
  ]);
  h.getRange('A11').setValue('Subtotal consumibles').setFontWeight('bold');
  h.getRange('B11:E11').setFormulas([['=SUM(B5:B10)', '=SUM(C5:C10)', '=SUM(D5:D10)', '=SUM(E5:E10)']]);
  h.getRange('A12:E12').setValues([['Botes RPBI (inversion) 26L + 53L', 518, 1923, 1923, 1923]]);
  h.getRange('A13:E13').setValues([['Servicio RPBI certificado (por evento)', 1200, 1200, 1200, 1200]]);
  h.getRange('A14').setValue('TOTAL REAL').setFontWeight('bold');
  h.getRange('B14:E14').setFormulas([['=B11+B12+B13', '=C11+C12+C13', '=D11+D12+D13', '=E11+E12+E13']]);
  h.getRange('A15').setValue('Dosis del escenario').setFontWeight('bold');
  h.getRange('C15:E15').setValues([[100, 500, 1000]]);
  h.getRange('A16').setValue('Costo por dosis').setFontWeight('bold');
  h.getRange('C16:E16').setFormulas([['=C14/C15', '=D14/D15', '=E14/E15']]);

  h.getRange('A18:B18').setValues([['Rango', 'Costo insumos por dosis']])
    .setFontWeight('bold').setBackground(V_TITULO);
  h.getRange('A19:A22').setValues([['1 a 100'], ['101 a 500'], ['500+'], ['PROMEDIO']]);
  h.getRange('B19:B22').setFormulas([['=C16'], ['=D16'], ['=E16'], ['=AVERAGE(B19:B21)']]);
  h.getRange('B22').setFontWeight('bold').setBackground(V_TITULO);

  h.getRange('B5:E22').setNumberFormat(MONEDA);
  h.getRange('C15:E15').setNumberFormat('#,##0');
  h.setColumnWidth(1, 260);
}

/**
 * Rehace solo el cotizador y sus insumos.
 *
 * A diferencia de instalar(), NO toca Cotizaciones ni Resumen, asi que no se
 * pierde el historico de lo que ya se cotizo.
 */
function reconstruirCotizador() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  sembrarInsumos(libro);
  crearCotizar(libro);
  libro.setActiveSheet(libro.getSheetByName('Cotizar'));
  libro.toast('Cotizador reconstruido.', 'Leucotec', 5);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Leucotec')
    .addItem('Rehacer cotizador', 'reconstruirCotizador')
    .addItem('Aplicar candado', 'aplicarCandado')
    .addSeparator()
    .addItem('Instalar todo (borra el historico)', 'instalar')
    .addToUi();
}
