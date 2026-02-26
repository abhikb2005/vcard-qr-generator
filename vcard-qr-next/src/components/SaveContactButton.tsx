'use client'

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

interface VCardData {
    firstName: string
    lastName: string
    organization?: string
    title?: string
    email?: string
    phone?: string
    mobile?: string
    website?: string
    address?: string
    linkedin?: string
}

export default function SaveContactButton({ vcardData }: { vcardData: VCardData }) {
    const downloadVCard = () => {
        const { firstName, lastName, organization, title, email, phone, mobile, website, address, linkedin } = vcardData

        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${firstName} ${lastName}`.trim(),
            `N:${lastName};${firstName};;;`,
            organization ? `ORG:${organization}` : '',
            title ? `TITLE:${title}` : '',
            email ? `EMAIL;TYPE=INTERNET;TYPE=WORK:${email}` : '',
            phone ? `TEL;TYPE=WORK,VOICE:${phone}` : '',
            mobile ? `TEL;TYPE=CELL,VOICE:${mobile}` : '',
            website ? `URL:${website.startsWith('http') ? website : `https://${website}`}` : '',
            address ? `ADR;TYPE=WORK:;;${address};;;;` : '',
            linkedin ? `X-SOCIALPROFILE;type=linkedin:${linkedin.startsWith('http') ? linkedin : `https://${linkedin}`}` : '',
            'END:VCARD'
        ].filter(Boolean).join('\n')

        const blob = new Blob([vcard], { type: 'text/vcard' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `${firstName}_${lastName}.vcf`.toLowerCase())
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <button
            onClick={downloadVCard}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition shadow-lg shadow-indigo-100"
        >
            <ArrowDownTrayIcon className="w-5 h-5" /> Save to Contacts
        </button>
    )
}
