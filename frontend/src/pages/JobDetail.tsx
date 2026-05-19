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
  Legend,
} from "recharts";

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
  value: number | string | undefined,
  decimals: number = 8,
): string {
  if (value === undefined || value === null) return "-";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toFixed(decimals);
}

function convertirMatrizAEcuaciones(parametrosJson: string): string {
  try {
    const params = JSON.parse(parametrosJson);
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

function extraerVectorSolucion(resultado: string): number[] | null {
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

// ==================== GAUSS-SEIDEL: EXTRACCIÓN DE DATOS ====================
function extraerDatosConvergencia(iterations: any[]) {
  const datos = [
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
    let vector = null;
    let errores = null;

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

// ==================== TOOLTIPS PARA GAUSS-SEIDEL ====================
const ErrorTooltipSeidel = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold mb-1">Iteración: {label}</p>
        {payload.map((item: any, idx: number) => (
          <p key={idx} style={{ color: item.color }}>
            <span className="font-semibold">{item.name}:</span>{" "}
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

const VariablesTooltipSeidel = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm">
        <p className="font-bold mb-1">Iteración: {label}</p>
        {payload.map((item: any, idx: number) => (
          <p key={idx} style={{ color: item.color }}>
            <span className="font-semibold">{item.name}:</span>{" "}
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

// ==================== TOOLTIP PARA RAÍCES ====================
const RaicesTooltip = ({ active, payload }: any) => {
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

function JobDetail() {
  const { jobId } = useParams();
  const [job, setJob] = useState<any>(null);
  const [iterations, setIterations] = useState<any[]>([]);

  useEffect(() => {
    if (!jobId) return;

    const loadData = async () => {
      try {
        const jobData = await getJob(jobId);
        setJob(jobData);

        if (jobData.estado === "DONE") {
          const iterationData = await getIterations(jobId);
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

  const esMetodoLineal = ["gauss", "gaussJordan", "gaussSeidel"].includes(
    job.metodo,
  );
  const esGaussSeidel = job.metodo === "gaussSeidel";
  const vectorSolucion = extraerVectorSolucion(job.resultado);
  const variables = vectorSolucion?.length === 2 ? ["x", "y"] : ["x", "y", "z"];

  // Datos para Gauss-Seidel
  const convergenceData = extraerDatosConvergencia(iterations);

  // Datos para gráfica de raíces
  const chartData = iterations.map((item) => ({
    iteracion: item.iteracion,
    error: item.error,
    raiz: item.xi,
    raizTexto: item.xi ? formatNumber(item.xi) : "-",
  }));

  const formatRaiz = (item: any) => {
    if (item.xi !== undefined && item.xi !== null) return formatNumber(item.xi);
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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="border-2 border-dashed border-gray-500 rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Resultado del método {job.metodo}
        </h1>

        {/* INFORMACIÓN GENERAL */}
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
                  ? "No"
                  : "Pendiente"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Resultado final</p>
            <p className="font-mono text-lg break-all">
              {job.resultado || "-"}
            </p>
          </div>
        </div>

        {/* SISTEMA DE ECUACIONES (para métodos lineales) */}
        {esMetodoLineal && (
          <div className="mb-8">
            <p className="font-bold mb-2">Sistema de ecuaciones:</p>
            <div className="bg-gray-100 p-4 rounded-lg text-center overflow-x-auto">
              <BlockMath
                math={convertirMatrizAEcuaciones(job.parametrosJson)}
              />
            </div>
          </div>
        )}

        {/* SOLUCIÓN FINAL (para métodos lineales) */}
        {esMetodoLineal && vectorSolucion && (
          <div className="mb-8 bg-blue-50 p-4 rounded-lg">
            <p className="font-bold mb-2 text-lg">Solución del sistema:</p>
            <div className="space-y-2 font-mono text-lg">
              {vectorSolucion.map((valor, idx) => (
                <p key={idx}>
                  <span className="font-bold">{variables[idx]}</span> ={" "}
                  {formatNumber(valor, 2)}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* ==================== MÉTODOS DE RAÍCES ==================== */}
        {!esMetodoLineal && (
          <>
            <div className="mb-8">
              <p className="font-bold mb-2">Función:</p>
              <div className="bg-gray-100 p-4 rounded-lg text-center overflow-x-auto">
                <BlockMath math={"f(x) = " + convertirALaTeX(job.funcion)} />
              </div>
            </div>

            {job.resultado && (
              <div className="mb-8 bg-blue-50 p-4 rounded-lg">
                <p className="font-bold mb-2 text-lg">Raíz encontrada:</p>
                <p className="font-mono text-xl">
                  {formatNumber(job.resultado, 8)}
                </p>
              </div>
            )}

            {/* GRÁFICA DE RAÍCES */}
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
                      <Tooltip content={<RaicesTooltip />} />
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

            {/* TABLA DE RAÍCES */}
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
                        <th className="p-3 border text-left">Valor (Xi)</th>
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
                            {formatNumber(item.error)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-500 mt-2 text-right">
                    Total de iteraciones: {iterations.length}
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* ==================== GAUSS-SEIDEL: DECAIMIENTO DEL ERROR ==================== */}
        {esGaussSeidel && convergenceData.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4 mt-6">
              Decaimiento del error
            </h2>
            <div className="h-80 border rounded-lg p-4 bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={convergenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="iteracion"
                    label={{
                      value: "Iteración",
                      position: "insideBottom",
                      offset: -5,
                    }}
                    domain={[0, "auto"]}
                    height={50}
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
                    stroke="#8884d8"
                    name={`εₐ₁% (${variables[0]})`}
                    dot={{ r: 3 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="e2"
                    stroke="#82ca9d"
                    name={`εₐ₂% (${variables[1]})`}
                    dot={{ r: 3 }}
                    strokeWidth={2}
                  />
                  {variables.length > 2 && (
                    <Line
                      type="monotone"
                      dataKey="e3"
                      stroke="#ffc658"
                      name={`εₐ₃% (${variables[2]})`}
                      dot={{ r: 3 }}
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ==================== GAUSS-SEIDEL: CONVERGENCIA DE VARIABLES ==================== */}
        {esGaussSeidel && convergenceData.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4 mt-8">
              Convergencia de las variables
            </h2>
            <div className="h-80 border rounded-lg p-4 bg-white">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={convergenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="iteracion"
                    label={{
                      value: "Iteración",
                      position: "insideBottom",
                      offset: -5,
                    }}
                    domain={[0, "auto"]}
                    height={50}
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
                    stroke="#8884d8"
                    name={variables[0]}
                    dot={{ r: 3 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="x2"
                    stroke="#82ca9d"
                    name={variables[1]}
                    dot={{ r: 3 }}
                    strokeWidth={2}
                  />
                  {variables.length > 2 && (
                    <Line
                      type="monotone"
                      dataKey="x3"
                      stroke="#ffc658"
                      name={variables[2]}
                      dot={{ r: 3 }}
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* ==================== GAUSS-SEIDEL: TABLA ===================== */}
        {esGaussSeidel && iterations.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4 mt-8">
              Tabla de iteraciones
            </h2>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 border text-left">Iteración</th>
                    <th className="p-3 border text-left">{variables[0]}</th>
                    <th className="p-3 border text-left">{variables[1]}</th>
                    {variables.length > 2 && (
                      <th className="p-3 border text-left">{variables[2]}</th>
                    )}
                    <th className="p-3 border text-left">εₐ₁%</th>
                    <th className="p-3 border text-left">εₐ₂%</th>
                    {variables.length > 2 && (
                      <th className="p-3 border text-left">εₐ₃%</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {iterations.map((item, idx) => {
                    let x1 = null,
                      x2 = null,
                      x3 = null;
                    let e1 = null,
                      e2 = null,
                      e3 = null;

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
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="p-3 border font-mono text-center">
                          {item.iteracion}
                        </td>
                        <td className="p-3 border font-mono">
                          {x1 !== null ? formatNumber(x1, 6) : "-"}
                        </td>
                        <td className="p-3 border font-mono">
                          {x2 !== null ? formatNumber(x2, 6) : "-"}
                        </td>
                        {variables.length > 2 && (
                          <td className="p-3 border font-mono">
                            {x3 !== null ? formatNumber(x3, 6) : "-"}
                          </td>
                        )}
                        <td className="p-3 border font-mono">
                          {e1 !== null ? formatNumber(e1, 4) + "%" : "-"}
                        </td>
                        <td className="p-3 border font-mono">
                          {e2 !== null ? formatNumber(e2, 4) + "%" : "-"}
                        </td>
                        {variables.length > 2 && (
                          <td className="p-3 border font-mono">
                            {e3 !== null ? formatNumber(e3, 4) + "%" : "-"}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default JobDetail;
