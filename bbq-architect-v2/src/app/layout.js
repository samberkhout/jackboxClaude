import './globals.css';
import Script from 'next/script';
import Sidebar from '@/components/Sidebar';
import ToastProvider from '@/components/Toast';
import ConfirmProvider from '@/components/ConfirmDialog';

export const metadata = {
  title: 'BBQ Architect — Hop & Bites',
  description: 'Beheer je BBQ catering events, recepten, facturen en meer.',
};

export default function RootLayout({ children }) {
    return (
        <html lang="nl">
            <head>
                {/* PWA */}
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#FFBF00" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="BBQ Architect" />
                <link rel="apple-touch-icon" href="/logo.png" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

                {/* Icons & PDF libs */}
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
                <Script src="https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js" strategy="beforeInteractive" />
                <Script src="https://cdn.jsdelivr.net/npm/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.min.js" strategy="beforeInteractive" />
            </head>
            <body>
                <ToastProvider>
                    <ConfirmProvider>
                        <div className="app-layout">
                            <Sidebar />
                            <main className="main-area">
                                <div className="main-content">
                                    {children}
                                </div>
                            </main>
                        </div>
                    </ConfirmProvider>
                </ToastProvider>

                {/* Service Worker registratie */}
                <Script id="sw-register" strategy="afterInteractive">{`
                    if ('serviceWorker' in navigator) {
                        window.addEventListener('load', function() {
                            navigator.serviceWorker.register('/sw.js')
                                .then(function(reg) { console.log('[SW] Geregistreerd:', reg.scope); })
                                .catch(function(err) { console.warn('[SW] Fout:', err); });
                        });
                    }
                    window.__VAPID_PUBLIC_KEY__ = '${process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''}';
                `}</Script>
            </body>
        </html>
    );
}
