import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAllJobs } from "../services/jobs";
import { LoadingSpinner } from "../components/LoadingSpinner";

// ==================== INTERFACES TIPADAS ====================

export type MetodoNumerico =
  | "newton"
  | "secante"
  | "muller"
  | "gauss"
  | "gaussSeidel"
  | "gaussJordan";

export type EstadoJob = "PENDING" | "RUNNING" | "DONE" | "FAILED";
export type ConvergenciaFiltro = "Todos" | "Convergió" | "No convergió";

export interface Job {
  jobId: string;
  metodo: MetodoNumerico;
  estado: EstadoJob;
  resultado: string | null;
  converged: boolean | null;
  tiempoEjecucionMs: number | null;
  creadoEn: string;
  errorMensaje?: string;
  funcion?: string;
  parametrosJson?: string;
}

// ==================== FUNCIÓN PARA OBTENER COLOR DEL ESTADO ====================

const obtenerColorEstado = (estado: EstadoJob): string => {
  const colores: Record<EstadoJob, string> = {
    DONE: "bg-green-100 text-green-800 border-green-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
    RUNNING: "bg-blue-100 text-blue-800 border-blue-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  };
  return colores[estado];
};

// ==================== FUNCIÓN PARA FORMATEAR NOMBRE DEL MÉTODO ====================

const formatearNombreMetodo = (metodo: MetodoNumerico): string => {
  const nombres: Record<MetodoNumerico, string> = {
    newton: "Newton-Raphson",
    secante: "Secante",
    muller: "Müller",
    gauss: "Gauss",
    gaussSeidel: "Gauss-Seidel",
    gaussJordan: "Gauss-Jordan",
  };
  return nombres[metodo];
};

// ==================== COMPONENTE PRINCIPAL ====================

function Home() {
  // Estados con tipado estricto
  const [jobs, setJobs] = useState<Job[]>([]);
  const [jobsFiltrados, setJobsFiltrados] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros con tipado estricto
  const [metodoFiltro, setMetodoFiltro] = useState<MetodoNumerico | "Todos">(
    "Todos",
  );
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoJob | "Todos">(
    "Todos",
  );
  const [convergenciaFiltro, setConvergenciaFiltro] =
    useState<ConvergenciaFiltro>("Todos");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const jobsPorPagina = 10;

  // Cargar jobs al montar el componente
  useEffect(() => {
    cargarJobs();
  }, []);

  const cargarJobs = async (): Promise<void> => {
    try {
      setLoading(true);
      const data: Job[] = await getAllJobs();
      setJobs(data);
      setJobsFiltrados(data);
      setPaginaActual(1); // Resetear paginación
    } catch (error) {
      console.error("Error cargando jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (): void => {
    let filtrados: Job[] = [...jobs];

    if (metodoFiltro !== "Todos") {
      filtrados = filtrados.filter((job) => job.metodo === metodoFiltro);
    }

    if (estadoFiltro !== "Todos") {
      filtrados = filtrados.filter((job) => job.estado === estadoFiltro);
    }

    if (convergenciaFiltro !== "Todos") {
      const convergio = convergenciaFiltro === "Convergió";
      filtrados = filtrados.filter((job) => job.converged === convergio);
    }

    setJobsFiltrados(filtrados);
    setPaginaActual(1); // Resetear a primera página al filtrar
  };

  const limpiarFiltros = (): void => {
    setMetodoFiltro("Todos");
    setEstadoFiltro("Todos");
    setConvergenciaFiltro("Todos");
    setJobsFiltrados(jobs);
    setPaginaActual(1);
  };

  // Calcular jobs a mostrar en la página actual
  const indexUltimo = paginaActual * jobsPorPagina;
  const indexPrimero = indexUltimo - jobsPorPagina;
  const jobsPaginados = jobsFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(jobsFiltrados.length / jobsPorPagina);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Fondo con patrón de cuadrícula */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER - Hero section con gradiente */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl shadow-2xl mb-8 overflow-hidden">
          <div className="relative px-8 py-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                      PolyMath
                    </h1>
                  </div>
                  <p className="text-blue-200 text-lg max-w-2xl">
                    Plataforma de ejecución, trazabilidad y comparación de
                    métodos numéricos
                  </p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-blue-200">
                      Newton-Raphson
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-blue-200">
                      Secante
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-blue-200">
                      Müller
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-blue-200">
                      Gauss
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-blue-200">
                      Gauss-Seidel
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg text-xs text-blue-200">
                      Gauss-Jordan
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de acceso rápido */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            to="/create"
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Nuevo</p>
                <p className="text-xl font-bold">+ Crear Job</p>
              </div>
            </div>
          </Link>

          <Link
            to="/stats"
            className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Análisis</p>
                <p className="text-xl font-bold">Estadísticas</p>
              </div>
            </div>
          </Link>

          <Link
            to="/compare"
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Comparación</p>
                <p className="text-xl font-bold">Métodos de Raíces</p>
              </div>
            </div>
          </Link>

          <Link
            to="/compare-matrices"
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Matrices</p>
                <p className="text-xl font-bold">Gauss vs Jordan</p>
              </div>
            </div>
          </Link>

          <Link
            to="/compare/history"
            className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Historial</p>
                <p className="text-xl font-bold">Raíces</p>
              </div>
            </div>
          </Link>

          <Link
            to="/compare-matrices/history"
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl p-4 text-white shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Historial</p>
                <p className="text-xl font-bold">Matrices</p>
              </div>
            </div>
          </Link>
        </div>

        {/* PANEL DE FILTROS */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              Filtrar resultados
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Método
                </label>
                <select
                  value={metodoFiltro}
                  onChange={(e) =>
                    setMetodoFiltro(e.target.value as MetodoNumerico | "Todos")
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="Todos">Todos</option>
                  <option value="newton">Newton-Raphson</option>
                  <option value="secante">Secante</option>
                  <option value="muller">Müller</option>
                  <option value="gauss">Gauss</option>
                  <option value="gaussSeidel">Gauss-Seidel</option>
                  <option value="gaussJordan">Gauss-Jordan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Estado
                </label>
                <select
                  value={estadoFiltro}
                  onChange={(e) =>
                    setEstadoFiltro(e.target.value as EstadoJob | "Todos")
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="Todos">Todos</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RUNNING">RUNNING</option>
                  <option value="DONE">DONE</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Convergencia
                </label>
                <select
                  value={convergenciaFiltro}
                  onChange={(e) =>
                    setConvergenciaFiltro(e.target.value as ConvergenciaFiltro)
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="Todos">Todos</option>
                  <option value="Convergió">Convergió</option>
                  <option value="No convergió">No convergió</option>
                </select>
              </div>

              <div className="flex gap-2 lg:col-span-2">
                <button
                  onClick={aplicarFiltros}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-200"
                >
                  Aplicar filtros
                </button>
                <button
                  onClick={limpiarFiltros}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium border border-gray-200 transition"
                >
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TABLA DE JOBS */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              Historial de Jobs
              {!loading && (
                <span className="ml-2 text-sm font-normal text-gray-400">
                  ({jobsFiltrados.length} jobs)
                </span>
              )}
            </h2>
            <button
              onClick={cargarJobs}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title="Actualizar"
            >
              🔄
            </button>
          </div>

          {loading ? (
            <LoadingSpinner message="Cargando jobs..." size="lg" />
          ) : jobsFiltrados.length === 0 ? (
            <div className="text-center py-16 bg-gray-50">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-500 text-lg">No se encontraron jobs</p>
              <Link
                to="/create"
                className="inline-block mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
              >
                Crear un job
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Método
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Resultado
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Convergió
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Tiempo
                      </th>
                      <th className="px-6 py-4 text-left font-semibold text-gray-600">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-center font-semibold text-gray-600">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {jobsPaginados.map((job) => (
                      <tr
                        key={job.jobId}
                        className="hover:bg-blue-50/30 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 font-medium capitalize">
                          {formatearNombreMetodo(job.metodo)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${obtenerColorEstado(job.estado)}`}
                          >
                            {job.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs max-w-xs truncate">
                          {job.resultado || "-"}
                        </td>
                        <td className="px-6 py-4">
                          {job.converged === true ? (
                            <span className="text-green-600 font-medium">
                              Sí
                            </span>
                          ) : job.converged === false ? (
                            <span className="text-red-600 font-medium">No</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {job.tiempoEjecucionMs
                            ? `${job.tiempoEjecucionMs} ms`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-xs">
                          {job.creadoEn
                            ? new Date(job.creadoEn).toLocaleString()
                            : "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Link
                            to={`/job/${job.jobId}`}
                            className="inline-flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md"
                          >
                            Ver detalle
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINACIÓN */}
              {totalPaginas > 1 && (
                <div className="flex justify-center items-center gap-4 py-4 border-t border-gray-100">
                  <button
                    onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                    disabled={paginaActual === 1}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    ← Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {paginaActual} de {totalPaginas}
                  </span>
                  <button
                    onClick={() =>
                      setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                    }
                    disabled={paginaActual === totalPaginas}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* FOOTER */}
        <footer className="mt-12 text-center text-gray-400 text-sm py-6 border-t border-gray-200">
          <p>
            PolyMath - Métodos Numéricos | Arquitectura Híbrida con Docker,
            Redis y SQL Server
          </p>
          <p className="mt-1">© 2026 - Todos los derechos reservados</p>
        </footer>
      </div>
    </div>
  );
}

export default Home;
