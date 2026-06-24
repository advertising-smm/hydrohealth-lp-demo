# HydroHealth Google Sheets Lead Capture

This folder contains the Google Apps Script Web App used to receive lead submissions from the static landing page and append them to Google Sheets.

## Setup

1. Create a new Google Sheet.
2. Add the columns from `templates/lead-sheet-columns.csv` to row 1.
3. In the Google Sheet, open Extensions > Apps Script.
4. Paste the contents of `google-apps-script/Code.gs` into the Apps Script editor.
5. Copy the Google Sheet ID from the Sheet URL and set it in `SPREADSHEET_ID`.
6. Deploy the script as a Web App.
7. Set "Execute as" to yourself.
8. Set access to the intended public option for the landing page form.
9. Copy the Web App URL ending in `/exec`.
10. Paste that URL into `index.html` on the lead form:

```html
data-sheets-endpoint="YOUR_WEB_APP_URL"
```

Leave `data-sheets-endpoint=""` blank to keep the prototype in localStorage-only mode.

## Duplicate Protection

Apps Script checks the incoming `lead_id` before adding a row. The check and append run inside an Apps Script lock, so if the same payload is submitted again because the browser timed out or the user retries, the script returns `success: true` with `duplicate: true` and does not add another row.

## Test

1. Open `index.html`.
2. Submit the form with PDPA consent checked.
3. Confirm the page shows a success state.
4. Confirm a new row appears in the Google Sheet.
5. Open `dashboard.html` and confirm the localStorage dashboard still shows the local lead.
6. Submit the same Apps Script payload twice and confirm the second response includes `duplicate: true`.

## Privacy Scope

The payload is limited to contact, consent, source, and prototype tracking fields. Do not add sensitive health data, including BMI, disease information, symptoms, medication names, dosage, lab results, or treatment outcomes.

No Google credentials, private keys, or Sheet IDs should be placed in frontend code.
