# vCard QR Code Generator Auth

The public vCard QR Code Generator API does not require authentication for basic product discovery, template listing, or vCard payload generation.

## Public Access

- Auth type: none for public endpoints
- OpenAPI: https://www.vcardqrcodegenerator.com/openapi.json
- Developer auth docs: https://www.vcardqrcodegenerator.com/developers/auth.html
- MCP endpoint: https://vcardqrcodegenerator.com/mcp

## Agent Guidance

Do not send sensitive contact data unless the user explicitly asks you to create a vCard payload. The browser generator can create static QR codes locally so contact data can remain on the user's device.
