import React from 'react'
import ReactDOM from 'react-dom/client'
import { validateEnv } from '@/app/lib/@system/env'
import App from './App'
import './index.css'

validateEnv()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
