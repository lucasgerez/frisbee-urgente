import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { Home } from './pages/Home'
import { Times } from './pages/Times'
import { Torneios } from './pages/Torneios'
import { TorneioEstatisticas } from './pages/TorneioEstatisticas'
import { TorneioTimes } from './pages/TorneioTimes'
import { Jogos } from './pages/Jogos'
import { JogoView } from './pages/JogoView'
import { JogoAnotar } from './pages/JogoAnotar'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { AuthConfirm } from './pages/AuthConfirm'
import { Admin } from './pages/Admin'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Home /> },
      { path: 'times', element: <Times /> },
      { path: 'torneios', element: <Torneios /> },
      { path: 'torneios/times', element: <TorneioTimes /> },
      { path: 'torneios/:id/estatisticas', element: <TorneioEstatisticas /> },
      { path: 'jogos', element: <Jogos /> },
      { path: 'jogos/:id', element: <JogoView /> },
      { path: 'jogos/:id/anotar', element: <JogoAnotar /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'auth/confirm', element: <AuthConfirm /> },
      { path: 'admin', element: <Admin /> },
    ],
  },
])

export function App() {
  return <RouterProvider router={router} />
}
