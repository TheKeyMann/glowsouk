'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Search, User, LogOut, Menu, X, ChevronDown, PlusCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { User as UserType } from '@/lib/types'

export default function Header() {
  const [user, setUser] = useState<UserType | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
          .then(({ data }) => setUser(data))
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setUser(data))
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMenuOpen(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const navLinks = [
    { href: '/products?category=skincare',  label: 'Skincare' },
    { href: '/products?category=makeup',    label: 'Makeup' },
    { href: '/products?category=haircare',  label: 'Haircare' },
    { href: '/products?category=fragrance', label: 'Fragrance' },
    { href: '/products?category=bodycare',  label: 'Bodycare' },
    { href: '/ranking',                     label: '🏆 Rankings' },
  ]

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-glowsouk-cream-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="font-serif text-2xl text-glowsouk-rose font-bold tracking-tight">
              Glow<span className="text-glowsouk-plum">souk</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  pathname.includes(link.href.split('?')[0])
                    ? 'text-glowsouk-rose'
                    : 'text-glowsouk-dark-muted hover:text-glowsouk-rose hover:bg-glowsouk-cream'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Search + Auth */}
          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glowsouk-dark-muted/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="pl-9 pr-4 py-2 text-sm bg-glowsouk-cream rounded-full border border-transparent focus:outline-none focus:border-glowsouk-rose/50 focus:bg-white transition-colors w-48 focus:w-64 duration-300"
              />
            </form>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-glowsouk-cream transition-colors"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username || ''} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-glowsouk-rose flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {(user.username || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-medium text-glowsouk-dark">
                    {user.username || user.email.split('@')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-glowsouk-dark-muted" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-glowsouk-cream-dark py-1 z-50">
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-glowsouk-dark hover:bg-glowsouk-cream transition-colors"
                    >
                      <User className="w-4 h-4 text-glowsouk-rose" />
                      My Profile
                    </Link>
                    <Link
                      href="/products/submit"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-glowsouk-dark hover:bg-glowsouk-cream transition-colors"
                    >
                      <PlusCircle className="w-4 h-4 text-glowsouk-rose" />
                      Submit a Product
                    </Link>
                    <div className="border-t border-glowsouk-cream-dark my-1" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-ghost text-sm">Sign in</Link>
                <Link href="/auth/signup" className="btn-primary text-sm">Join Free</Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-glowsouk-cream transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-glowsouk-cream-dark px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-glowsouk-dark-muted/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="input pl-9 text-sm"
            />
          </form>

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-glowsouk-dark-muted hover:text-glowsouk-rose hover:bg-glowsouk-cream rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pt-2 border-t border-glowsouk-cream-dark">
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-red-500 font-medium px-3 py-2"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="btn-secondary text-sm flex-1 text-center">Sign in</Link>
                <Link href="/auth/signup" onClick={() => setMenuOpen(false)} className="btn-primary text-sm flex-1 text-center">Join Free</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
