const SPREADSHEET_ID = '1zndIOcGsIMkMdUyTzjkIse0n7gTwVqGemmdJLDaz2bY';
const SHEET_NAME = 'Estimator Leads';

function doPost(event) {
  try {
    const payload = JSON.parse(event?.postData?.contents || '{}');

    // Allows a deployment health check without creating a lead.
    if (payload.test === true) {
      return jsonResponse({ success: true, test: true });
    }

    if (!payload.email) {
      throw new Error('Email is required');
    }

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet not found: ${SHEET_NAME}`);
    }

    const submittedAt = payload.submittedAt ? new Date(payload.submittedAt) : new Date();
    const leadId = `EST-${Utilities.formatDate(submittedAt, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss')}`;
    const row = [
      submittedAt,
      payload.status || 'New',
      payload.leadType || (payload.companyName ? 'Commercial / Builder' : 'Residential'),
      payload.firstName || '',
      payload.lastName || '',
      payload.companyName || '',
      payload.email || '',
      payload.phone || '',
      numberOrBlank(payload.estimateLow),
      numberOrBlank(payload.estimateHigh),
      payload.projectType || '',
      payload.kitchenSize || '',
      payload.designStyle || '',
      payload.doorStyle || '',
      payload.boxMaterial || '',
      payload.finish || '',
      payload.hardware || '',
      payload.flooring || '',
      payload.notes || '',
      payload.source || 'Estimator',
      '',
      '',
      '',
      'Open',
      leadId
    ];

    const templateLeadId = sheet.getRange('Y4').getValue();
    if (templateLeadId === 'TEMPLATE') {
      sheet.getRange(4, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    SpreadsheetApp.flush();
    return jsonResponse({ success: true, leadId });
  } catch (error) {
    console.error(error);
    return jsonResponse({ success: false, error: String(error.message || error) });
  }
}

function numberOrBlank(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : '';
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
