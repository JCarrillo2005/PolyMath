import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createMatrixComparison,
  getMatrixComparison,
} from "../services/matrixComparison";
import type {
  MatrixComparisonResult,
  MatrixStep,
} from "../services/matrixComparison";

type ComparisonStatus = "idle" | "creating" | "polling" | "complete" | "error";

// Función para crear matriz vacía 3x4
function crearMatrizVacia(): string[][] {
  return Array.from({ length: 3 }, () => Array(4).fill(""));
}

// Función para convertir matriz a string
function convertirMatrizAString(matrixValues: string[][]): string {
  return matrixValues.map((fila) => fila.join(",")).join(";");
}

// Función para parsear la solución y extraer x, y, z
function parseSolucion(
  solucion: string | undefined,
): { x: number; y: number; z: number } | null {
  if (!solucion) return null;
  try {
    const match = solucion.match(/\[(.*)\]/);
    if (match) {
      const valores = match[1].split(",").map((v) => parseFloat(v));
      if (valores.length >= 3) {
        return {
          x: valores[0],
          y: valores[1],
          z: valores[2],
        };
      }
    }
  } catch (e) {
    console.error("Error parsing solution:", e);
  }
  return null;
}

// Componente para mostrar una matriz en tabla HTML
function MatrixDisplay({
  matriz,
  title,
}: {
  matriz: number[][];
  title?: string;
}) {
  if (!matriz || matriz.length === 0) return null;

  return (
    <div className="overflow-x-auto">
      {title && (
        <p className="text-xs font-medium text-gray-500 mb-2">{title}</p>
      )}
      <table className="min-w-full text-xs">
        <tbody>
          {matriz.map((fila, i) => (
            <tr key={i}>
              {fila.map((valor, j) => (
                <td key={j} className="px-2 py-1 font-mono text-center">
                  {valor.toFixed(4)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Componente para visualizar pasos de un método
function MethodStepsViewer({
  method,
  steps,
  solucion,
  tiempoMs,
  convergio,
  estado,
  errorMsg,
}: {
  method: string;
  steps: MatrixStep[];
  solucion?: string;
  tiempoMs?: number;
  convergio: boolean;
  estado: string;
  errorMsg?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const nombreMetodo =
    method === "gauss" ? "Eliminación Gaussiana" : "Gauss-Jordan";

  if (estado === "FAILED") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-800">{nombreMetodo}</h3>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Falló
          </span>
        </div>
        <p className="text-sm text-red-600">
          {errorMsg || "Error en la ejecución"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-800">{nombreMetodo}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {steps.length} pasos • {tiempoMs} ms
            </p>
          </div>
          <div className="flex gap-2">
            {convergio && solucion && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Solución: {solucion}
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
            >
              {expanded ? "Ocultar pasos" : "Ver pasos"}
            </button>
          </div>
        </div>
      </div>

      {expanded && steps.length > 0 && (
        <div className="p-4">
          {/* Selector de paso */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paso a paso ({steps.length} pasos)
            </label>
            <input
              type="range"
              min={0}
              max={steps.length - 1}
              value={currentStep}
              onChange={(e) => setCurrentStep(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Paso 1</span>
              <span>Paso {currentStep + 1}</span>
              <span>Paso {steps.length}</span>
            </div>
          </div>

          {/* Paso actual */}
          {steps[currentStep] && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">
                {steps[currentStep].descripcion || `Paso ${currentStep + 1}`}
                {steps[currentStep].factor !== undefined && (
                  <span className="ml-2 text-xs text-gray-500">
                    (factor: {steps[currentStep].factor?.toFixed(4)})
                  </span>
                )}
              </p>
              {steps[currentStep].matriz && (
                <MatrixDisplay matriz={steps[currentStep].matriz} />
              )}
            </div>
          )}

          {/* Navegación de pasos */}
          <div className="flex justify-between gap-2 mt-4">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition"
            >
              ← Anterior
            </button>
            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              disabled={currentStep === steps.length - 1}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente principal
export function CompareMatrices() {
  const navigate = useNavigate();
  const { comparisonId: urlComparisonId } = useParams<{
    comparisonId: string;
  }>();
  const isViewMode = !!urlComparisonId;

  const [comparisonId, setComparisonId] = useState<string | null>(
    urlComparisonId || null,
  );
  const [status, setStatus] = useState<ComparisonStatus>(
    urlComparisonId ? "complete" : "idle",
  );
  const [result, setResult] = useState<MatrixComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [matrixValues, setMatrixValues] =
    useState<string[][]>(crearMatrizVacia());

  const variables = ["x", "y", "z"];
  const matrixSize = 3;

  // Cargar comparación guardada
  useEffect(() => {
    if (urlComparisonId) {
      loadSavedComparison(urlComparisonId);
    }
  }, [urlComparisonId]);

  const loadSavedComparison = async (id: string) => {
    try {
      setStatus("polling");
      const data = await getMatrixComparison(id);
      setResult(data);
      setStatus("complete");
    } catch (err) {
      console.error("Error cargando comparación:", err);
      setError("No se pudo cargar la comparación guardada");
      setStatus("error");
    }
  };

  const handleMatrixChange = (row: number, col: number, value: string) => {
    const nuevaMatriz = matrixValues.map((fila) => [...fila]);
    nuevaMatriz[row][col] = value;
    setMatrixValues(nuevaMatriz);
  };

  const validarMatriz = (): boolean => {
    for (const fila of matrixValues) {
      for (const valor of fila) {
        if (valor === "" || isNaN(parseFloat(valor))) {
          setError(
            "Complete todos los campos de la matriz con valores numéricos",
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarMatriz()) return;

    setLoading(true);
    setError(null);
    setStatus("creating");

    try {
      const matrixString = convertirMatrizAString(matrixValues);
      const response = await createMatrixComparison(matrixString);
      setComparisonId(response.comparisonId);
      setStatus("polling");
      startPolling(response.comparisonId);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear comparación",
      );
      setStatus("idle");
      setLoading(false);
    }
  };

  const startPolling = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const data = await getMatrixComparison(id);
        const allDone = data.resultados.every(
          (r) => r.estado === "DONE" || r.estado === "FAILED",
        );

        if (allDone) {
          clearInterval(interval);
          setResult(data);
          setStatus("complete");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error polling:", err);
      }
    }, 3000);

    setTimeout(() => {
      clearInterval(interval);
      if (status === "polling") {
        setError("Tiempo de espera agotado");
        setStatus("error");
        setLoading(false);
      }
    }, 60000);
  };

  const getStatusBadge = (estado: string, convergio: boolean) => {
    if (estado === "DONE") {
      return convergio ? (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Completado
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          No convergió
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Falló
      </span>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-500">Ejecutando métodos de matrices...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isViewMode
                ? "Detalle de Comparación de Matrices"
                : "Comparación de Matrices"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isViewMode
                ? "Resultados guardados de una comparación anterior"
                : "Ejecuta Gauss y Gauss-Jordan sobre la misma matriz"}
            </p>
          </div>
          <div className="flex gap-3">
            {isViewMode && (
              <button
                onClick={() => navigate("/compare-matrices")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
              >
                Nueva Comparación
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
            >
              Volver al inicio
            </button>
          </div>
        </div>

        {/* Formulario - solo en modo creación */}
        {!isViewMode && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 mb-8">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">
                Matriz Aumentada
              </h2>
              <p className="text-blue-200 text-sm mt-1">
                Ingrese una matriz 3x4 (última columna es el vector de
                resultados)
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-3">
                {matrixValues.map((fila, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex flex-wrap items-center gap-2 justify-center"
                  >
                    {variables.map((variable, colIndex) => (
                      <div key={colIndex} className="flex items-center gap-2">
                        <input
                          type="number"
                          step="any"
                          value={fila[colIndex]}
                          onChange={(e) =>
                            handleMatrixChange(
                              rowIndex,
                              colIndex,
                              e.target.value,
                            )
                          }
                          className="w-20 border border-gray-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-blue-500 transition"
                          placeholder="0"
                        />
                        <span className="font-medium">{variable}</span>
                        {colIndex < variables.length - 1 && (
                          <span className="text-gray-400">+</span>
                        )}
                      </div>
                    ))}
                    <span className="font-bold text-gray-500 mx-2">=</span>
                    <input
                      type="number"
                      step="any"
                      value={fila[matrixSize]}
                      onChange={(e) =>
                        handleMatrixChange(rowIndex, matrixSize, e.target.value)
                      }
                      className="w-20 border border-gray-200 rounded-lg p-2 text-center focus:ring-2 focus:ring-blue-500 transition"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 text-center">
                Ejemplo: 2x + y - z = 8 → [2, 1, -1, 8]
              </p>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? "Procesando..." : "Comparar Métodos"}
              </button>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Resultados */}
        <div className="space-y-6">
          {(status === "creating" || status === "polling") && !result && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <LoadingSpinner />
              <p className="text-gray-500 mt-4">
                ID de comparación: {comparisonId}
              </p>
            </div>
          )}

          {result && (
            <>
              {/* Resumen con ID completo y botón copiar */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Parámetros de la comparación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Matriz original:</span>
                    <pre className="text-xs font-mono bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                      {result.matrizOriginal.replace(/;/g, "\n")}
                    </pre>
                  </div>
                  <div>
                    <div className="mb-3">
                      <span className="text-gray-500">Métodos:</span>
                      <p className="font-mono">Gauss y Gauss-Jordan</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Comparison ID:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-gray-500 break-all">
                          {result.comparisonId}
                        </code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(result.comparisonId);
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 bg-gray-100 rounded transition"
                          title="Copiar ID completo"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Solución del sistema (valores individuales) */}
              {(() => {
                const solucionData = result.resultados.find((r) => r.solucion);
                const solucion = parseSolucion(solucionData?.solucion);

                if (solucion) {
                  return (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <h3 className="font-semibold text-blue-800 mb-4">
                        Solución del sistema
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <span className="text-gray-500 text-sm">x</span>
                          <p className="font-mono text-xl font-bold text-blue-600">
                            {solucion.x.toFixed(6)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <span className="text-gray-500 text-sm">y</span>
                          <p className="font-mono text-xl font-bold text-blue-600">
                            {solucion.y.toFixed(6)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <span className="text-gray-500 text-sm">z</span>
                          <p className="font-mono text-xl font-bold text-blue-600">
                            {solucion.z.toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Comparación lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {result.resultados.map((r) => (
                  <MethodStepsViewer
                    key={r.metodo}
                    method={r.metodo}
                    steps={r.pasos}
                    solucion={r.solucion}
                    tiempoMs={r.tiempoEjecucionMs}
                    convergio={r.convergio}
                    estado={r.estado}
                    errorMsg={r.errorMensaje}
                  />
                ))}
              </div>

              {/* Tabla comparativa */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700">
                    Resultados comparativos
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">
                          Método
                        </th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-600">
                          Solución
                        </th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-600">
                          Pasos
                        </th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-600">
                          Tiempo
                        </th>
                        <th className="px-6 py-3 text-center font-semibold text-gray-600">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {result.resultados.map((r) => (
                        <tr key={r.metodo} className="hover:bg-blue-50/30">
                          <td className="px-6 py-4 font-medium capitalize">
                            {r.metodo === "gauss"
                              ? "Eliminación Gaussiana"
                              : "Gauss-Jordan"}
                          </td>
                          <td className="px-6 py-4 font-mono text-sm">
                            {r.solucion || "-"}
                          </td>
                          <td className="px-6 py-4 text-center font-mono">
                            {r.numeroPasos || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.tiempoEjecucionMs
                              ? `${r.tiempoEjecucionMs} ms`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {getStatusBadge(r.estado, r.convergio)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones para ver detalles individuales */}
              <div className="flex gap-3 justify-end">
                {result.resultados.map((r) => (
                  <button
                    key={r.metodo}
                    onClick={() => navigate(`/job/${r.jobId}`)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                  >
                    Ver detalle de{" "}
                    {r.metodo === "gauss" ? "Gauss" : "Gauss-Jordan"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
