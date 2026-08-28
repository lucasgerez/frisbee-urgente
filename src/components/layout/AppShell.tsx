import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { BottomNav } from './BottomNav'

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 pb-20">
        <div className="px-4 py-5">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
