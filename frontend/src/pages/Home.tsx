import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        Dashboard PolyMath 
      </h1>

      <p className="text-gray-600 mb-6">
        Bienvenido al sistema de métodos numéricos
      </p>

      <button
        onClick={() => navigate('/create')}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Crear Job
      </button>
    </div>
  )
}

export default Home