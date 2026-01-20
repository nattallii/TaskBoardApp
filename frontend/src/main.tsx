import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import './index.css'
import App from './App.tsx'
import { NotificationProvider } from './components/NotificationProvider'
import { theme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={theme}>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ChakraProvider>
  </StrictMode>,
)
