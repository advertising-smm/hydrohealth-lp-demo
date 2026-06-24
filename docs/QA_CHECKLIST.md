# QA Checklist

- [ ] Form submit without PDPA consent shows an error and does not create a lead.
- [ ] Form submit with `data-sheets-endpoint=""` saves locally and shows the prototype success state.
- [ ] Form submit with a connected Apps Script endpoint saves locally and syncs to Google Sheets.
- [ ] Google Sheet row is created with the expected column order.
- [ ] UTM values are captured from the page URL.
- [ ] Success state appears after a successful connected submit.
- [ ] Error state appears if the Google Sheets endpoint is unavailable.
- [ ] No sensitive health data is sent, including BMI, disease information, symptoms, medication names, dosage, lab results, or treatment outcomes.
- [ ] `dashboard.html` still reads localStorage leads and events.
- [ ] Submit the same payload twice to Apps Script, confirm only one row is added, and confirm the second response returns `duplicate: true`.
