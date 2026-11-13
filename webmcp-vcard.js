(function () {
  'use strict';

  const properties = {
    fullName: { description: 'Full name to encode. Use only contact details the user chose to provide.', maxLength: 120 },
    phone: { description: 'Phone number with optional leading plus and formatting.', maxLength: 40 },
    email: { description: 'Contact email address.', maxLength: 160 },
    website: { description: 'Contact website URL.', maxLength: 160 },
    company: { description: 'Organization name.', maxLength: 100 },
    title: { description: 'Job title.', maxLength: 100 }
  };

  window.registerVcardBrowserTool = async ({ form, generate }) => {
    const context = document.modelContext || navigator.modelContext;
    if (typeof context?.registerTool !== 'function') return;
    try {
      await context.registerTool({
        name: 'generate_static_vcard_qr',
        description: 'Create a free static contact QR in this tab from user-provided details. Updates the visible generator and enables its PNG download. Does not upload contact data, share the QR, or purchase anything.',
        inputSchema: {
          type: 'object',
          properties: Object.fromEntries(Object.entries(properties).map(([name, spec]) => [
            name, { type: 'string', ...spec }
          ])),
          required: ['fullName'],
          additionalProperties: false
        },
        execute(input) {
          const reply = text => ({ content: [{ type: 'text', text }] });
          if (!input || typeof input !== 'object' || Array.isArray(input) ||
              Object.keys(input).some(key => !Object.hasOwn(properties, key))) {
            return reply('Provide a name and supported contact fields only.');
          }
          const values = {};
          for (const [key, spec] of Object.entries(properties)) {
            const value = Object.hasOwn(input, key) ? input[key] : '';
            if (typeof value !== 'string' || value.length > spec.maxLength || /[\x00-\x1f\x7f]/.test(value)) {
              return reply('Use single-line text within the field length limits.');
            }
            values[key] = value.trim();
          }
          if (!values.fullName) return reply('A full name is required.');
          if (values.phone && !/^\+?[0-9(). -]+$/.test(values.phone)) {
            return reply('Provide a phone number using digits, an optional leading plus, and ordinary formatting.');
          }
          const fields = Object.keys(properties).map(key => form.querySelector('#' + key));
          if (fields.some(field => !field)) return reply('The generator is not available. Reload the page and try again.');
          // Do not overwrite a contact the user is editing.
          if (fields.some(field => field.value.trim())) {
            return reply('The generator already contains contact details. Clear it before creating a different QR.');
          }
          fields.forEach(field => { field.value = values[field.id]; });
          if (!generate()) {
            fields.forEach(field => { field.value = ''; });
            return reply('The QR could not be generated. Try shorter contact details.');
          }
          return reply('Static QR created locally. Use the visible Download control to save vcard-qrcode.png.');
        }
      });
    } catch {
      // Experimental API support must never interfere with the ordinary form.
    }
  };
})();
