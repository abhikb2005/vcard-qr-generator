# vCard QR Code Generator Auth

The public vCard QR Code Generator API does not require authentication for basic product discovery, template listing, or vCard payload generation.

## Public Access

- Auth type: none for public endpoints
- OpenAPI: https://www.vcardqrcodegenerator.com/openapi.json
- Developer auth docs: https://www.vcardqrcodegenerator.com/developers/auth.html
- MCP endpoint: https://vcardqrcodegenerator.com/mcp
- OAuth discovery metadata: not required for the public API because public discovery, template listing, and vCard payload generation are unauthenticated.
- Future authenticated app actions should live on https://app.vcardqrcodegenerator.com and require explicit user authorization before agents modify user-owned dynamic QR resources.

## Walkthrough

1. Check `GET https://vcardqrcodegenerator.com/api/v1/health`.
2. Read the available templates with `GET https://vcardqrcodegenerator.com/api/v1/templates`.
3. Send a sample JSON body to `POST https://vcardqrcodegenerator.com/api/v1/vcard`.
4. Retry safely with an `Idempotency-Key` header when an agent repeats a request.
5. If a request fails, parse the JSON `error.code`, `error.message`, `error.hint`, `error.docsUrl`, and `error.status` fields.

## Agent Guidance

Do not send sensitive contact data unless the user explicitly asks you to create a vCard payload. The browser generator can create static QR codes locally so contact data can remain on the user's device.
