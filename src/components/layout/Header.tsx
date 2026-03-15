import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="bg-gray-900 text-white px-4 py-3 flex items-center gap-3 shadow-lg sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-3">
        <img
          src="/mascot.png"
          alt="Frisbee Urgente mascote"
          className="h-10 w-10 rounded-full object-cover border-2 border-gold-400"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
        <div>
          <div className="text-gold-400 font-black text-base leading-tight tracking-wide">
            FRISBEE URGENTE
          </div>
          <div className="text-gray-400 text-xs leading-tight">em Dados</div>
        </div>
      </Link>
    </header>
  )
}
