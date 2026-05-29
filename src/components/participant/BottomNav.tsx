'use client'

import Link from 'next/link'

const tabs = [
  { href: '/desafios',     label: 'Desafios',     icon: '📋' },
  { href: '/ranking',      label: 'Ranking',      icon: '🏆' },
  { href: '/midias',       label: 'Mídias',       icon: '🖼' },
  { href: '/conhecimento', label: 'Conhecimento',  icon: '🎓' },
  { href: '/perfil',       label: 'Perfil',       icon: '👤' },
]

export default function BottomNav({ active }: { active: string }) {
  return (
    <nav
      className="flex-shrink-0 bg-white border-t border-purple-100 flex justify-around safe-area-bottom"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)', paddingTop: 8 }}
    >
      {tabs.map(tab => {
        const isActive = active === tab.href.slice(1)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 min-w-12 pb-1 transition-colors ${
              isActive ? 'text-purple-700' : 'text-gray-400'
            }`}
          >
            <span className="text-xl leading-none">{tab.icon}</span>
            <span className="text-xs font-semibold">{tab.label}</span>
            {isActive && (
              <div className="w-1 h-1 rounded-full bg-purple-700" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
