import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Legend,
} from "recharts";
import { LoadingSpinner } from "../components/LoadingSpinner";

// ==================== INTERFACES TIPADAS ====================

export type MetodoNumerico =
  | "newton"
  | "secante"
  | "muller"
  | "gauss"
  | "gaussSeidel"
  | "gaussJordan"
  | "biseccion"
  | "puntofijo";

export type EstadoJob = "PENDING" | "RUNNING" | "DONE" | "FAILED";

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

export interface Iteracion {
  iteracion: number;
  vectorX?: string | number[];
  erroresIndividuales?: string | number[];
  error?: number;
  xi?: number;
  xn?: number;
  x?: number;
}

export interface DatosConvergencia {
  iteracion: number;
  x1: number | null;
  x2: number | null;
  x3: number | null;
  e1: number | null;
  e2: number | null;
  e3: number | null;
}

export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: number;
}

export interface RaicesTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      iteracion: number;
      raizTexto: string;
      error: number;
    };
  }>;
}

export interface EstadoConfig {
  bg: string;
  text: string;
  border: string;
  label: string;
}

export interface ChartDataPoint {
  iteracion: number;
  error: number;
  raiz: number | undefined;
  raizTexto: string;
}

// ==================== FUNCIONES AUXILIARES ====================

function convertirALaTeX(funcion: string): string {
  if (!funcion) return "f(x)";
  return funcion
    .replace(/\*\*(\d+)/g, "^{$1}")
    .replace(/\*\*([a-z])/g, "^{$1}")
    .replace(/\*\*\(([^)]+)\)/g, "^{($1)}")
    .replace(/(\d+)\*([a-z])/g, "$1$2")
    .replace(/([a-z])\*(\d+)/g, "$1$2")
    .replace(/sin/g, "\\sin")
    .replace(/cos/g, "\\cos")
    .replace(/tan/g, "\\tan")
    .replace(/log/g, "\\ln");
}

function formatNumber(
  value: number | string | undefined | null,
  decimals: number = 8,
): string {
  if (value === undefined || value === null) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toFixed(decimals);
}

function convertirMatrizAEcuaciones(parametrosJson: string): string {
  try {
    const params = JSON.parse(parametrosJson) as { matrix?: string };
    const matrixStr = params.matrix;
    if (!matrixStr) return "f(x)";

    const rows = matrixStr.split(";");
    const numVars = rows[0].split(",").length - 1;
    const varNames = numVars === 2 ? ["x", "y"] : ["x", "y", "z"];

    const ecuaciones = rows.map((row: string) => {
      const valores = row.split(",").map(Number);
      const b = valores.pop();

      const terminos = valores
        .map((coef, j) => {
          if (coef === 0) return "";
          let signo = "";
          let valor = "";
          if (j === 0) {
            signo = coef < 0 ? "-" : "";
            valor = Math.abs(coef) === 1 ? "" : Math.abs(coef).toString();
          } else {
            signo = coef < 0 ? " - " : " + ";
            valor = Math.abs(coef) === 1 ? "" : Math.abs(coef).toString();
          }
          return `${signo}${valor}${varNames[j]}`;
        })
        .filter((t) => t !== "");

      let ecuacion = terminos.join("");
      if (!ecuacion.startsWith("-")) {
        ecuacion = " " + ecuacion;
      }
      return `${ecuacion} = ${b}`;
    });
    return ecuaciones.join(" \\\\ ");
  } catch {
    return "f(x)";
  }
}

function extraerVectorSolucion(resultado: string | null): number[] | null {
  if (!resultado) return null;
  try {
    const match = resultado.match(/\[(.*)\]/);
    if (match) {
      return match[1].split(",").map((v) => parseFloat(v));
    }
    return null;
  } catch {
    return null;
  }
}

function extraerDatosConvergencia(
  iterations: Iteracion[],
): DatosConvergencia[] {
  const datos: DatosConvergencia[] = [
    {
      iteracion: 0,
      x1: 0,
      x2: 0,
      x3: 0,
      e1: 100,
      e2: 100,
      e3: 100,
    },
  ];

  iterations.forEach((it) => {
    let vector: number[] | null = null;
    let errores: number[] | null = null;

    if (it.vectorX) {
      try {
        vector =
          typeof it.vectorX === "string" ? JSON.parse(it.vectorX) : it.vectorX;
      } catch (e) {}
    }

    if (it.erroresIndividuales) {
      try {
        errores =
          typeof it.erroresIndividuales === "string"
            ? JSON.parse(it.erroresIndividuales)
            : it.erroresIndividuales;
      } catch (e) {}
    }

    datos.push({
      iteracion: it.iteracion,
      x1: vector && vector[0] !== undefined ? vector[0] : null,
      x2: vector && vector[1] !== undefined ? vector[1] : null,
      x3: vector && vector[2] !== undefined ? vector[2] : null,
      e1: errores && errores[0] !== undefined ? errores[0] : null,
      e2: errores && errores[1] !== undefined ? errores[1] : null,
      e3: errores && errores[2] !== undefined ? errores[2] : null,
    });
  });

  return datos;
}

// ==================== COMPONENTES DE TOOLTIP ====================

const ErrorTooltipSeidel = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">Iteración: {label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ color: item.color }}>
            <span className="font-medium">{item.name}:</span>{" "}
            {item.value !== null && item.value !== undefined
              ? formatNumber(item.value, 4) + "%"
              : "-"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const VariablesTooltipSeidel = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">Iteración: {label}</p>
        {payload.map((item, idx) => (
          <p key={idx} style={{ color: item.color }}>
            <span className="font-medium">{item.name}:</span>{" "}
            {item.value !== null && item.value !== undefined
              ? formatNumber(item.value, 6)
              : "-"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RaicesTooltip = ({ active, payload }: RaicesTooltipProps) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-md p-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">
          Iteración: {dataPoint.iteracion}
        </p>
        <p className="text-blue-600">
          <span className="font-medium">Raíz:</span> {dataPoint.raizTexto}
        </p>
        <p className="text-orange-600">
          <span className="font-medium">Error:</span>{" "}
          {formatNumber(dataPoint.error)}
        </p>
      </div>
    );
  }
  return null;
};

// ==================== COMPONENTE PRINCIPAL ====================

function JobDetail() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [iterations, setIterations] = useState<Iteracion[]>([]);

  // Copiar ID
  const copiarId = (): void => {
    if (job?.jobId) {
      navigator.clipboard.writeText(job.jobId);
    }
  };

  // Función para formatear nombre del método
  const formatearNombreMetodo = (metodo: MetodoNumerico): string => {
    const nombres: Record<MetodoNumerico, string> = {
      newton: "Newton-Raphson",
      secante: "Secante",
      muller: "Müller",
      gauss: "Eliminación Gaussiana",
      gaussSeidel: "Gauss-Seidel",
      gaussJordan: "Gauss-Jordan",
      biseccion: "Bisección",
      puntofijo: "Punto Fijo",
    };
    return nombres[metodo];
  };

  useEffect(() => {
    if (!jobId) return;

    const loadData = async (): Promise<void> => {
      try {
        const jobData = await getJob(jobId);
        setJob(jobData as Job);

        if (jobData.estado === "DONE") {
          const iterationData = await getIterations(jobId);
          const fixedIterations: Iteracion[] = iterationData.map(
            (item, index) => ({
              ...item,
              iteracion: index + 1,
            }),
          );
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner message="Cargando resultado..." size="lg" />
      </div>
    );
  }

  const esMetodoLineal = ["gauss", "gaussJordan", "gaussSeidel"].includes(
    job.metodo,
  );
  const esGaussSeidel = job.metodo === "gaussSeidel";
  const vectorSolucion = extraerVectorSolucion(job.resultado);
  const variables: string[] =
    vectorSolucion?.length === 2 ? ["x", "y"] : ["x", "y", "z"];

  const convergenceData: DatosConvergencia[] =
    extraerDatosConvergencia(iterations);
  const chartData: ChartDataPoint[] = iterations.map((item) => ({
    iteracion: item.iteracion,
    error: item.error || 0,
    raiz: item.xi,
    raizTexto: item.xi ? formatNumber(item.xi) : "-",
  }));

  const formatRaiz = (item: Iteracion): string => {
    if (item.xi !== undefined && item.xi !== null) return formatNumber(item.xi);
    if (item.xn !== undefined && item.xn !== null) return formatNumber(item.xn);
    if (item.x !== undefined && item.x !== null) return formatNumber(item.x);
    if (item.vectorX) {
      try {
        const vector =
          typeof item.vectorX === "string"
            ? JSON.parse(item.vectorX)
            : item.vectorX;
        if (Array.isArray(vector)) {
          return `[${vector.map((v) => formatNumber(v)).join(", ")}]`;
        }
      } catch {}
    }
    return "-";
  };

  const obtenerEstadoConfig = (estado: EstadoJob): EstadoConfig => {
    const configs: Record<EstadoJob, EstadoConfig> = {
      DONE: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-200",
        label: "Completado",
      },
      FAILED: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-200",
        label: "Fallido",
      },
      RUNNING: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        border: "border-blue-200",
        label: "En progreso",
      },
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        border: "border-yellow-200",
        label: "Pendiente",
      },
    };
    return configs[estado];
  };

  const estadoConfig = obtenerEstadoConfig(job.estado);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con navegación */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PolyMath</h1>
            <p className="text-gray-500 text-sm mt-1">Detalle del job</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 border border-gray-200"
          >
            ← Volver al inicio
          </button>
        </div>

        {/* Tarjeta principal */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Cabecera con gradiente y botón copiar */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-8 py-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-white">
                  Resultado del método {formatearNombreMetodo(job.metodo)}
                </h2>
                <p className="text-blue-200 text-sm mt-1">ID: {job.jobId}</p>
              </div>
              <button
                onClick={copiarId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-all duration-200"
                title="Copiar ID del job"
              >
                <span className="hidden sm:inline">Copiar ID</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-8">
            {/* Información general - Grid de estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Estado
                </p>
                <span
                  className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-semibold ${estadoConfig.bg} ${estadoConfig.text} border ${estadoConfig.border}`}
                >
                  {estadoConfig.label}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Tiempo de ejecución
                </p>
                <p className="text-2xl font-bold text-gray-800 mt-1">
                  {job.tiempoEjecucionMs ?? 0}{" "}
                  <span className="text-sm font-normal text-gray-500">ms</span>
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Convergencia
                </p>
                <p
                  className={`text-xl font-bold mt-1 ${
                    job.converged
                      ? "text-green-600"
                      : job.estado === "DONE"
                        ? "text-red-600"
                        : "text-gray-400"
                  }`}
                >
                  {job.converged
                    ? "Convergió"
                    : job.estado === "DONE"
                      ? "No convergió"
                      : "Pendiente"}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Resultado final
                </p>
                <p className="font-mono text-sm text-gray-800 mt-1 break-all">
                  {job.resultado || "-"}
                </p>
              </div>
            </div>

            {/* Mensaje de error */}
            {job.estado === "FAILED" && job.errorMensaje && (
              <div className="mb-8 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-5">
                <p className="font-semibold text-red-800 mb-1">
                  Error del método
                </p>
                <p className="font-mono text-sm text-red-700 break-all">
                  {job.errorMensaje}
                </p>
              </div>
            )}

            {/* Sistema de ecuaciones para métodos lineales */}
            {esMetodoLineal && (
              <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Sistema de ecuaciones
                </h3>
                <div className="bg-white p-4 rounded-lg text-center overflow-x-auto">
                  <BlockMath
                    math={convertirMatrizAEcuaciones(
                      job.parametrosJson || "{}",
                    )}
                  />
                </div>
              </div>
            )}

            {/* Solución del sistema para métodos lineales */}
            {esMetodoLineal && vectorSolucion && (
              <div className="mb-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
                <h3 className="font-semibold text-blue-800 mb-4">
                  Solución del sistema
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vectorSolucion.map((valor, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg p-3 text-center shadow-sm"
                    >
                      <span className="text-gray-500 text-sm">
                        {variables[idx]}
                      </span>
                      <p className="font-mono text-xl font-bold text-blue-600">
                        {formatNumber(valor, 2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Métodos de raíces */}
            {!esMetodoLineal && (
              <>
                {/* Función */}
                <div className="mb-8 bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-4">Función</h3>
                  <div className="bg-white p-4 rounded-lg text-center overflow-x-auto">
                    <BlockMath
                      math={"f(x) = " + convertirALaTeX(job.funcion || "")}
                    />
                  </div>
                </div>

                {/* Raíz encontrada */}
                {job.resultado && (
                  <div className="mb-8 bg-green-50 rounded-xl p-6 border border-green-100">
                    <h3 className="font-semibold text-green-800 mb-4">
                      Raíz encontrada
                    </h3>
                    <p className="font-mono text-2xl font-bold text-green-600 text-center">
                      {formatNumber(job.resultado, 8)}
                    </p>
                  </div>
                )}

                {/* Gráfica de convergencia */}
                {iterations.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-semibold text-gray-700 mb-4">
                      Gráfica de convergencia
                    </h3>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis
                            dataKey="iteracion"
                            label={{
                              value: "Iteración",
                              position: "bottom",
                              offset: 0,
                            }}
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
                          <Tooltip content={<RaicesTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="error"
                            stroke="#f97316"
                            name="Error"
                            dot={{ r: 3 }}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Tabla de iteraciones para raíces */}
                {iterations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-4">
                      Tabla de iteraciones
                    </h3>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left font-semibold text-gray-600">
                              Iteración
                            </th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-600">
                              Valor (Xi)
                            </th>
                            <th className="px-6 py-3 text-left font-semibold text-gray-600">
                              Error
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {iterations.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-blue-50/30 transition-colors"
                            >
                              <td className="px-6 py-3 font-mono text-center">
                                {item.iteracion}
                              </td>
                              <td className="px-6 py-3 font-mono break-all">
                                {formatRaiz(item)}
                              </td>
                              <td className="px-6 py-3 font-mono">
                                {formatNumber(item.error)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-xs text-gray-400 text-right py-3 px-6 border-t border-gray-100">
                        Total de iteraciones: {iterations.length}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Gauss-Seidel: Gráfica de error */}
            {esGaussSeidel && convergenceData.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Decaimiento del error
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={convergenceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="iteracion"
                        label={{ value: "Iteración", position: "bottom" }}
                        domain={[0, "auto"]}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        label={{
                          value: "Error (%)",
                          angle: -90,
                          position: "insideLeft",
                        }}
                        scale="log"
                        domain={["auto", "auto"]}
                        tickFormatter={(value) => value.toExponential(2)}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<ErrorTooltipSeidel />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="e1"
                        stroke="#3b82f6"
                        name={`εₐ₁% (${variables[0]})`}
                        dot={{ r: 3 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="e2"
                        stroke="#10b981"
                        name={`εₐ₂% (${variables[1]})`}
                        dot={{ r: 3 }}
                        strokeWidth={2}
                      />
                      {variables.length > 2 && (
                        <Line
                          type="monotone"
                          dataKey="e3"
                          stroke="#f59e0b"
                          name={`εₐ₃% (${variables[2]})`}
                          dot={{ r: 3 }}
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gauss-Seidel: Gráfica de convergencia de variables */}
            {esGaussSeidel && convergenceData.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Convergencia de las variables
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={convergenceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="iteracion"
                        label={{ value: "Iteración", position: "bottom" }}
                        domain={[0, "auto"]}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        label={{
                          value: "Valor",
                          angle: -90,
                          position: "insideLeft",
                        }}
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<VariablesTooltipSeidel />} />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        wrapperStyle={{ fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="x1"
                        stroke="#3b82f6"
                        name={variables[0]}
                        dot={{ r: 3 }}
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="x2"
                        stroke="#10b981"
                        name={variables[1]}
                        dot={{ r: 3 }}
                        strokeWidth={2}
                      />
                      {variables.length > 2 && (
                        <Line
                          type="monotone"
                          dataKey="x3"
                          stroke="#f59e0b"
                          name={variables[2]}
                          dot={{ r: 3 }}
                          strokeWidth={2}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gauss-Seidel: Tabla de iteraciones */}
            {esGaussSeidel && iterations.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">
                  Tabla de iteraciones
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          Iteración
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          {variables[0]}
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          {variables[1]}
                        </th>
                        {variables.length > 2 && (
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">
                            {variables[2]}
                          </th>
                        )}
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          εₐ₁%
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">
                          εₐ₂%
                        </th>
                        {variables.length > 2 && (
                          <th className="px-4 py-3 text-left font-semibold text-gray-600">
                            εₐ₃%
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {iterations.map((item, idx) => {
                        let x1: number | null = null,
                          x2: number | null = null,
                          x3: number | null = null;
                        let e1: number | null = null,
                          e2: number | null = null,
                          e3: number | null = null;

                        if (item.vectorX) {
                          try {
                            const vector =
                              typeof item.vectorX === "string"
                                ? JSON.parse(item.vectorX)
                                : item.vectorX;
                            if (Array.isArray(vector)) {
                              x1 = vector[0];
                              x2 = vector[1];
                              x3 = vector[2];
                            }
                          } catch {}
                        }

                        if (item.erroresIndividuales) {
                          try {
                            const errores =
                              typeof item.erroresIndividuales === "string"
                                ? JSON.parse(item.erroresIndividuales)
                                : item.erroresIndividuales;
                            if (Array.isArray(errores)) {
                              e1 = errores[0];
                              e2 = errores[1];
                              e3 = errores[2];
                            }
                          } catch {}
                        }

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-blue-50/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-center">
                              {item.iteracion}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {x1 !== null ? formatNumber(x1, 6) : "-"}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {x2 !== null ? formatNumber(x2, 6) : "-"}
                            </td>
                            {variables.length > 2 && (
                              <td className="px-4 py-3 font-mono">
                                {x3 !== null ? formatNumber(x3, 6) : "-"}
                              </td>
                            )}
                            <td className="px-4 py-3 font-mono">
                              {e1 !== null ? formatNumber(e1, 4) + "%" : "-"}
                            </td>
                            <td className="px-4 py-3 font-mono">
                              {e2 !== null ? formatNumber(e2, 4) + "%" : "-"}
                            </td>
                            {variables.length > 2 && (
                              <td className="px-4 py-3 font-mono">
                                {e3 !== null ? formatNumber(e3, 4) + "%" : "-"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-400 text-sm py-4 border-t border-gray-200">
          <p>
            PolyMath - Métodos Numéricos | Arquitectura Híbrida con Docker,
            Redis y SQL Server
          </p>
        </footer>
      </div>
    </div>
  );
}

export default JobDetail;
