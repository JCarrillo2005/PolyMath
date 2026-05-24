import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ComparisonChart } from "../components/ComparisonChart";
import type { IterationData } from "../components/ComparisonChart";
import { createComparison, getComparisonResult } from "../services/comparison";
import type { ComparisonResult, MethodResult } from "../services/comparison";
import { getComparisonJobIterations } from "../services/comparisonIterations";
import { getComparisonById } from "../services/comparisonHistory";
import type { ComparisonHistoryItem } from "../services/comparisonHistory";

type ComparisonStatus = "idle" | "creating" | "polling" | "complete" | "error";

// Función para formatear números
function formatNumber(
  value: number | null | undefined,
  decimals: number = 8,
): string {
  if (value === null || value === undefined) return "-";
  return value.toFixed(decimals);
}

// Función para validar la función matemática
function validarFuncion(funcion: string): { isValid: boolean; error?: string } {
  if (!funcion || funcion.trim() === "") {
    return { isValid: false, error: "La función no puede estar vacía" };
  }

  const funcionTrim = funcion.trim();

  // Caracteres permitidos: números, operadores, x, funciones matemáticas, espacios, paréntesis
  const patronPermitido = /^[a-zA-Z0-9+\-*/^()., πe\s]+$/;
  if (!patronPermitido.test(funcionTrim)) {
    return {
      isValid: false,
      error: "La función contiene caracteres no permitidos",
    };
  }

  // Validar paréntesis balanceados
  let balance = 0;
  for (const char of funcionTrim) {
    if (char === "(") balance++;
    if (char === ")") balance--;
    if (balance < 0) {
      return { isValid: false, error: "Paréntesis no balanceados" };
    }
  }
  if (balance !== 0) {
    return { isValid: false, error: "Paréntesis no balanceados" };
  }

  // Lista de funciones matemáticas válidas
  const funcionesValidas = [
    "sin",
    "cos",
    "tan",
    "asin",
    "acos",
    "atan",
    "sinh",
    "cosh",
    "tanh",
    "exp",
    "log",
    "ln",
    "sqrt",
    "abs",
    "pi",
    "e",
  ];

  // Detectar palabras que no sean funciones válidas (como "ww")
  const palabras = funcionTrim.match(/[a-zA-Z]+/g);
  if (palabras) {
    for (const palabra of palabras) {
      if (
        !funcionesValidas.includes(palabra.toLowerCase()) &&
        palabra !== "x"
      ) {
        return {
          isValid: false,
          error: `"${palabra}" no es una función matemática válida`,
        };
      }
    }
  }

  return { isValid: true };
}

// Función para formatear la función (igual que en CreateJob)
function convertirFuncion(funcion: string): string {
  let converted = funcion
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    .replace(/\^/g, "**")
    .replace(/sen\(/g, "sin(")
    .replace(/ln\(/g, "log(")
    .replace(/pi/g, "pi");

  converted = converted.replace(/e\*\*-([a-zA-Z0-9]+)/g, "exp(-$1)");
  converted = converted.replace(/e\^-([a-zA-Z0-9]+)/g, "exp(-$1)");
  converted = converted.replace(/e\^([a-zA-Z0-9()]+)/g, "exp($1)");

  return converted;
}

// Botones para insertar funciones
const functionButtons = [
  { label: "exp(x)", value: "exp(x)" },
  { label: "pi", value: "pi" },
  { label: "sin(x)", value: "sin(x)" },
  { label: "cos(x)", value: "cos(x)" },
  { label: "tan(x)", value: "tan(x)" },
  { label: "ln(x)", value: "log(x)" },
];

export function CompareRoots() {
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
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [chartData, setChartData] = useState<IterationData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [funcionError, setFuncionError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<
    typeof setInterval
  > | null>(null);

  // Estado del formulario (solo usado en modo creación)
  const [formData, setFormData] = useState({
    tolerancia: 0.0001,
    maxIteraciones: 100,
    metodos: {
      newton: true,
      secante: true,
      muller: true,
    },
  });

  // Cargar comparación guardada si hay ID en URL
  useEffect(() => {
    if (urlComparisonId) {
      loadSavedComparison(urlComparisonId);
    }
  }, [urlComparisonId]);

  const loadSavedComparison = async (id: string) => {
    try {
      setStatus("polling");
      const savedComparison = await getComparisonById(id);

      // Cargar iteraciones y datos completos para cada job
      const resultadosConDetalles = await Promise.all(
        savedComparison.jobs.map(async (job) => {
          let iteraciones = 0;
          let errorFinal = null;

          if (job.estado === "DONE" && job.jobId && job.converged) {
            try {
              const iterations = await getComparisonJobIterations(job.jobId);
              if (Array.isArray(iterations) && iterations.length > 0) {
                iteraciones = iterations.length;
                // El error final es el error de la última iteración
                const lastIteration = iterations[iterations.length - 1];
                errorFinal =
                  lastIteration.error !== undefined &&
                  lastIteration.error !== null
                    ? Number(lastIteration.error)
                    : null;
              }
            } catch (err) {
              console.error(
                `Error cargando iteraciones de ${job.metodo}:`,
                err,
              );
            }
          }

          return {
            metodo: job.metodo,
            jobId: job.jobId,
            raiz: job.resultado,
            iteraciones: iteraciones,
            errorFinal: errorFinal,
            convergio: job.converged,
            tiempoEjecucionMs: job.tiempoEjecucionMs,
            estado: job.estado,
            errorMensaje: job.errorMensaje || null,
          };
        }),
      );

      // Cargar datos para la gráfica
      await loadIterationDataFromJobs(savedComparison.jobs);

      // Transformar a formato de resultado
      const transformedResult: ComparisonResult = {
        comparisonId: savedComparison.comparisonId,
        parametrosComunes: {
          funcion: savedComparison.funcion,
          tolerancia: savedComparison.tolerancia,
          maxIteraciones: savedComparison.maxIteraciones,
        },
        resultados: resultadosConDetalles,
        creadoEn: savedComparison.creadoEn,
      };

      setResult(transformedResult);
      setStatus("complete");
    } catch (err) {
      console.error("Error cargando comparación guardada:", err);
      setError("No se pudo cargar la comparación guardada");
      setStatus("error");
    }
  };
  const loadIterationDataFromJobs = async (
    jobs: ComparisonHistoryItem["jobs"],
  ) => {
    const iterationsMap: Map<number, IterationData> = new Map();

    for (const job of jobs) {
      if (job.estado === "DONE" && job.jobId && job.converged) {
        try {
          const iterations = await getComparisonJobIterations(job.jobId);
          if (Array.isArray(iterations)) {
            iterations.forEach((it: any) => {
              const iterNum = it.iteracion;
              if (!iterationsMap.has(iterNum)) {
                iterationsMap.set(iterNum, {
                  iteracion: iterNum,
                  newton: null,
                  secante: null,
                  muller: null,
                });
              }
              const dataPoint = iterationsMap.get(iterNum)!;
              const errorValue =
                it.error !== undefined && it.error !== null
                  ? Number(it.error)
                  : null;
              dataPoint[job.metodo as keyof IterationData] = errorValue;
            });
          }
        } catch (err) {
          console.error(`Error cargando iteraciones de ${job.metodo}:`, err);
        }
      }
    }

    const sortedData = Array.from(iterationsMap.values()).sort(
      (a, b) => a.iteracion - b.iteracion,
    );
    setChartData(sortedData);
  };

  // Verificar cuántos métodos están seleccionados
  const metodosSeleccionadosCount = Object.values(formData.metodos).filter(
    Boolean,
  ).length;
  const isMinMetodosValid = metodosSeleccionadosCount >= 2;

  // Verificar qué campos están habilitados según métodos seleccionados
  const isNewtonSelected = formData.metodos.newton;
  const isSecanteSelected = formData.metodos.secante;
  const isMullerSelected = formData.metodos.muller;

  const isX0Enabled = isNewtonSelected || isSecanteSelected || isMullerSelected;
  const isX1Enabled = isSecanteSelected || isMullerSelected;
  const isX2Enabled = isMullerSelected;

  // Validar que todos los campos requeridos estén llenos
  const isFormValid = () => {
    if (!formData.funcion || formData.funcion.trim() === "") return false;
    const validation = validarFuncion(formData.funcion);
    if (!validation.isValid) return false;
    if (
      isX0Enabled &&
      (formData.x0 === undefined || formData.x0 === null || isNaN(formData.x0))
    )
      return false;
    if (
      isX1Enabled &&
      (formData.x1 === undefined || formData.x1 === null || isNaN(formData.x1))
    )
      return false;
    if (
      isX2Enabled &&
      (formData.x2 === undefined || formData.x2 === null || isNaN(formData.x2))
    )
      return false;
    if (
      formData.tolerancia === undefined ||
      formData.tolerancia === null ||
      isNaN(formData.tolerancia)
    )
      return false;
    if (
      formData.maxIteraciones === undefined ||
      formData.maxIteraciones === null ||
      isNaN(formData.maxIteraciones)
    )
      return false;
    return true;
  };

  // Manejar cambio de función con validación en tiempo real
  const handleFuncionChange = (value: string) => {
    setFormData({ ...formData, funcion: value });
    if (value.trim() !== "") {
      const validation = validarFuncion(value);
      if (!validation.isValid) {
        setFuncionError(validation.error || "Función inválida");
      } else {
        setFuncionError(null);
      }
    } else {
      setFuncionError(null);
    }
  };

  // Función para toggle de métodos
  const toggleMetodo = (metodo: "newton" | "secante" | "muller") => {
    const nuevosMetodos = {
      ...formData.metodos,
      [metodo]: !formData.metodos[metodo],
    };
    const nuevosSeleccionados =
      Object.values(nuevosMetodos).filter(Boolean).length;

    if (formData.metodos[metodo] === true && nuevosSeleccionados < 2) {
      setError("Debe seleccionar al menos 2 métodos para comparar");
      return;
    }

    setFormData({ ...formData, metodos: nuevosMetodos });
    setError(null);
  };

  // Insertar texto de función
  const insertarEnFuncion = (texto: string) => {
    const nuevaFuncion = (formData.funcion || "") + texto;
    setFormData((prev) => ({ ...prev, funcion: nuevaFuncion }));
    const validation = validarFuncion(nuevaFuncion);
    if (!validation.isValid && nuevaFuncion.trim() !== "") {
      setFuncionError(validation.error || "Función inválida");
    } else {
      setFuncionError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validarFuncion(formData.funcion);
    if (!validation.isValid) {
      setError(validation.error || "La función ingresada no es válida");
      return;
    }

    if (!isFormValid()) {
      setError("Complete todos los campos del formulario");
      return;
    }

    setStatus("creating");
    setError(null);

    const metodosSeleccionados = Object.entries(formData.metodos)
      .filter(([, selected]) => selected)
      .map(([key]) => key as "newton" | "secante" | "muller");

    if (metodosSeleccionados.length < 2) {
      setError("Debe seleccionar al menos 2 métodos para comparar");
      setStatus("idle");
      return;
    }

    try {
      const response = await createComparison({
        funcion: convertirFuncion(formData.funcion),
        x0: formData.x0,
        x1: formData.x1,
        x2: formData.x2,
        tolerancia: formData.tolerancia,
        maxIteraciones: formData.maxIteraciones,
        metodos: metodosSeleccionados,
      });

      setComparisonId(response.comparisonId);
      setStatus("polling");
      startPolling(response.comparisonId, metodosSeleccionados);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al crear comparación",
      );
      setStatus("idle");
    }
  };

  const startPolling = async (
    id: string,
    metodos: ("newton" | "secante" | "muller")[],
  ) => {
    const interval = setInterval(async () => {
      try {
        const comparisonResult = await getComparisonResult(id);
        const allDone = comparisonResult.resultados.every(
          (r) => r.estado === "DONE" || r.estado === "FAILED",
        );

        if (allDone) {
          if (pollingInterval) clearInterval(pollingInterval);
          setResult(comparisonResult);
          await loadIterationData(comparisonResult.resultados, metodos);
          setStatus("complete");
        } else {
          setResult(comparisonResult);
        }
      } catch (err) {
        console.error("Error polling:", err);
      }
    }, 3000);

    setPollingInterval(interval);

    setTimeout(() => {
      if (status === "polling") {
        if (interval) clearInterval(interval);
        setError("Tiempo de espera agotado. Algunos jobs no completaron.");
        setStatus("error");
      }
    }, 120000);
  };

  const loadIterationData = async (
    resultados: MethodResult[],
    metodos: ("newton" | "secante" | "muller")[],
  ) => {
    const iterationsMap: Map<number, IterationData> = new Map();

    for (const metodo of metodos) {
      const result = resultados.find((r) => r.metodo === metodo);
      if (
        result &&
        result.estado === "DONE" &&
        result.jobId &&
        result.convergio
      ) {
        try {
          const iterations = await getComparisonJobIterations(result.jobId);
          if (Array.isArray(iterations)) {
            iterations.forEach((it: any) => {
              const iterNum = it.iteracion;
              if (!iterationsMap.has(iterNum)) {
                iterationsMap.set(iterNum, {
                  iteracion: iterNum,
                  newton: null,
                  secante: null,
                  muller: null,
                });
              }
              const dataPoint = iterationsMap.get(iterNum)!;
              const errorValue =
                it.error !== undefined && it.error !== null
                  ? Number(it.error)
                  : null;
              dataPoint[metodo] = errorValue;
            });
          }
        } catch (err) {
          console.error(`Error cargando iteraciones de ${metodo}:`, err);
        }
      }
    }

    const sortedData = Array.from(iterationsMap.values()).sort(
      (a, b) => a.iteracion - b.iteracion,
    );
    setChartData(sortedData);
  };

  const getStatusBadge = (estado: string, convergio: boolean) => {
    if (estado === "DONE") {
      return convergio ? (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Convergio
        </span>
      ) : (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          No convergio
        </span>
      );
    }
    if (estado === "FAILED") {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Fallo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {estado}
      </span>
    );
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-500">Ejecutando metodos numericos...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isViewMode ? "Detalle de Comparación" : "Comparacion de Metodos"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isViewMode
                ? "Resultados guardados de una comparación anterior"
                : "Ejecuta Newton-Raphson, Secante y Muller simultaneamente"}
            </p>
          </div>
          <div className="flex gap-3">
            {isViewMode && (
              <button
                onClick={() => navigate("/compare")}
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario - Solo mostrar en modo creación */}
          {!isViewMode && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 sticky top-8">
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white">
                    Parametros
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Función con botones de ayuda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funcion f(x)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {functionButtons.map((btn) => (
                        <button
                          key={btn.label}
                          type="button"
                          onClick={() => insertarEnFuncion(btn.value)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono transition"
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={formData.funcion}
                      onChange={(e) => handleFuncionChange(e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 ${
                        funcionError
                          ? "border-red-500 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Ingrese la funcion (ej: x**2 - 4, exp(x) + x, sin(x))"
                      required
                    />
                    {funcionError && (
                      <p className="text-xs text-red-500 mt-1">
                        {funcionError}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Usa ** para potencias, exp(x) para eˣ, pi para π
                    </p>
                  </div>

                  {/* Campos x0, x1, x2 */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        x0{" "}
                        <span className="text-gray-400">
                          (Newton, Secante, Muller)
                        </span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.x0}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            x0:
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                          })
                        }
                        disabled={!isX0Enabled}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${
                          !isX0Enabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "focus:ring-2 focus:ring-blue-500"
                        }`}
                        required={isX0Enabled}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        x1{" "}
                        <span className="text-gray-400">(Secante, Muller)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.x1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            x1:
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                          })
                        }
                        disabled={!isX1Enabled}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${
                          !isX1Enabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "focus:ring-2 focus:ring-blue-500"
                        }`}
                        required={isX1Enabled}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        x2 <span className="text-gray-400">(Muller)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.x2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            x2:
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                          })
                        }
                        disabled={!isX2Enabled}
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm ${
                          !isX2Enabled
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "focus:ring-2 focus:ring-blue-500"
                        }`}
                        required={isX2Enabled}
                      />
                    </div>
                  </div>

                  {/* Tolerancia e iteraciones */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Tolerancia
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={formData.tolerancia}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tolerancia:
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Max Iteraciones
                      </label>
                      <input
                        type="number"
                        value={formData.maxIteraciones}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxIteraciones:
                              e.target.value === ""
                                ? undefined
                                : parseInt(e.target.value),
                          })
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Métodos como botones toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metodos a comparar (minimo 2)
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => toggleMetodo("newton")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          formData.metodos.newton
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Newton-Raphson
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMetodo("secante")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          formData.metodos.secante
                            ? "bg-green-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Secante
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleMetodo("muller")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          formData.metodos.muller
                            ? "bg-orange-600 text-white shadow-md"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Muller
                      </button>
                    </div>
                    {!isMinMetodosValid && (
                      <p className="text-xs text-red-500 mt-2">
                        Debe seleccionar al menos 2 metodos para comparar
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      status === "creating" ||
                      status === "polling" ||
                      !isMinMetodosValid ||
                      !isFormValid() ||
                      !!funcionError
                    }
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === "creating" && "Creando comparacion..."}
                    {status === "polling" && "Ejecutando..."}
                    {(status === "idle" ||
                      status === "complete" ||
                      status === "error") &&
                      "Comparar Metodos"}
                  </button>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Resultados */}
          <div className={isViewMode ? "lg:col-span-3" : "lg:col-span-2"}>
            {status === "polling" && !result && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <LoadingSpinner />
                <p className="text-gray-500 mt-4">
                  ID de comparacion:{" "}
                  <code className="text-xs">{comparisonId}</code>
                </p>
              </div>
            )}

            {result && (
              <>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Parametros de la comparacion
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Funcion:</span>
                      <code className="block font-mono text-blue-600">
                        {result.parametrosComunes.funcion}
                      </code>
                    </div>
                    <div>
                      <span className="text-gray-500">Tolerancia:</span>
                      <p className="font-mono">
                        {formatNumber(result.parametrosComunes.tolerancia, 6)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Max Iteraciones:</span>
                      <p className="font-mono">
                        {result.parametrosComunes.maxIteraciones}
                      </p>
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
                <ComparisonChart data={chartData} />

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
                            Metodo
                          </th>
                          <th className="px-6 py-3 text-left font-semibold text-gray-600">
                            Raiz
                          </th>
                          <th className="px-6 py-3 text-center font-semibold text-gray-600">
                            Iteraciones
                          </th>
                          <th className="px-6 py-3 text-center font-semibold text-gray-600">
                            Error Final
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
                              {r.metodo === "newton" && "Newton-Raphson"}
                              {r.metodo === "secante" && "Secante"}
                              {r.metodo === "muller" && "Muller"}
                            </td>
                            <td className="px-6 py-4 font-mono text-sm">
                              {r.raiz || "-"}
                            </td>
                            <td className="px-6 py-4 text-center font-mono">
                              {r.iteraciones || "-"}
                            </td>
                            <td className="px-6 py-4 text-center font-mono text-sm">
                              {r.errorFinal !== null &&
                              r.errorFinal !== undefined
                                ? formatNumber(r.errorFinal, 8)
                                : "-"}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {r.tiempoEjecucionMs !== null
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

                <div className="flex gap-3 justify-end">
                  {result.resultados.map((r) => (
                    <button
                      key={r.metodo}
                      onClick={() => navigate(`/job/${r.jobId}`)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
                    >
                      Ver detalle de {r.metodo}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
