import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../services/jobs.ts";

// ==================== INTERFACES TIPADAS ====================

export type MetodoNumerico =
  | "newton"
  | "secante"
  | "muller"
  | "gauss"
  | "gaussSeidel"
  | "gaussJordan";

export interface FormData {
  tolerancia: number;
  maxIteraciones: number;
  funcion?: string;
  x0?: number;
  x1?: number;
  x2?: number;
}

export interface ParametrosNewton {
  funcion: string;
  x0: number;
  tolerancia: number;
  maxIteraciones: number;
}

export interface ParametrosSecante {
  funcion: string;
  x0: number;
  x1: number;
  tolerancia: number;
  maxIteraciones: number;
}

export interface ParametrosMuller {
  funcion: string;
  x0: number;
  x1: number;
  x2: number;
  tolerancia: number;
  maxIteraciones: number;
}

export interface ParametrosGauss {
  matrix: string;
}

export interface ParametrosGaussSeidel {
  matrix: string;
  tolerancia: number;
  maxIteraciones: number;
}

export interface ParametrosGaussJordan {
  matrix: string;
}

export type ParametrosJob =
  | ParametrosNewton
  | ParametrosSecante
  | ParametrosMuller
  | ParametrosGauss
  | ParametrosGaussSeidel
  | ParametrosGaussJordan;

// ==================== FUNCIONES AUXILIARES ====================

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

// Convierte la función ingresada por el usuario a una forma compatible con mathjs.
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

function crearMatrizVacia(size: number): string[][] {
  return Array.from({ length: size }, () => Array(size + 1).fill(""));
}

function validarParentesis(funcion: string): boolean {
  let balance = 0;
  for (const char of funcion) {
    if (char === "(") balance++;
    if (char === ")") balance--;
    if (balance < 0) return false;
  }
  return balance === 0;
}

function validarCampoNumerico(
  valor: string | number | null | undefined,
  nombre: string,
): boolean {
  if (valor === undefined || valor === null || valor === "") {
    alert(`Ingrese un valor válido para ${nombre}`);
    return false;
  }

  const num = typeof valor === "number" ? valor : parseFloat(valor);
  if (isNaN(num)) {
    alert(`${nombre} debe ser un número válido`);
    return false;
  }
  return true;
}

// ==================== COMPONENTE PRINCIPAL ====================

function CreateJob() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<MetodoNumerico | "">("");
  const [formData, setFormData] = useState<FormData>({
    tolerancia: 0.0001,
    maxIteraciones: 100,
    funcion: "",
  });
  const [funcionError, setFuncionError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [matrixValues, setMatrixValues] = useState<string[][]>(
    crearMatrizVacia(3),
  );

  const handleChange = <K extends keyof FormData>(
    key: K,
    value: FormData[K],
  ): void => {
    setFormData({ ...formData, [key]: value });
  };

  // Manejar cambio de función con validación en tiempo real
  const handleFuncionChange = (value: string): void => {
    setFormData({ ...formData, funcion: value });

    // Validar mientras escribe
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

  const insertarEnFuncion = (texto: string): void => {
    const nuevaFuncion = (formData.funcion || "") + texto;
    setFormData((prev) => ({
      ...prev,
      funcion: nuevaFuncion,
    }));

    // Validar después de insertar
    const validation = validarFuncion(nuevaFuncion);
    if (!validation.isValid && nuevaFuncion.trim() !== "") {
      setFuncionError(validation.error || "Función inválida");
    } else {
      setFuncionError(null);
    }
  };

  const handleMatrixChange = (
    row: number,
    col: number,
    value: string,
  ): void => {
    const nuevaMatriz = matrixValues.map((fila) => [...fila]);
    nuevaMatriz[row][col] = value;
    setMatrixValues(nuevaMatriz);
  };

  const convertirMatrizAString = (): string => {
    return matrixValues.map((fila) => fila.join(",")).join(";");
  };

  const validarMatriz = (): boolean => {
    for (const fila of matrixValues) {
      for (const valor of fila) {
        if (valor === "" || isNaN(parseFloat(valor))) {
          alert("Complete todos los campos de la matriz con valores numéricos");
          return false;
        }
      }
    }
    return true;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!method) {
      alert("Por favor seleccione un método antes de enviar el job");
      return;
    }

    const usaFuncion = ["newton", "secante", "muller"].includes(method);

    if (usaFuncion) {
      // Validar función con la nueva validación
      if (!formData.funcion || formData.funcion.trim() === "") {
        alert("Ingrese una función");
        return;
      }

      const validation = validarFuncion(formData.funcion);
      if (!validation.isValid) {
        alert(validation.error || "La función ingresada no es válida");
        return;
      }
    }

    setLoading(true);

    try {
      let parametros: ParametrosJob;

      if (method === "newton") {
        if (!validarCampoNumerico(formData.x0, "x₀")) return;
        parametros = {
          funcion: convertirFuncion(formData.funcion!),
          x0: parseFloat(formData.x0 as unknown as string),
          tolerancia: parseFloat(formData.tolerancia as unknown as string),
          maxIteraciones: parseInt(
            formData.maxIteraciones as unknown as string,
          ),
        } as ParametrosNewton;
      } else if (method === "secante") {
        if (!validarCampoNumerico(formData.x0, "x₀")) return;
        if (!validarCampoNumerico(formData.x1, "x₁")) return;
        parametros = {
          funcion: convertirFuncion(formData.funcion!),
          x0: parseFloat(formData.x0 as unknown as string),
          x1: parseFloat(formData.x1 as unknown as string),
          tolerancia: parseFloat(formData.tolerancia as unknown as string),
          maxIteraciones: parseInt(
            formData.maxIteraciones as unknown as string,
          ),
        } as ParametrosSecante;
      } else if (method === "muller") {
        if (!validarCampoNumerico(formData.x0, "x₀")) return;
        if (!validarCampoNumerico(formData.x1, "x₁")) return;
        if (!validarCampoNumerico(formData.x2, "x₂")) return;
        parametros = {
          funcion: convertirFuncion(formData.funcion!),
          x0: parseFloat(formData.x0 as unknown as string),
          x1: parseFloat(formData.x1 as unknown as string),
          x2: parseFloat(formData.x2 as unknown as string),
          tolerancia: parseFloat(formData.tolerancia as unknown as string),
          maxIteraciones: parseInt(
            formData.maxIteraciones as unknown as string,
          ),
        } as ParametrosMuller;
      } else if (method === "gauss") {
        if (!validarMatriz()) return;
        parametros = { matrix: convertirMatrizAString() } as ParametrosGauss;
      } else if (method === "gaussSeidel") {
        if (!validarMatriz()) return;
        parametros = {
          matrix: convertirMatrizAString(),
          tolerancia: parseFloat(formData.tolerancia as unknown as string),
          maxIteraciones: parseInt(
            formData.maxIteraciones as unknown as string,
          ),
        } as ParametrosGaussSeidel;
      } else if (method === "gaussJordan") {
        if (!validarMatriz()) return;
        parametros = {
          matrix: convertirMatrizAString(),
        } as ParametrosGaussJordan;
      } else {
        throw new Error("Método no soportado");
      }

      const response = await createJob(method, parametros);
      setJobId(response.jobId);
      alert(`Job creado con ID: ${response.jobId}`);
      navigate(`/job/${response.jobId}`);
    } catch (error: unknown) {
      console.error("Error completo:", error);
      const err = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      alert(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al crear el job",
      );
    } finally {
      setLoading(false);
    }
  };

  const esMetodoMatriz = ["gauss", "gaussSeidel", "gaussJordan"].includes(
    method,
  );
  const variables = ["x", "y", "z"];
  const matrixSize = 3;

  const formatearNombreMetodo = (metodo: MetodoNumerico): string => {
    const nombres: Record<MetodoNumerico, string> = {
      newton: "Newton-Raphson",
      secante: "Secante",
      muller: "Müller",
      gauss: "Eliminación Gaussiana",
      gaussSeidel: "Gauss-Seidel",
      gaussJordan: "Gauss-Jordan",
    };
    return nombres[metodo];
  };

  const estaDeshabilitado = (): boolean => {
    if (loading) return true;
    const usaFuncion = ["newton", "secante", "muller"].includes(method);
    if (usaFuncion) {
      if (funcionError) return true;
      if (!formData.funcion || formData.funcion.trim() === "") return true;
    }
    return false;
  };

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

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con navegación */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PolyMath</h1>
            <p className="text-gray-500 text-sm mt-1">Crear nuevo job</p>
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
          {/* Cabecera con gradiente */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-8 py-6">
            <h2 className="text-xl font-semibold text-white">Nuevo Job</h2>
            <p className="text-blue-200 text-sm mt-1">
              Complete los parámetros del método numérico
            </p>
          </div>

          <div className="p-8">
            {/* Selector de método */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método numérico
              </label>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value as MetodoNumerico | "");
                  setFormData({
                    tolerancia: 0.0001,
                    maxIteraciones: 100,
                    funcion: "",
                  });
                  setFuncionError(null);
                  setJobId(null);
                  setMatrixValues(crearMatrizVacia(3));
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              >
                <option value="">Seleccione un método</option>
                <option value="newton">Newton-Raphson</option>
                <option value="secante">Secante</option>
                <option value="muller">Müller</option>
                <option value="gauss">Gauss</option>
                <option value="gaussSeidel">Gauss-Seidel</option>
                <option value="gaussJordan">Gauss-Jordan</option>
              </select>
            </div>

            {/* MÉTODOS DE RAÍCES */}
            {["newton", "secante", "muller"].includes(method) && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Función f(x)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => insertarEnFuncion("exp(x)")}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono transition"
                    >
                      exp(x)
                    </button>
                    <button
                      type="button"
                      onClick={() => insertarEnFuncion("pi")}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono transition"
                    >
                      pi
                    </button>
                    <button
                      type="button"
                      onClick={() => insertarEnFuncion("sin(x)")}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono transition"
                    >
                      sin(x)
                    </button>
                    <button
                      type="button"
                      onClick={() => insertarEnFuncion("cos(x)")}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono transition"
                    >
                      cos(x)
                    </button>
                    <button
                      type="button"
                      onClick={() => insertarEnFuncion("tan(x)")}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono transition"
                    >
                      tan(x)
                    </button>
                    <button
                      type="button"
                      onClick={() => insertarEnFuncion("log(x)")}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono transition"
                    >
                      ln(x)
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.funcion || ""}
                    placeholder="Ingrese la función ej: x^3 - 2x + 1"
                    onChange={(e) => handleFuncionChange(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-3 font-mono focus:ring-2 focus:ring-blue-500 transition ${
                      funcionError
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200"
                    }`}
                  />
                  {funcionError && (
                    <p className="text-xs text-red-500 mt-1">{funcionError}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Usa ** para potencias, exp(x) para eˣ, pi para π
                  </p>
                </div>

                {method === "newton" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimación inicial (x₀)
                    </label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ej: 2"
                      onChange={(e) =>
                        handleChange("x0", parseFloat(e.target.value))
                      }
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                )}

                {method === "secante" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primera estimación (x₀)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ej: 2"
                        onChange={(e) =>
                          handleChange("x0", parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Segunda estimación (x₁)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ej: 3"
                        onChange={(e) =>
                          handleChange("x1", parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 transition"
                      />
                    </div>
                  </>
                )}

                {method === "muller" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primera estimación (x₀)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ej: 0"
                        onChange={(e) =>
                          handleChange("x0", parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Segunda estimación (x₁)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ej: 1"
                        onChange={(e) =>
                          handleChange("x1", parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tercera estimación (x₂)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="Ej: 2"
                        onChange={(e) =>
                          handleChange("x2", parseFloat(e.target.value))
                        }
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 transition"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TOLERANCIA E ITERACIONES */}
            {["newton", "secante", "muller", "gaussSeidel"].includes(
              method,
            ) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerancia
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.tolerancia}
                    onChange={(e) =>
                      handleChange("tolerancia", parseFloat(e.target.value))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Precisión deseada (menor valor = más exacto)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de iteraciones
                  </label>
                  <input
                    type="number"
                    value={formData.maxIteraciones}
                    onChange={(e) =>
                      handleChange("maxIteraciones", parseInt(e.target.value))
                    }
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Límite de iteraciones (seguridad)
                  </p>
                </div>
              </div>
            )}

            {/* MATRICES */}
            {esMetodoMatriz && (
              <div className="mt-5">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="font-semibold text-gray-700 mb-4">
                    Matriz aumentada 3x3
                  </h3>
                  <p className="text-xs text-gray-500 mb-4">
                    La última columna es el vector de resultados (b)
                  </p>
                  <div className="space-y-3">
                    {matrixValues.map((fila, rowIndex) => (
                      <div
                        key={rowIndex}
                        className="flex flex-wrap items-center gap-2 justify-center"
                      >
                        {variables.map((variable, colIndex) => (
                          <div
                            key={colIndex}
                            className="flex items-center gap-2"
                          >
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
                            handleMatrixChange(
                              rowIndex,
                              matrixSize,
                              e.target.value,
                            )
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
                </div>
              </div>
            )}

            {/* Botón de envío */}
            <button
              onClick={handleSubmit}
              disabled={estaDeshabilitado()}
              className="mt-8 w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? "Procesando..." : "Enviar Job"}
            </button>

            {/* Mensaje de éxito */}
            {jobId && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-green-800 text-sm">
                  Job creado exitosamente
                </p>
                <p className="font-mono text-xs text-green-600 mt-1 break-all">
                  ID: {jobId}
                </p>
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

export default CreateJob;
