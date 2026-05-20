import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllJobs } from "../services/jobs";

function Home() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobsFiltrados, setJobsFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [metodoFiltro, setMetodoFiltro] = useState("Todos");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [convergenciaFiltro, setConvergenciaFiltro] =
    useState("Todos");

  useEffect(() => {
    cargarJobs();
  }, []);

  const cargarJobs = async () => {
    try {
      const data = await getAllJobs();

      setJobs(data);
      setJobsFiltrados(data);
    } catch (error) {
      console.error("Error cargando jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtrados = [...jobs];

    filtrados = filtrados.filter((job) => {
      return (
        (metodoFiltro === "Todos" ||
          job.metodo === metodoFiltro) &&

        (estadoFiltro === "Todos" ||
          job.estado === estadoFiltro) &&

        (convergenciaFiltro === "Todos" ||

          (convergenciaFiltro === "Convergió" &&
            job.converged === true) ||

          (convergenciaFiltro === "No convergió" &&
            job.converged === false))
      );
    });

    setJobsFiltrados(filtrados);
  };

  const limpiarFiltros = () => {
    setMetodoFiltro("Todos");
    setEstadoFiltro("Todos");
    setConvergenciaFiltro("Todos");

    setJobsFiltrados(jobs);
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

        {/* HEADER */}
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

        {/* HISTORIAL */}
        <div className="bg-white rounded-xl shadow-lg p-6 border">

          {/* TOP */}
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

          {/* FILTROS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">

            {/* MÉTODO */}
            <select
              value={metodoFiltro}
              onChange={(e) =>
                setMetodoFiltro(e.target.value)
              }
              className="border p-2 rounded-lg"
            >
              <option>Todos</option>
              <option value="newton">Newton</option>
              <option value="secante">Secante</option>
              <option value="muller">Müller</option>
              <option value="gauss">Gauss</option>
              <option value="gaussSeidel">
                Gauss-Seidel
              </option>
              <option value="gaussJordan">
                Gauss-Jordan
              </option>
            </select>

            {/* ESTADO */}
            <select
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(e.target.value)
              }
              className="border p-2 rounded-lg"
            >
              <option>Todos</option>
              <option value="PENDING">
                PENDING
              </option>
              <option value="RUNNING">
                RUNNING
              </option>
              <option value="DONE">
                DONE
              </option>
              <option value="FAILED">
                FAILED
              </option>
            </select>

            {/* CONVERGENCIA */}
            <select
              value={convergenciaFiltro}
              onChange={(e) =>
                setConvergenciaFiltro(
                  e.target.value
                )
              }
              className="border p-2 rounded-lg"
            >
              <option>Todos</option>
              <option>
                Convergió
              </option>
              <option>
                No convergió
              </option>
            </select>

            {/* FILTRAR */}
            <button
              onClick={aplicarFiltros}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              FILTRAR
            </button>

            {/* LIMPIAR */}
            <button
              onClick={limpiarFiltros}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              LIMPIAR
            </button>

          </div>

          {/* CONTENIDO */}
          {loading ? (
            <div className="text-center py-10">
              <p className="text-gray-500">
                Cargando jobs...
              </p>
            </div>
          ) : jobsFiltrados.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">
                No se encontraron jobs.
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
                      Convergió
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

                  {jobsFiltrados.map((job, index) => (
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
                        {job.converged === true
                          ? "Sí"
                          : job.converged === false
                          ? "No"
                          : "-"}
                      </td>

                      <td className="p-4 border">
                        {job.tiempoEjecucionMs
                          ? `${job.tiempoEjecucionMs} ms`
                          : "-"}
                      </td>

                      <td className="p-4 border">
                        {job.creadoEn
                          ? new Date(
                              job.creadoEn
                            ).toLocaleString()
                          : "-"}
                      </td>

                      <td className="p-4 border text-center">

                        <Link
                          to={`/job/${job.jobId}`}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap inline-block"
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