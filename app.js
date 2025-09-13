// vCard QR Code Generator Application
class VCardQRGenerator {
    constructor() {
        this.qrCodeInstance = null;
        this.debounceTimer = null;
        this.currentVCardData = '';
        
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        this.initializeElements();
        this.bindEvents();
        this.loadSavedData();
        console.log('vCard QR Generator initialized');
    }

    initializeElements() {
        // Form elements
        this.form = document.getElementById('contactForm');
        this.formFields = {
            fullName: document.getElementById('fullName'),
            organization: document.getElementById('organization'),
            title: document.getElementById('title'),
            workPhone: document.getElementById('workPhone'),
            mobilePhone: document.getElementById('mobilePhone'),
            homePhone: document.getElementById('homePhone'),
            workEmail: document.getElementById('workEmail'),
            personalEmail: document.getElementById('personalEmail'),
            website: document.getElementById('website'),
            street: document.getElementById('street'),
            city: document.getElementById('city'),
            state: document.getElementById('state'),
            zip: document.getElementById('zip'),
            country: document.getElementById('country'),
            note: document.getElementById('note')
        };

        // QR Code elements
        this.qrCanvas = document.getElementById('qrCanvas');
        this.qrPlaceholder = document.getElementById('qrPlaceholder');
        this.qrSize = document.getElementById('qrSize');
        this.foregroundColor = document.getElementById('foregroundColor');
        this.backgroundColor = document.getElementById('backgroundColor');

        // Control elements
        this.generateBtn = document.getElementById('generateBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyVcardBtn = document.getElementById('copyVcardBtn');
        this.fillSampleBtn = document.getElementById('fillSampleBtn');
        this.clearFormBtn = document.getElementById('clearFormBtn');
        this.vcardPreview = document.getElementById('vcardPreview');
        this.successToast = document.getElementById('successToast');

        // Verify elements exist
        const missingElements = [];
        Object.entries(this.formFields).forEach(([key, element]) => {
            if (!element) missingElements.push(key);
        });
        
        if (missingElements.length > 0) {
            console.error('Missing form elements:', missingElements);
        }
    }

    bindEvents() {
        // Form input events with real-time updates
        Object.values(this.formFields).forEach(field => {
            if (field) {
                // Use both input and keyup for better responsiveness
                field.addEventListener('input', (e) => {
                    console.log(`Input change: ${field.id} = ${field.value}`);
                    this.handleInputChange();
                });
                field.addEventListener('blur', () => this.validateField(field));
            }
        });

        // QR customization events
        if (this.qrSize) {
            this.qrSize.addEventListener('change', () => {
                console.log('QR size changed to:', this.qrSize.value);
                this.generateQRCode();
            });
        }
        if (this.foregroundColor) {
            this.foregroundColor.addEventListener('change', () => this.generateQRCode());
        }
        if (this.backgroundColor) {
            this.backgroundColor.addEventListener('change', () => this.generateQRCode());
        }

        // Button events
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => this.downloadQRCode());
        }
        if (this.copyVcardBtn) {
            this.copyVcardBtn.addEventListener('click', () => this.copyVCardToClipboard());
        }
        if (this.fillSampleBtn) {
            this.fillSampleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Fill sample data clicked');
                this.fillSampleData();
            });
        }
        if (this.clearFormBtn) {
            this.clearFormBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearForm();
            });
        }

        // Auto-save on input
        Object.values(this.formFields).forEach(field => {
            if (field) {
                field.addEventListener('input', () => this.autoSave());
            }
        });
    }

    handleInputChange() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            console.log('Processing input change...');
            this.generateVCardData();
            this.generateQRCode();
            this.updateExportButtons();
        }, 300);
    }

    handleFormSubmit(e) {
        e.preventDefault();
        console.log('Form submitted');
        if (this.validateForm()) {
            this.generateVCardData();
            this.generateQRCode();
            this.updateExportButtons();
        }
    }

    validateForm() {
        let isValid = true;
        
        // Required field validation
        if (!this.formFields.fullName?.value?.trim()) {
            this.showFieldError('fullName', 'Full name is required');
            isValid = false;
        } else {
            this.clearFieldError('fullName');
        }

        // Email validation
        const emailFields = ['workEmail', 'personalEmail'];
        emailFields.forEach(fieldName => {
            const field = this.formFields[fieldName];
            if (field?.value && !this.isValidEmail(field.value)) {
                this.showFieldError(fieldName, 'Please enter a valid email address');
                isValid = false;
            } else {
                this.clearFieldError(fieldName);
            }
        });

        // Phone validation
        const phoneFields = ['workPhone', 'mobilePhone', 'homePhone'];
        phoneFields.forEach(fieldName => {
            const field = this.formFields[fieldName];
            if (field?.value && !this.isValidPhone(field.value)) {
                this.showFieldError(fieldName, 'Please enter a valid phone number');
                isValid = false;
            } else {
                this.clearFieldError(fieldName);
            }
        });

        // URL validation
        if (this.formFields.website?.value && !this.isValidURL(this.formFields.website.value)) {
            this.showFieldError('website', 'Please enter a valid URL');
            isValid = false;
        } else {
            this.clearFieldError('website');
        }

        return isValid;
    }

    validateField(field) {
        if (!field) return;
        
        const fieldName = field.id;
        const value = field.value.trim();

        if (fieldName === 'fullName' && !value) {
            this.showFieldError(fieldName, 'Full name is required');
        } else if (fieldName.includes('Email') && value && !this.isValidEmail(value)) {
            this.showFieldError(fieldName, 'Please enter a valid email address');
        } else if (fieldName.includes('Phone') && value && !this.isValidPhone(value)) {
            this.showFieldError(fieldName, 'Please enter a valid phone number');
        } else if (fieldName === 'website' && value && !this.isValidURL(value)) {
            this.showFieldError(fieldName, 'Please enter a valid URL');
        } else {
            this.clearFieldError(fieldName);
        }
    }

    showFieldError(fieldName, message) {
        const field = this.formFields[fieldName];
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (field) {
            field.classList.add('invalid');
            field.classList.remove('valid');
        }
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    clearFieldError(fieldName) {
        const field = this.formFields[fieldName];
        const errorElement = document.getElementById(fieldName + 'Error');
        
        if (field) {
            field.classList.remove('invalid');
            if (field.value.trim()) {
                field.classList.add('valid');
            }
        }
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidPhone(phone) {
        return /^[\+]?[\d\s\-\(\)]{10,}$/.test(phone);
    }

    isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    generateVCardData() {
        const fields = this.formFields;
        let vcard = 'BEGIN:VCARD\n';
        vcard += 'VERSION:3.0\n';

        // Full Name (required)
        if (fields.fullName?.value) {
            vcard += `FN:${fields.fullName.value}\n`;
            // Parse name for N field
            const nameParts = fields.fullName.value.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
            const middleNames = nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '';
            vcard += `N:${lastName};${firstName};${middleNames};;\n`;
        }

        // Organization and Title
        if (fields.organization?.value) {
            vcard += `ORG:${fields.organization.value}\n`;
        }
        if (fields.title?.value) {
            vcard += `TITLE:${fields.title.value}\n`;
        }

        // Phone numbers
        if (fields.workPhone?.value) {
            vcard += `TEL;TYPE=WORK:${fields.workPhone.value}\n`;
        }
        if (fields.mobilePhone?.value) {
            vcard += `TEL;TYPE=CELL:${fields.mobilePhone.value}\n`;
        }
        if (fields.homePhone?.value) {
            vcard += `TEL;TYPE=HOME:${fields.homePhone.value}\n`;
        }

        // Email addresses
        if (fields.workEmail?.value) {
            vcard += `EMAIL;TYPE=WORK:${fields.workEmail.value}\n`;
        }
        if (fields.personalEmail?.value) {
            vcard += `EMAIL;TYPE=HOME:${fields.personalEmail.value}\n`;
        }

        // Website
        if (fields.website?.value) {
            vcard += `URL:${fields.website.value}\n`;
        }

        // Address
        const addressParts = [
            fields.street?.value || '',
            fields.city?.value || '',
            fields.state?.value || '',
            fields.zip?.value || '',
            fields.country?.value || ''
        ];
        
        if (addressParts.some(part => part.trim())) {
            vcard += `ADR;TYPE=HOME:;;${addressParts.join(';')}\n`;
        }

        // Note
        if (fields.note?.value) {
            vcard += `NOTE:${fields.note.value}\n`;
        }

        vcard += 'END:VCARD';

        this.currentVCardData = vcard;
        if (this.vcardPreview) {
            this.vcardPreview.textContent = vcard;
        }
        
        console.log('Generated vCard:', vcard);
        return vcard;
    }

    generateQRCode() {
        if (!window.QRCode) {
            console.error('QRCode library not loaded');
            this.showToast('QR Code library not loaded', 'error');
            return;
        }

        if (!this.currentVCardData || !this.formFields.fullName?.value) {
            console.log('No data to generate QR code');
            this.showQRPlaceholder();
            return;
        }

        const size = parseInt(this.qrSize?.value || '256');
        const options = {
            width: size,
            height: size,
            color: {
                dark: this.foregroundColor?.value || '#000000',
                light: this.backgroundColor?.value || '#ffffff'
            },
            errorCorrectionLevel: 'M'
        };

        console.log('Generating QR code with options:', options);

        // Clear existing QR code
        if (this.qrCanvas) {
            this.qrCanvas.style.display = 'block';
        }
        if (this.qrPlaceholder) {
            this.qrPlaceholder.style.display = 'none';
        }

        QRCode.toCanvas(this.qrCanvas, this.currentVCardData, options, (error) => {
            if (error) {
                console.error('QR Code generation failed:', error);
                this.showToast('Failed to generate QR code', 'error');
                this.showQRPlaceholder();
            } else {
                console.log('QR Code generated successfully');
            }
        });
    }

    showQRPlaceholder() {
        if (this.qrCanvas) {
            this.qrCanvas.style.display = 'none';
        }
        if (this.qrPlaceholder) {
            this.qrPlaceholder.style.display = 'block';
        }
    }

    updateExportButtons() {
        const hasData = this.currentVCardData && this.formFields.fullName?.value;
        if (this.downloadBtn) {
            this.downloadBtn.disabled = !hasData;
        }
        if (this.copyVcardBtn) {
            this.copyVcardBtn.disabled = !hasData;
        }
    }

    downloadQRCode() {
        if (!this.qrCanvas || this.qrCanvas.style.display === 'none') {
            this.showToast('No QR code to download', 'error');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `${this.formFields.fullName?.value || 'contact'}_qr_code.png`;
            link.href = this.qrCanvas.toDataURL();
            link.click();
            
            this.showToast('QR code downloaded successfully!');
        } catch (error) {
            console.error('Download failed:', error);
            this.showToast('Failed to download QR code', 'error');
        }
    }

    async copyVCardToClipboard() {
        if (!this.currentVCardData) {
            this.showToast('No vCard data to copy', 'error');
            return;
        }

        try {
            await navigator.clipboard.writeText(this.currentVCardData);
            this.showToast('vCard data copied to clipboard!');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.fallbackCopyToClipboard(this.currentVCardData);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            this.showToast('vCard data copied to clipboard!');
        } catch (error) {
            this.showToast('Failed to copy to clipboard', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    fillSampleData() {
        console.log('Filling sample data...');
        const sampleData = {
            fullName: 'John Doe',
            organization: 'Acme Corporation',
            title: 'Senior Software Engineer',
            workPhone: '+1-555-123-4567',
            mobilePhone: '+1-555-987-6543',
            workEmail: 'john.doe@acme.com',
            personalEmail: 'john@example.com',
            website: 'https://johndoe.dev',
            street: '123 Business Ave',
            city: 'San Francisco',
            state: 'CA',
            zip: '94105',
            country: 'USA',
            note: 'Feel free to contact me anytime!'
        };

        Object.keys(sampleData).forEach(key => {
            if (this.formFields[key]) {
                this.formFields[key].value = sampleData[key];
                this.clearFieldError(key);
                console.log(`Set ${key} to ${sampleData[key]}`);
            }
        });

        // Trigger update
        this.generateVCardData();
        this.generateQRCode();
        this.updateExportButtons();
        this.showToast('Sample data filled successfully!');
    }

    clearForm() {
        console.log('Clearing form...');
        if (this.form) {
            this.form.reset();
        }
        
        Object.keys(this.formFields).forEach(key => {
            if (this.formFields[key]) {
                this.formFields[key].value = '';
            }
            this.clearFieldError(key);
        });
        
        this.currentVCardData = '';
        if (this.vcardPreview) {
            this.vcardPreview.textContent = 'Fill out the form to see vCard data...';
        }
        this.showQRPlaceholder();
        this.updateExportButtons();
        this.clearSavedData();
        
        this.showToast('Form cleared successfully!');
    }

    autoSave() {
        try {
            const formData = {};
            Object.keys(this.formFields).forEach(key => {
                if (this.formFields[key]) {
                    formData[key] = this.formFields[key].value;
                }
            });
            localStorage.setItem('vcardFormData', JSON.stringify(formData));
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }

    loadSavedData() {
        try {
            const savedData = localStorage.getItem('vcardFormData');
            if (savedData) {
                const formData = JSON.parse(savedData);
                Object.keys(formData).forEach(key => {
                    if (this.formFields[key] && formData[key]) {
                        this.formFields[key].value = formData[key];
                    }
                });
                
                // Trigger initial generation if there's data
                if (formData.fullName) {
                    setTimeout(() => {
                        this.generateVCardData();
                        this.generateQRCode();
                        this.updateExportButtons();
                    }, 100);
                }
            }
        } catch (error) {
            console.error('Failed to load saved data:', error);
        }
    }

    clearSavedData() {
        try {
            localStorage.removeItem('vcardFormData');
        } catch (error) {
            console.error('Failed to clear saved data:', error);
        }
    }

    showToast(message, type = 'success') {
        if (!this.successToast) {
            console.log('Toast:', message);
            return;
        }

        const messageElement = this.successToast.querySelector('.toast-message');
        
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        this.successToast.className = `toast ${type}`;
        this.successToast.classList.add('show');
        
        setTimeout(() => {
            this.successToast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the application
new VCardQRGenerator();