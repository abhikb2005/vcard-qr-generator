# Bulk vCard QR workflow

Use the [bulk QR generator](https://www.vcardqrcodegenerator.com/bulk-qr-code.html) for a contact CSV. The browser reads and maps the file locally. The public API does not accept a contact batch or provide an image or ZIP download.

## Try a local preview

1. Save this synthetic example as a UTF-8 CSV:

   ```csv
   Full Name,Email
   Synthetic Alpha,alpha@example.com
   Synthetic Beta,beta@example.com
   ```

2. Open the bulk generator and select the CSV. Check the displayed row count. Map **Full Name** and **Email** to the matching columns. Full Name is required; optional fields include phone, company, job title, and website.
3. Generate the preview. It shows the first row's QR, not an exported batch. Review the selected row and mappings before proceeding.
4. ZIP export requires a paid plan. Review the current limits and price on the page. Only proceed to checkout after the buyer approves. After returning from checkout, reselect the same CSV because it was not uploaded or saved. If using a branded plan, select the logo again. Then use the enabled ZIP download control.

Use the buyer's billing details at checkout, not an entry from the contact CSV.

## What the public job endpoint does

```sh
curl -i https://vcardqrcodegenerator.com/api/v1/jobs/vcard \
  -H 'Content-Type: application/json' \
  --data '{"fullName":"Synthetic Alpha","email":"alpha@example.com"}'
```

The response is HTTP 202 with status `succeeded` and a single `result.vcard` and `result.qrPayload`. Read the payload from that response. A GET to its `Location` returns a status envelope with `result: null`; it is not a result store or download URL. A request containing only a contacts array is rejected. Use synthetic data when testing the public API; unlike the browser CSV preview, a POST transmits its input to the server.

See the [OpenAPI description](https://www.vcardqrcodegenerator.com/openapi.json) and [developer portal](https://www.vcardqrcodegenerator.com/developers/).
