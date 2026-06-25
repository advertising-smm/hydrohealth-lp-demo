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
- [ ] Open Chrome console and inspect `window.dataLayer`.
- [ ] Confirm `window.dataLayer` is not undefined after page load.
- [ ] Confirm `page_view` appears in `window.dataLayer` after page load.
- [ ] Confirm dataLayer events fire for page view, form start, form submit, LINE click, CTA click, FAQ expand, scroll depth, PDPA consent, and Google Sheets sync.
- [ ] Confirm no `name`, `phone`, or `line_id` appears in `window.dataLayer`.
- [ ] Confirm dataLayer events contain no PII such as name, phone, LINE ID, or email.
- [ ] Confirm dataLayer events contain no sensitive health details such as symptoms, disease, medication, dosage, BMI, weight, or health condition details.
- [ ] Confirm `form_submit` still saves locally and enters Google Sheet when the endpoint is connected.
