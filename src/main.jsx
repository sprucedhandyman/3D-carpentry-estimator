import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import AnalyticsConsent from './components/AnalyticsConsent.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <AnalyticsConsent />
  </React.StrictMode>,
)
