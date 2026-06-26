import { AuthProvider } from './state/AuthContext.jsx'
import { EditorProvider } from './state/EditorContext.jsx'
import Editor from './components/editor/Editor.jsx'

export default function App() {
  return (
    <AuthProvider>
      <EditorProvider>
        <Editor />
      </EditorProvider>
    </AuthProvider>
  )
}
