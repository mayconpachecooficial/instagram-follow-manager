import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/dm-sans'
import '@fontsource-variable/manrope'
import './styles.css'
import { App } from './App'
import { load } from './store'

void load()
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
