// Google Apps Script — Leucotec ROI Sheet API
// Pega este código en: Extensiones → Apps Script
// Publica como Web App: Ejecutar como "Yo", Acceso "Cualquier persona"

function doGet(e) {
  try {
    var params = e.parameter;
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    hoja.appendRow([
      params.fecha    || '',
      params.nombre   || '',
      params.correo   || '',
      params.whatsapp || '',
      params.tipo     || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  // Mantener compatibilidad por si se llama vía POST en el futuro.
  return doGet(e);
}
