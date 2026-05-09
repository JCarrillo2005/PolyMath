import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getJob, getIterations } from "../services/jobs";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// Función para convertir sintaxis de Python a LaTeX
function convertirALaTeX(funcion: string): string {
  if (!funcion) return "f(x)";

  const latex = funcion
    .replace(/\*\*(\d+)/g, "^{$1}")
    .replace(/\*\*([a-z])/g, "^{$1}")
    .replace(/\*\*\(([^)]+)\)/g, "^{($1)}")
    .replace(/(\d+)\*([a-z])/g, "$1$2")
    .replace(/([a-z])\*(\d+)/g, "$1$2")
    .replace(/sin/g, "\\sin")
    .replace(/cos/g, "\\cos")
    .replace(/tan/g, "\\tan")
    .replace(/log/g, "\\ln");

  return latex;
}

function formatNumber(value: number | string | undefined): string {
  if (value === undefined || value === null) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);

  return num.toFixed(8);
}

function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [iterations, setIterations] = useState<any[]>([]);

  useEffect(() => {
    if (!jobId) return;

    const loadData = async () => {
      console.log(`Polling ejecutado: ${new Date().toLocaleTimeString()}`);
      try {
        const jobData = await getJob(jobId);
        setJob(jobData);

        if (jobData.estado === "DONE") {
          const iterationData = await getIterations(jobId);
          // Asegurar que las iteraciones empiecen en 1
          const fixedIterations = iterationData.map((item, index) => ({
            ...item,
            iteracion: index + 1,
          }));
          setIterations(fixedIterations);
        } else {
          setIterations([]);
        }
      } catch (error) {
        console.error("Error cargando job:", error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) {
    return <p className="p-10 text-center">Cargando resultado...</p>;
  }

  // Preparar datos para la gráfica
  const chartData = iterations.map((item) => ({
    iteracion: item.iteracion,
    error: item.error,
    raiz: item.xi || (item.vector_x ? JSON.parse(item.vector_x) : null),
    raizTexto: formatRaizTexto(item),
  }));

  function formatRaizTexto(item: any): string {
    if (item.xi) return formatNumber(item.xi);
    if (item.vector_x) {
      try {
        const vector = JSON.parse(item.vector_x);
        return `[${vector.map((v: number) => formatNumber(v)).join(", ")}]`;
      } catch {
        return item.vector_x;
      }
    }
    return "-";
  }

  const formatRaiz = (item: any) => {
    if (item.xi) return formatNumber(item.xi);
    if (item.vector_x) {
      try {
        const vector = JSON.parse(item.vector_x);
        return `[${vector.map((v: number) => formatNumber(v)).join(", ")}]`;
      } catch {
        return item.vector_x;
      }
    }
    return "-";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-bold mb-1">Iteración: {dataPoint.iteracion}</p>
          <p className="text-blue-600">
            <span className="font-semibold">Raíz:</span> {dataPoint.raizTexto}
          </p>
          <p className="text-orange-600">
            <span className="font-semibold">Error:</span>{" "}
            {formatNumber(dataPoint.error)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="border-2 border-dashed border-gray-500 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Resultado del método {job.metodo}
        </h1>

        {/* Información del Job */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Estado</p>
            <p
              className={`font-bold text-lg ${
                job.estado === "DONE"
                  ? "text-green-600"
                  : job.estado === "FAILED"
                    ? "text-red-600"
                    : job.estado === "RUNNING"
                      ? "text-blue-600"
                      : "text-yellow-600"
              }`}
            >
              {job.estado}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tiempo</p>
            <p className="font-bold text-lg">{job.tiempoEjecucionMs ?? 0} ms</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Convergió</p>
            <p className="font-bold text-lg">
              {job.converged
                ? "Sí"
                : job.estado === "DONE"
                  ? " No"
                  : " Pendiente"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Resultado final</p>
            <p className="font-mono text-lg break-all">
              {job.resultado ? formatNumber(job.resultado) : "-"}
            </p>
          </div>
        </div>

        {/* Función */}
        <div className="mb-8">
          <p className="font-bold mb-2">Función:</p>
          <div className="bg-gray-100 p-4 rounded-lg text-center overflow-x-auto">
            <BlockMath math={"f(x) = " + convertirALaTeX(job.funcion)} />
          </div>
        </div>

        {/* Gráfica de convergencia */}
        {iterations.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4 mt-6">
              Gráfica de convergencia
            </h2>
            <div className="h-96 border rounded-lg p-4 bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="iteracion"
                    label={{ value: "Iteración", position: "bottom" }}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    label={{
                      value: "Error",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="error"
                    stroke="#ff7300"
                    name="Error"
                    dot={{ r: 3 }}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Tabla de iteraciones */}
        {iterations.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4 mt-8">
              Tabla de iteraciones
            </h2>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border text-left">Iteración</th>
                    <th className="p-3 border text-left">
                      Valor (Xi / VectorX)
                    </th>
                    <th className="p-3 border text-left">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {iterations.map((item, idx) => (
                    <tr
                      key={idx}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-3 border font-mono text-center">
                        {item.iteracion}
                      </td>
                      <td className="p-3 border font-mono break-all">
                        {formatRaiz(item)}
                      </td>
                      <td className="p-3 border font-mono">
                        {item.error !== undefined && item.error !== null
                          ? formatNumber(item.error)
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-right">
              Total de iteraciones: {iterations.length}
            </p>
          </>
        )}

        {/* Mensaje si no hay iteraciones */}
        {iterations.length === 0 && job.estado === "DONE" && (
          <div className="text-center p-8 bg-yellow-50 rounded-lg mt-4">
            <p className="text-yellow-700">
              No se encontraron iteraciones para este job.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetail;