# vCard QR Code Generator MCP: marketplace submission notes

- **Name:** vCard QR Code Generator
- **Description:** Create vCard contact text for QR encoding and find the right vCard QR generator workflow. The tool returns vCard text; use the website to render a QR image.
- **Endpoint:** https://vcardqrcodegenerator.com/mcp (Streamable HTTP, no login or API key)
- **Developer docs:** https://www.vcardqrcodegenerator.com/developers/
- **Privacy:** https://www.vcardqrcodegenerator.com/privacy-policy.html
- **Terms:** https://www.vcardqrcodegenerator.com/terms-of-service.html
- **Source:** https://github.com/abhikb2005/vcard-qr-generator
- **Canonical listing:** [Official MCP Registry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.abhikb2005%2Fvcard-qr-code-generator/versions/2026-05-21)

## Reviewer test

Connect to the endpoint, confirm that the only tools are `get_product_context` and `create_vcard_payload`, and call the first with no arguments. To test the second, ask for a vCard for Taylor Example with email taylor@example.com. Expect a vCard with the supplied name and email. Use fictional contact details for review. The server does not create hosted QR codes, read accounts, start checkouts, or render a QR image.

## Release status

The official Registry listing became active on 2026-11-14 at 11:59 UTC. The production endpoint passed initialization, discovery and both tool calls with synthetic input. The repository contains a portable Agent Plugins package for Cursor review. No marketplace submission or app-specific test is implied by those checks.

- Cursor: [publisher application](https://cursor.com/marketplace/publish); sign-in and review required.
- Claude: [marketplace](https://claude.com/marketplace/connectors-plugins); use the remote URL and reviewer test.
- ChatGPT: [submission requirements](https://developers.openai.com/plugins/deploy/submission); register and test the remote server in the verified publisher workspace before preparing the final submission ZIP.
- Grok Bot: [submission form](https://x.ai/bot/marketplace/submit-a-plugin); run the in-app test before attesting to it. The main Grok marketplace is shown as forthcoming in the form.
- Meta Muse: [submission portal](https://platform.muse.ai/login?return_to=/submission); publisher sign-in required.
- Google: [Connected Apps preview](https://developers.google.com/connected-apps/); confirm preview access and authentication requirements.
- Microsoft: [Partner Center process](https://learn.microsoft.com/en-us/microsoft-agent-365/developer/submit-agent-partner-center); requires a packaged agent.
- Salesforce: [AgentExchange packaging](https://help.salesforce.com/s/articleView?id=release-notes.rn_list_and_publish_mcp_servers_in_agentforce_extension_packages.htm&language=en_US&type=5); requires an Agentforce Extension Package.
- AWS: [AI agents and tools listing](https://docs.aws.amazon.com/marketplace/latest/userguide/listing-saas-ai-agents.html); requires seller onboarding and a SaaS product listing.
- Glama, PulseMCP, and MCP.Directory: check downstream discovery against the official Registry ID before considering any separate listing.
