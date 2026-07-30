// Google Apps Script — Leucotec ROI Sheet API
// Pega este código en: Extensiones → Apps Script
// Publica como Web App:
//   - Ejecutar como: Yo (tu cuenta)
//   - Quién tiene acceso: Cualquier persona

function doPost(e) {
  try {
    var datos = JSON.parse(e.postData.contents);
    var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    hoja.appendRow([
      datos.fecha    || '',
      datos.nombre   || '',
      datos.correo   || '',
      datos.whatsapp || '',
      datos.tipo     || '',
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

function doGet(e) {
  return ContentService
    .createTextOutput("Leucotec ROI Sheet API activa.")
    .setMimeType(ContentService.MimeType.TEXT);
}
