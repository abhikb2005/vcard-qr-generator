# vCard QR Code Generator API

The public API supports agent and developer workflows for vCard QR payload generation and product discovery.

## Endpoints

- `GET https://vcardqrcodegenerator.com/api/v1/health`
- `GET https://vcardqrcodegenerator.com/api/v1/product`
- `GET https://vcardqrcodegenerator.com/api/v1/templates`
- `POST https://vcardqrcodegenerator.com/api/v1/vcard`
- `POST https://vcardqrcodegenerator.com/api/v1/jobs/vcard`
- `GET https://vcardqrcodegenerator.com/api/v1/stream`

## Machine-Readable Specs

- OpenAPI: https://www.vcardqrcodegenerator.com/openapi.json
- Developer portal: https://www.vcardqrcodegenerator.com/developers/

## Error And Retry Contract

API errors are structured JSON with `error.code`, `error.message`, `error.hint`, `error.docsUrl`, and `error.status`. Mutation-style endpoints accept `Idempotency-Key`. Responses include `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`.
