import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { App } from './babylonLite/App.tsx'
import Check_webGL from './webGL_check.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/three-ver" element={<Check_webGL />} />
      <Route path="/" element={<App />} />
    </Routes>
  </BrowserRouter>
)
