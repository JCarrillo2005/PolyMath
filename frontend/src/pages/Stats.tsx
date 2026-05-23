import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { LoadingSpinner } from "../components/LoadingSpinner";

const COLORS = {
  PENDING: "#f59e0b",
  RUNNING: "#3b82f6",
  DONE: "#10b981",
  FAILED: "#ef4444",
};

function Stats() {
  const [jobsByStatus, setJobsByStatus] = useState([]);
  const [jobsByMethod, setJobsByMethod] = useState([]);
  const [convergenceStats, setConvergenceStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statusRes, methodRes, convergenceRes] = await Promise.all([
          fetch("http://localhost:5000/api/Jobs/stats/jobs-by-status"),
          fetch("http://localhost:5000/api/Jobs/stats/jobs-by-method"),
          fetch("http://localhost:5000/api/Jobs/stats/convergence"),
        ]);

        setJobsByStatus(await statusRes.json());
        setJobsByMethod(await methodRes.json());
        setConvergenceStats(await convergenceRes.json());
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading)
    return <LoadingSpinner message="Cargando estadísticas..." size="lg" />;

  const statusData = jobsByStatus.map((item: any) => ({
    name:
      item.estado === "PENDING"
        ? "Pendiente"
        : item.estado === "RUNNING"
          ? "En progreso"
          : item.estado === "DONE"
            ? "Completados"
            : "Fallidos",
    value: item.cantidad,
    color: COLORS[item.estado as keyof typeof COLORS],
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Estadísticas de Jobs
          </h1>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
          >
            ← Volver al inicio
          </button>
        </div>

        {/* Tarjetas de resumen */}
        {convergenceStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm text-gray-500">Total de jobs</p>
              <p className="text-3xl font-bold text-gray-800">
                {convergenceStats.totalJobs}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm text-gray-500">Tasa de convergencia</p>
              <p className="text-3xl font-bold text-green-600">
                {convergenceStats.tasaConvergencia}%
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm text-gray-500">Promedio de iteraciones</p>
              <p className="text-3xl font-bold text-blue-600">
                {convergenceStats.promedioIteraciones}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
              <p className="text-sm text-gray-500">Jobs convergidos</p>
              <p className="text-3xl font-bold text-green-600">
                {convergenceStats.convergedJobs}
              </p>
            </div>
          </div>
        )}

        {/* Gráficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfica de pastel - Jobs por estado */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Jobs por estado
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica de barras - Jobs por método */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Jobs por método
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={jobsByMethod}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="metodo"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stats;
