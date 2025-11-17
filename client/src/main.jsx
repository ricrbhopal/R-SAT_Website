import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { setAuthToken } from './config/api.js'

import App from './App.jsx'

// If a token exists in sessionStorage from a previous login in this tab,
// set the Authorization header so protected requests work.
const token = sessionStorage.getItem('token');
if (token) setAuthToken(token);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
