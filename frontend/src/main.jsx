import { createRoot } from 'react-dom/client'
import '../src/styles/index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import { LanguageProvider } from './context/LanguageContext'

createRoot(document.getElementById('root')).render(
  <LanguageProvider>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </LanguageProvider>
)
