const SPREADSHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const SHEET_NAME = 'Leads';

const HEADERS = [
  'received_at',
  'lead_id',
  'created_at',
  'session_id',
  'name',
  'phone',
  'line_id',
  'preferred_channel',
  'interest',
  'preferred_time',
  'status',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'pdpa_consent',
  'consent_timestamp',
  'page_path',
  'user_agent',
  'source_system'
];

const ALLOWED_FIELDS = HEADERS.filter(function(header) {
  return header !== 'received_at';
});

const REQUIRED_FIELDS = [
  'lead_id',
  'created_at',
  'session_id',
  'name',
  'phone',
  'line_id',
  'pdpa_consent',
  'consent_timestamp'
];

function doGet() {
  return jsonResponse_({
    success: true,
    status: 'ok',
    service: 'hydrohealth-lead-capture'
  });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    validateLead_(payload);
    const result = appendLead_(payload);

    return jsonResponse_({
      success: true,
      lead_id: payload.lead_id,
      duplicate: result.duplicate,
      message: result.message,
      row: result.row
    });
  } catch (error) {
    return jsonResponse_({
      success: false,
      error: error.message || 'Unknown error'
    });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body.');
  }

  try {
    const payload = JSON.parse(e.postData.contents);
    if (!payload || Object.prototype.toString.call(payload) !== '[object Object]') {
      throw new Error('Payload must be a JSON object.');
    }
    return payload;
  } catch (error) {
    throw new Error('Invalid JSON request body.');
  }
}

function validateLead_(payload) {
  Object.keys(payload).forEach(function(key) {
    if (ALLOWED_FIELDS.indexOf(key) === -1) {
      throw new Error('Unexpected field: ' + key);
    }
  });

  REQUIRED_FIELDS.forEach(function(field) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw new Error('Missing required field: ' + field);
    }
  });

  if (payload.pdpa_consent !== true && payload.pdpa_consent !== 'true') {
    throw new Error('PDPA consent is required.');
  }
}

function appendLead_(payload) {
  if (!SPREADSHEET_ID || SPREADSHEET_ID === 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE') {
    throw new Error('Spreadsheet ID is not configured.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
    ensureHeaders_(sheet);

    const existingRow = findExistingLeadRow_(sheet, payload.lead_id);
    if (existingRow) {
      return {
        duplicate: true,
        message: 'Lead already recorded',
        row: existingRow
      };
    }

    const receivedAt = new Date().toISOString();
    const row = HEADERS.map(function(header) {
      if (header === 'received_at') return receivedAt;
      return safeCell_(payload[header]);
    });

    sheet.appendRow(row);
    return {
      duplicate: false,
      message: 'Lead recorded',
      row: sheet.getLastRow()
    };
  } finally {
    lock.releaseLock();
  }
}

function findExistingLeadRow_(sheet, leadId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const leadIdColumn = HEADERS.indexOf('lead_id') + 1;
  const values = sheet.getRange(2, leadIdColumn, lastRow - 1, 1).getValues();
  const needle = String(leadId);

  for (let index = 0; index < values.length; index++) {
    if (String(values[index][0]) === needle) {
      return index + 2;
    }
  }

  return null;
}

function ensureHeaders_(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  const current = range.getValues()[0];
  const hasHeaders = HEADERS.every(function(header, index) {
    return current[index] === header;
  });

  if (!hasHeaders) {
    range.setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function safeCell_(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value;

  const text = String(value);
  if (/^[=+\-@]/.test(text)) return "'" + text;
  return text;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
