import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/globals.css";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Editable Dynamic QR Codes — Print Once, Update Anytime",
  description:
    "Create editable dynamic QR codes for events, cards, and signs. Update the destination after printing and see scan activity from one dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1206702185649949"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Consent Mode / Banner */}
        <Script src="/consent.js" strategy="beforeInteractive" />
        {/* GTM / GA4 */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-E90B41BNEH"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-E90B41BNEH', {
              linker: {
                domains: ['www.vcardqrcodegenerator.com'],
                accept_incoming: true
              }
            });
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
