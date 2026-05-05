import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateJob from './pages/CreateJob'
import JobDetail from './pages/JobDetail'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/create" element={<CreateJob />} />
      <Route path="/job/:jobId" element={<JobDetail />} />
    </Routes>
  )
}

export default App