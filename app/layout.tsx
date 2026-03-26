import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Prompt Chain Tool',
  description: 'Manage humor flavors and caption pipelines',
}

const themeBootScript = `
(() => {
  const KEY = 'theme-preference';
  const stored = localStorage.getItem(KEY);
  const pref = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  const root = document.documentElement;
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolved = pref === 'system' ? (systemDark ? 'dark' : 'light') : pref;
  root.classList.remove('theme-light', 'theme-dark');
  root.classList.add(resolved === 'dark' ? 'theme-dark' : 'theme-light');
  root.dataset.themePreference = pref;
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {children}
      </body>
    </html>
  )
}
