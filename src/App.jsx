import { useEffect, useState } from 'react'
import { AuthProvider } from './state/AuthContext.jsx'
import { EditorProvider } from './state/EditorContext.jsx'
import Editor from './components/editor/Editor.jsx'
import AdminPage from './components/admin/AdminPage.jsx'
import HelpPage from './components/help/HelpPage.jsx'

export default function App() {
  // Tiny hash routes: `#admin` opens the template-review queue (M8); `#help` opens the how-to guide.
  // Using the hash avoids needing a router or an SPA fallback — the root index.html always serves.
  const [route, setRoute] = useState(() => window.location.hash)
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === '#admin') return <AdminPage />
  if (route === '#help') return <HelpPage />

  return (
    <AuthProvider>
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </AuthProvider>
  )
}
