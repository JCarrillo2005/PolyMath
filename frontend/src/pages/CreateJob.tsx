import { useState } from 'react'

function CreateJob() {
  const [method, setMethod] = useState('')
  const [formData, setFormData] = useState<any>({})

  const handleChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value
    })

    const handleSubmit = () => {
  const data = { method, ...formData }

  console.log('Enviando:', data)

  setTimeout(() => {
    console.log('Respuesta simulada:', {
      id: 1,
      status: 'processing',
      result: null
    })
  }, 1000)
}
  }

  return (
    <div className="p-10 max-w-xl mx-auto">
      
      <h1 className="text-3xl font-bold mb-6">
        Crear Nuevo Job 
      </h1>

      {/* SELECT */}
      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">Seleccione un método</option>
        <option value="bisection">Bisección</option>
        <option value="newton">Newton-Raphson</option>
      </select>

      {/* BISECTION */}
      {method === 'bisection' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Función f(x)"
            onChange={(e) => handleChange('function', e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            placeholder="a"
            onChange={(e) => handleChange('a', e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            placeholder="b"
            onChange={(e) => handleChange('b', e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      {/* NEWTON */}
      {method === 'newton' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Función f(x)"
            onChange={(e) => handleChange('function', e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            placeholder="Valor inicial"
            onChange={(e) => handleChange('x0', e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      {/* BOTÓN */}
      <button
        onClick={() => console.log({ method, ...formData })}
        className="mt-6 bg-green-500 text-white px-4 py-2 rounded"
      >
        Enviar Job
      </button>

    </div>
  )
}

export default CreateJob