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

function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [iterations, setIterations] = useState<any[]>([]);

  useEffect(() => {
    if (!jobId) return;

    const loadData = async () => {
      const jobData = await getJob(jobId);
      setJob(jobData);

      if (jobData.estado === "DONE") {
        const iterationData = await getIterations(jobId);
        setIterations(iterationData);
      }
    };

    loadData();
  }, [jobId]);

  if (!job) {
    return <p className="p-10">Cargando resultado...</p>;
  }

  const chartData = iterations.map((item) => ({
    iteracion: item.iteracion,
    error: item.error,
  }));

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <div className="border-2 border-dashed border-gray-500 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6">
          Resultado del método {job.metodo}
        </h1>

        <div className="space-y-3 mb-8">
          <p>
            <strong>△ Función:</strong>
          </p>

          <div className="bg-gray-100 p-3 rounded">
            <BlockMath math={job.parametrosJson ?? "f(x)"} />
          </div>

          <p>
            🎯 <strong>Resultado:</strong> {job.resultado ?? "Pendiente"}
          </p>

          <p>
            ✅ <strong>Convergió:</strong>{" "}
            {job.converged ? "Sí" : "No / Pendiente"}
          </p>

          <p>
            ⏱️ <strong>Tiempo:</strong>{" "}
            {job.tiempoEjecucionMs ?? 0} ms
          </p>
        </div>

        <h2 className="text-xl font-bold mb-4">
          📈 Gráfica de convergencia
        </h2>

        <div className="h-80 border rounded p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="iteracion" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="error" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default JobDetail;