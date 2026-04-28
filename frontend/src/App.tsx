import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateJob from './pages/CreateJob'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateJob />} />
    </Routes>
  )
}

export default App