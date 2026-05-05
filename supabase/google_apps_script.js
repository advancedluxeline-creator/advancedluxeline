// ================================================================
// Crystal View Guest House — Google Apps Script
// Paste this ENTIRE script into your Google Apps Script editor,
// then Deploy → New Deployment → Web App → Anyone → Deploy
// ================================================================

function doGet(e) {
  e = e || { parameter: {} };
  var action = e.parameter.action || 'read';
  var tab    = e.parameter.tab    || 'rooms';

  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(tab) || ss.insertSheet(tab);

  // ---- READ ----
  if (action === 'read') {
    if (sheet.getLastRow() < 1) return out('[]');
    var rows    = sheet.getDataRange().getValues();
    var headers = rows.shift();
    var data    = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { obj[h] = row[i]; });
      return obj;
    });
    return out(JSON.stringify(data));
  }

  // ---- ADD ----
  if (action === 'add') {
    var data = JSON.parse(e.parameter.data);
    if (!data.id) data.id = new Date().getTime().toString();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(Object.keys(data));
    }
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    sheet.appendRow(headers.map(function(h) { return data[h] !== undefined ? data[h] : ''; }));
    return out('{"ok":true}');
  }

  // ---- UPDATE ----
  if (action === 'update') {
    var data = JSON.parse(e.parameter.data);
    var all  = sheet.getDataRange().getValues();
    var hdrs = all[0];
    var idIdx = hdrs.indexOf('id');
    for (var i = 1; i < all.length; i++) {
      if (String(all[i][idIdx]) === String(data.id)) {
        var newRow = hdrs.map(function(h) {
          return data[h] !== undefined ? data[h] : all[i][hdrs.indexOf(h)];
        });
        sheet.getRange(i + 1, 1, 1, hdrs.length).setValues([newRow]);
        break;
      }
    }
    return out('{"ok":true}');
  }

  // ---- DELETE ----
  if (action === 'delete') {
    var id    = e.parameter.id;
    var all   = sheet.getDataRange().getValues();
    var hdrs  = all[0];
    var idIdx = hdrs.indexOf('id');
    for (var i = 1; i < all.length; i++) {
      if (String(all[i][idIdx]) === String(id)) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    return out('{"ok":true}');
  }

  // ---- UPSERT (for settings key/value pairs) ----
  if (action === 'upsert') {
    var data = JSON.parse(e.parameter.data);
    var key  = data.key;
    var val  = data.value;
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['key', 'value']);
    }
    var all   = sheet.getDataRange().getValues();
    var hdrs  = all[0];
    var keyIdx = hdrs.indexOf('key');
    var valIdx = hdrs.indexOf('value');
    var found = false;
    for (var i = 1; i < all.length; i++) {
      if (all[i][keyIdx] === key) {
        sheet.getRange(i + 1, valIdx + 1).setValue(val);
        found = true;
        break;
      }
    }
    if (!found) {
      sheet.appendRow([key, val]);
    }
    return out('{"ok":true}');
  }

  return out('{"error":"unknown action"}');
}

function out(data) {
  return ContentService
    .createTextOutput(data)
    .setMimeType(ContentService.MimeType.JSON);
}
