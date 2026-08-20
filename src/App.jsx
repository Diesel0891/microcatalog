import { HashRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Catalog from './pages/Catalog'
import ErrorBoundary from './components/ErrorBoundary.jsx'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/u/:manageToken" element={<Upload />} />
        <Route path="/c/:sellerUuid" element={<ErrorBoundary><Catalog /></ErrorBoundary>} />
      </Routes>
    </HashRouter>
  )
}

export default App
