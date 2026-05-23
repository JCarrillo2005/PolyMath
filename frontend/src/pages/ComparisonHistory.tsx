import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getComparisonHistory,
  type ComparisonHistoryItem,
} from "../services/comparisonHistory";
import { LoadingSpinner } from "../components/LoadingSpinner";

function ComparisonHistory() {
  const navigate = useNavigate();
  const [comparisons, setComparisons] = useState<ComparisonHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await getComparisonHistory();
      setComparisons(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el historial",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString();
  };

  const obtenerMetodosLista = (metodosUsados: string) => {
    try {
      const metodos = JSON.parse(metodosUsados);
      return metodos
        .map((m: string) => {
          if (m === "newton") return "Newton";
          if (m === "secante") return "Secante";
          if (m === "muller") return "Müller";
          return m;
        })
        .join(", ");
    } catch {
      return metodosUsados;
    }
  };

  const obtenerResumen = (jobs: ComparisonHistoryItem["jobs"]) => {
    const convergidos = jobs.filter((j) => j.converged === true).length;
    const total = jobs.length;
    return `${convergidos}/${total} convergieron`;
  };

  const getStatusColor = (jobs: ComparisonHistoryItem["jobs"]) => {
    const convergidos = jobs.filter((j) => j.converged === true).length;
    const total = jobs.length;
    if (convergidos === total && total > 0) return "text-green-600";
    if (convergidos > 0) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner message="Cargando historial..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Historial de Comparaciones
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Revisa resultados de comparaciones anteriores
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/compare")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              Nueva Comparación
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {comparisons.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center border border-gray-100">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay comparaciones guardadas
            </h3>
            <p className="text-gray-500 mb-6">
              Aún no has realizado ninguna comparación de métodos.
            </p>
            <button
              onClick={() => navigate("/compare")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
            >
              Crear primera comparación
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">
                      Fecha
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">
                      Función
                    </th>
                    <th className="px-6 py-4 text-left font-semibold text-gray-600">
                      Métodos
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600">
                      Resumen
                    </th>
                    <th className="px-6 py-4 text-center font-semibold text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisons.map((comp) => (
                    <tr
                      key={comp.comparisonId}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatearFecha(comp.creadoEn)}
                      </td>
                      <td className="px-6 py-4">
                        <code className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {comp.funcion}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {obtenerMetodosLista(comp.metodosUsados)}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        <span className={getStatusColor(comp.jobs)}>
                          {obtenerResumen(comp.jobs)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            navigate(`/compare/${comp.comparisonId}`)
                          }
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition shadow-sm"
                        >
                          Ver detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComparisonHistory;
