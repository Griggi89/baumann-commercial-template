import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Baumann Property | Investment Analysis Dashboard',
  description: 'Data-Driven Property Investment Analysis — Baumann Property Buyer\'s Agency',
  keywords: 'property investment, real estate analysis, Australian property, buyer\'s agency',
  icons: {
    icon: 'https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/69800ddd908591cf3f9ec1ac_bp%20webclip.png',
    shortcut: 'https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/69800ddd908591cf3f9ec1ac_bp%20webclip.png',
    apple: 'https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/69800ddd908591cf3f9ec1ac_bp%20webclip.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Sync script: runs before DOM renders, adds 'mob' class to <html> on mobile.
            Sidebar starts closed — user opens via hamburger menu. */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(window.innerWidth<768){document.documentElement.classList.add('mob');}}catch(e){}})();` }} />
        <link rel="icon" href="https://cdn.prod.website-files.com/686ccd753cf9e1d8ecb2fb4a/69800ddd908591cf3f9ec1ac_bp%20webclip.png" type="image/png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}
