import { getQRCodeByShortCode } from '@/data/dummy';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    UserIcon,
    PhoneIcon,
    EnvelopeIcon,
    GlobeAltIcon,
    MapPinIcon
} from '@heroicons/react/24/outline';
import SaveContactButton from '@/components/SaveContactButton';

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    let qr;

    if (id === 'demo') {
        qr = {
            vcard_data: {
                firstName: 'John',
                lastName: 'Doe',
                phone: '+1 (555) 000-0000',
                email: 'john.doe@example.com',
                website: 'https://vcardqrcodegenerator.com',
                organization: 'vCard QR Pro',
                title: 'Professional Networker',
                address: '123 Networking Way, Silicon Valley, CA',
                linkedin: 'https://linkedin.com/in/johndoe'
            }
        };
    } else {
        qr = await getQRCodeByShortCode(id);
    }

    if (!qr || !qr.vcard_data) {
        notFound();
    }

    const { firstName, lastName, phone, email, website, organization, title, address, linkedin } = qr.vcard_data;
    const fullName = `${firstName} ${lastName}`.trim();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <main className="flex-grow flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    {/* Header/Banner */}
                    <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white">
                                <UserIcon className="w-12 h-12 text-indigo-600" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-900">{fullName || 'Digital Card'}</h1>
                        {title && <p className="text-indigo-600 font-medium">{title}</p>}
                        {organization && <p className="text-gray-500 text-sm mt-1">{organization}</p>}

                        <div className="mt-8 space-y-4 text-left">
                            {phone && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 transition">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                        <PhoneIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Mobile</p>
                                        <a href={`tel:${phone}`} className="text-gray-900 font-medium hover:text-indigo-600">{phone}</a>
                                    </div>
                                </div>
                            )}

                            {email && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 transition">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                        <EnvelopeIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Email</p>
                                        <a href={`mailto:${email}`} className="text-gray-900 font-medium hover:text-indigo-600">{email}</a>
                                    </div>
                                </div>
                            )}

                            {website && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 transition">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                        <GlobeAltIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Website</p>
                                        <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" className="text-gray-900 font-medium hover:text-indigo-600">{website}</a>
                                    </div>
                                </div>
                            )}

                            {linkedin && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 transition">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">LinkedIn</p>
                                        <a href={linkedin.startsWith('http') ? linkedin : `https://${linkedin}`} target="_blank" className="text-gray-900 font-medium hover:text-indigo-600">View Profile</a>
                                    </div>
                                </div>
                            )}

                            {address && (
                                <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 border border-transparent hover:border-indigo-100 transition">
                                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm text-gray-400">
                                        <MapPinIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Office</p>
                                        <span className="text-gray-900 font-medium">{address}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-10">
                            <SaveContactButton vcardData={qr.vcard_data} />
                            <p className="text-xs text-gray-400 mt-4">
                                Created with vCard QR Pro • Privacy First
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
