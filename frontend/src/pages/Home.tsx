import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllJobs } from "../services/jobs";

function Home() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarJobs();
  }, []);

  const cargarJobs = async () => {
    try {
      const data = await getAllJobs();
      setJobs(data);
    } catch (error) {
      console.error("Error cargando jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const obtenerColorEstado = (estado: string) => {
    switch (estado) {
      case "DONE":
        return "text-green-600 bg-green-100";

      case "FAILED":
        return "text-red-600 bg-red-100";

      case "RUNNING":
        return "text-blue-600 bg-blue-100";

      default:
        return "text-yellow-600 bg-yellow-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">

          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              PolyMath
            </h1>

            <p className="text-gray-600 mt-2">
              Plataforma de métodos numéricos
            </p>
          </div>

          <Link
            to="/create"
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow"
          >
            + Crear nuevo Job
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Historial de Jobs
            </h2>

            <button
              onClick={cargarJobs}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-medium"
            >
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                Cargando jobs...
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">
                No hay jobs registrados.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="min-w-full text-sm border rounded-lg overflow-hidden">

                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4 text-left border">
                      Método
                    </th>

                    <th className="p-4 text-left border">
                      Estado
                    </th>

                    <th className="p-4 text-left border">
                      Resultado
                    </th>

                    <th className="p-4 text-left border">
                      Tiempo
                    </th>

                    <th className="p-4 text-left border">
                      Fecha
                    </th>

                    <th className="p-4 text-center border">
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((job, index) => (
                    <tr
                      key={job.jobId}
                      className={
                        index % 2 === 0
                          ? "bg-white"
                          : "bg-gray-50"
                      }
                    >

                      <td className="p-4 border font-semibold capitalize">
                        {job.metodo}
                      </td>

                      <td className="p-4 border">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${obtenerColorEstado(
                            job.estado
                          )}`}
                        >
                          {job.estado}
                        </span>
                      </td>

                      <td className="p-4 border font-mono break-all">
                        {job.resultado || "-"}
                      </td>

                      <td className="p-4 border">
                        {job.tiempoEjecucionMs
                          ? `${job.tiempoEjecucionMs} ms`
                          : "-"}
                      </td>

                      <td className="p-4 border">
                        {job.creadoEn
                          ? new Date(job.creadoEn).toLocaleString()
                          : "-"}
                      </td>

                      <td className="p-4 border text-center">
                        <Link
                          to={`/job/${job.jobId}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Ver detalle
                        </Link>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;