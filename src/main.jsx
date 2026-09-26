import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/global.css'
import './styles/AdminResponsive.css'
import { Buffer } from 'buffer'
import process from 'process'
import { Capacitor } from '@capacitor/core'

window.Buffer = Buffer
window.process = process

// Load compact native-mobile styles only when running as an Android/iOS APK.
// This keeps the web version completely untouched.
if (Capacitor.isNativePlatform()) {
    import('./styles/mobile-native.css')
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
