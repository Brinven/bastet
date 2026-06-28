import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { initAppTheme } from './lib/themes.js'
import './index.css'

initAppTheme() // apply the stored color theme (CSS hue vars) before first paint

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
