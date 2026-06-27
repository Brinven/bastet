import { useEffect, useState } from 'react'
import { AuthProvider } from './state/AuthContext.jsx'
import { EditorProvider } from './state/EditorContext.jsx'
import Editor from './components/editor/Editor.jsx'
import AdminPage from './components/admin/AdminPage.jsx'

export default function App() {
  // Tiny hash route: `#admin` opens the template-review queue (M8). Using the hash avoids needing a
  // router or an SPA fallback on Cloudflare Pages — the root index.html always serves.
  const [isAdmin, setIsAdmin] = useState(() => window.location.hash === '#admin')
  useEffect(() => {
    const onHash = () => setIsAdmin(window.location.hash === '#admin')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (isAdmin) return <AdminPage />

  return (
    <AuthProvider>
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </AuthProvider>
  )
}
