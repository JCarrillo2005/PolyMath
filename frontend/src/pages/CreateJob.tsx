import { useState } from 'react';
import { createJob } from '../services/jobs.ts';

function CreateJob() {
  const [method, setMethod] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const handleChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value
    });
  };

  const handleSubmit = async () => {
    if (!method) {
      alert('Por favor seleccione un método antes de enviar el job');
      return;
    }

    setLoading(true);

    try {
      let parametros: any = {};

      if (method === 'newton') {
        parametros = {
          funcion: formData.funcion,
          x0: parseFloat(formData.x0),
          tolerancia: 0.0001,
          maxIteraciones: 100
        };
      }

      const response = await createJob(method, parametros);
      setJobId(response.jobId);
      alert(`Job creado con ID: ${response.jobId}`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear el job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Job</h1>

      <select
        value={method}
        onChange={(e) => setMethod(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">Seleccione un método</option>
        <option value="newton">Newton-Raphson</option>
        <option value="secante">Secante</option>
        <option value="muller">Müller</option>
        <option value="gauss">Gauss</option>
        <option value="gaussSeidel">Gauss-Seidel</option>
        <option value="gaussJordan">Gauss-Jordan</option>
      </select>

      {method === 'newton' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Función f(x) ej: x^2 - 4"
            onChange={(e) => handleChange('funcion', e.target.value)}
            className="w-full border p-2 rounded"
          />
          <input
            type="number"
            placeholder="x0 (valor inicial)"
            onChange={(e) => handleChange('x0', e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {loading ? 'Creando...' : 'Enviar Job'}
      </button>

      {jobId && (
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p> Job creado: <code>{jobId}</code></p>
          <a href={`/job/${jobId}`} className="text-blue-600">
            Ver estado →
          </a>
        </div>
      )}
    </div>
  );
}

export default CreateJob;