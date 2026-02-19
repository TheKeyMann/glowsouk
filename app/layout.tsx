import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Glowsouk – Discover Beauty That Works For You',
    template: '%s | Glowsouk',
  },
  description:
    'Glowsouk is the community-driven beauty review platform for skincare, makeup, haircare, fragrance and bodycare. Find what works for your skin.',
  keywords: ['beauty reviews', 'skincare', 'makeup', 'UAE beauty', 'product reviews', 'glowsouk'],
  openGraph: {
    siteName: 'Glowsouk',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Header />
        <main className="min-h-screen">{children}</main>
        <footer className="bg-glowsouk-dark text-white/60 py-10 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="font-serif text-2xl text-white">Glowsouk</span>
                <p className="text-sm mt-1">Your beauty community. Honest reviews, real results.</p>
              </div>
              <div className="flex gap-6 text-sm">
                <a href="/products?category=skincare" className="hover:text-white transition-colors">Skincare</a>
                <a href="/products?category=makeup"   className="hover:text-white transition-colors">Makeup</a>
                <a href="/products?category=haircare" className="hover:text-white transition-colors">Haircare</a>
                <a href="/products?category=fragrance" className="hover:text-white transition-colors">Fragrance</a>
                <a href="/products?category=bodycare" className="hover:text-white transition-colors">Bodycare</a>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs">
              © {new Date().getFullYear()} Glowsouk. All rights reserved.
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
