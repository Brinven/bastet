import { EditorProvider } from './state/EditorContext.jsx'
import Editor from './components/editor/Editor.jsx'

export default function App() {
  return (
    <EditorProvider>
      <Editor />
    </EditorProvider>
  )
}
