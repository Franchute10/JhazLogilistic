// ═══════════════════════════════════════════════════════
// JHAZ OPERADOR LOGÍSTICO — Backend Google Apps Script
// ═══════════════════════════════════════════════════════
// INSTRUCCIONES DE CONFIGURACIÓN:
// 1. Ve a script.google.com → Nuevo proyecto
// 2. Pega este código completo (reemplaza lo que hay)
// 3. Cambia SHEET_ID por el ID de tu Google Sheet
//    (el ID está en la URL: docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit)
// 4. Clic en "Implementar" → "Nueva implementación"
//    - Tipo: Aplicación web
//    - Ejecutar como: Yo
//    - Quién tiene acceso: Cualquier persona
// 5. Copia la URL que te da → pégala en cotizacion.html (SCRIPT_URL)
// ═══════════════════════════════════════════════════════

const SHEET_ID   = 'TU_SHEET_ID_AQUI'; // ← Cambia esto
const SHEET_NAME = 'Solicitudes';

// Columnas del Sheet
const COLS = {
  id:1, fecha:2, propNum:3, comercial:4, cliente:5, atencion:6,
  origen:7, destino:8, carga:9, unidad:10, semirremolque:11,
  cantidad:12, peso:13, largo:14, ancho:15, alto:16, fechaCarga:17,
  permisos:18, estiba:19, escolta:20, adicionales:21,
  costoUnit:22, monedaOps:23, sobreestadia:24, transitoDias:25, notasOps:26,
  precioUnit:27, monedaPrecio:28, credito:29, validez:30, notasDuena:31,
  estado:32
};
const TOTAL_COLS = 32;

// ── Encabezados del Sheet (se crean automáticamente) ──
const HEADERS = [
  'ID','Fecha','N° Propuesta','Comercial','Cliente','Atención',
  'Origen','Destino','Carga','Unidad','Semiremolque',
  'Cantidad','Peso (TN)','Largo','Ancho','Alto','Fecha de Carga',
  'Permisos','Estiba','Escolta','Adicionales',
  'Costo/Unidad','Moneda Ops','Sobreestadía','Tránsito (días)','Notas Ops',
  'Precio/Unidad','Moneda Precio','Crédito','Validez','Notas Dueña',
  'Estado'
];

function getSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setBackground('#1A365D').setFontColor('#FFFFFF').setFontWeight('bold');
  }
  return sheet;
}

function doGet(e) {
  try {
    const action = e.parameter.action || 'listar';
    const sheet  = getSheet();
    const data   = sheet.getDataRange().getValues();

    if (action === 'listar') {
      const estado = e.parameter.estado || '';
      const rows = data.slice(1)
        .filter(r => r[COLS.id-1] && (!estado || r[COLS.estado-1] === estado))
        .map(rowToObj)
        .reverse(); // más reciente primero
      return jsonResponse({ ok: true, data: rows });
    }

    if (action === 'obtener') {
      const id = e.parameter.id;
      const row = data.slice(1).find(r => String(r[COLS.id-1]) === String(id));
      if (!row) return jsonResponse({ ok: false, error: 'No encontrado' });
      return jsonResponse({ ok: true, data: rowToObj(row) });
    }

  } catch(err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    const body   = JSON.parse(e.postData.contents || '{}');
    const action = body.action;
    const sheet  = getSheet();

    if (action === 'crear') {
      const id = Date.now().toString();
      const row = new Array(TOTAL_COLS).fill('');
      row[COLS.id-1]           = id;
      row[COLS.fecha-1]        = new Date().toLocaleString('es-PE', {timeZone:'America/Lima'});
      row[COLS.propNum-1]      = body.propNum     || '';
      row[COLS.comercial-1]    = body.comercial   || '';
      row[COLS.cliente-1]      = body.cliente     || '';
      row[COLS.atencion-1]     = body.atencion    || '';
      row[COLS.origen-1]       = body.origen      || '';
      row[COLS.destino-1]      = body.destino     || '';
      row[COLS.carga-1]        = body.carga       || '';
      row[COLS.unidad-1]       = body.unidad      || '';
      row[COLS.semirremolque-1]= body.semirremolque || '';
      row[COLS.cantidad-1]     = body.cantidad    || '';
      row[COLS.peso-1]         = body.peso        || '';
      row[COLS.largo-1]        = body.largo       || '';
      row[COLS.ancho-1]        = body.ancho       || '';
      row[COLS.alto-1]         = body.alto        || '';
      row[COLS.fechaCarga-1]   = body.fechaCarga  || '';
      row[COLS.permisos-1]     = body.permisos    || '';
      row[COLS.estiba-1]       = body.estiba      || 'NO';
      row[COLS.escolta-1]      = body.escolta     || 'NO';
      row[COLS.adicionales-1]  = body.adicionales || '';
      row[COLS.estado-1]       = 'pendiente_costo';
      sheet.appendRow(row);
      return jsonResponse({ ok: true, id: id });
    }

    if (action === 'actualizar') {
      const id      = String(body.id);
      const updates = body.updates || {};
      const data    = sheet.getDataRange().getValues();
      const rowIdx  = data.findIndex((r, i) => i > 0 && String(r[COLS.id-1]) === id);
      if (rowIdx < 0) return jsonResponse({ ok: false, error: 'No encontrado' });

      const sheetRow = rowIdx + 1;
      Object.entries(updates).forEach(([key, val]) => {
        if (COLS[key]) sheet.getRange(sheetRow, COLS[key]).setValue(val);
      });
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: 'Acción no reconocida' });

  } catch(err) {
    return jsonResponse({ ok: false, error: err.toString() });
  }
}

function rowToObj(row) {
  const obj = {};
  Object.entries(COLS).forEach(([key, col]) => { obj[key] = row[col-1] ?? ''; });
  return obj;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
