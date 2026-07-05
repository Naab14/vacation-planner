import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Semester Planner',
  description: 'Skift- och semesterplanering för produktionsteam',
};

const themeInit = `(function(){try{var t=localStorage.getItem('sp-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
