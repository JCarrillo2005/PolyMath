import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../services/jobs.ts";

function convertirFuncion(funcion: string): string {
  let converted = funcion
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    .replace(/\^/g, "**")
    .replace(/sen\(/g, "sin(")
    .replace(/ln\(/g, "log(")
    .replace(/pi/g, "pi");

  converted = converted.replace(/e\*\*-([a-zA-Z0-9]+)/g, "exp(-$1)");
  converted = converted.replace(/e\^-([a-zA-Z0-9]+)/g, "exp(-$1)");
  converted = converted.replace(/e\^([a-zA-Z0-9\(\)]+)/g, "exp($1)");

  return converted;
}

function crearMatrizVacia(size: number) {
  return Array.from({ length: size }, () => Array(size + 1).fill(""));
}

function CreateJob() {
  const [method, setMethod] = useState("");

  const [formData, setFormData] = useState<any>({
    tolerancia: 0.0001,
    maxIteraciones: 100,
  });

  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const matrixSize = 3;

  const [matrixValues, setMatrixValues] = useState<string[][]>(
    crearMatrizVacia(3)
  );

  const navigate = useNavigate();

  const handleChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  const insertarEnFuncion = (texto: string) => {
    setFormData((prev: any) => ({
      ...prev,
      funcion: (prev.funcion || "") + texto,
    }));
  };

  const handleMatrixChange = (
    row: number,
    col: number,
    value: string
  ) => {
    const nuevaMatriz = matrixValues.map((fila) => [...fila]);

    nuevaMatriz[row][col] = value;

    setMatrixValues(nuevaMatriz);
  };

  const convertirMatrizAString = () => {
    return matrixValues.map((fila) => fila.join(",")).join(";");
  };

  const validarMatriz = () => {
    for (const fila of matrixValues) {
      for (const valor of fila) {
        if (valor === "" || isNaN(parseFloat(valor))) {
          alert(
            "Complete todos los campos de la matriz con valores numéricos"
          );

          return false;
        }
      }
    }

    return true;
  };

  const validarFuncion = () => {
    if (!formData.funcion || formData.funcion.trim() === "") {
      alert("Ingrese una función");

      return false;
    }

    return true;
  };

  const validarParentesis = (funcion: string): boolean => {
    let balance = 0;

    for (const char of funcion) {
      if (char === "(") balance++;
      if (char === ")") balance--;

      if (balance < 0) return false;
    }

    return balance === 0;
  };

  const handleSubmit = async () => {
    if (!method) {
      alert("Por favor seleccione un método antes de enviar el job");

      return;
    }

    const usaFuncion = ["newton", "secante", "muller"].includes(method);

    if (usaFuncion) {
      if (!validarFuncion()) return;

      const funcionOriginal = formData.funcion;

      if (!validarParentesis(funcionOriginal)) {
        alert("Error de Sintaxis: Revise la función.");

        return;
      }

      const caracteresInvalidos =
        /[^a-zA-Z0-9\+\-\*\/\(\)\^\s\.\,]/g;

      if (caracteresInvalidos.test(funcionOriginal)) {
        alert(
          "Error de Sintaxis: La función contiene caracteres no permitidos."
        );

        return;
      }
    }

    setLoading(true);

    try {
      let parametros: any = {};

      // NEWTON
      if (method === "newton") {
        parametros = {
          funcion: convertirFuncion(formData.funcion),
          x0: parseFloat(formData.x0),

          tolerancia: parseFloat(formData.tolerancia),

          maxIteraciones: parseInt(
            formData.maxIteraciones
          ),
        };
      }

      // SECANTE
      if (method === "secante") {
        parametros = {
          funcion: convertirFuncion(formData.funcion),

          x0: parseFloat(formData.x0),

          x1: parseFloat(formData.x1),

          tolerancia: parseFloat(
            formData.tolerancia
          ),

          maxIteraciones: parseInt(
            formData.maxIteraciones
          ),
        };
      }

      // MULLER
      if (method === "muller") {
        parametros = {
          funcion: convertirFuncion(formData.funcion),

          x0: parseFloat(formData.x0),

          x1: parseFloat(formData.x1),

          x2: parseFloat(formData.x2),

          tolerancia: parseFloat(
            formData.tolerancia
          ),

          maxIteraciones: parseInt(
            formData.maxIteraciones
          ),
        };
      }

      // GAUSS
      if (method === "gauss") {
        if (!validarMatriz()) return;

        parametros = {
          matrix: convertirMatrizAString(),
        };
      }

      // GAUSS-SEIDEL
      if (method === "gaussSeidel") {
        if (!validarMatriz()) return;

        parametros = {
          matrix: convertirMatrizAString(),

          tolerancia: parseFloat(
            formData.tolerancia
          ),

          maxIteraciones: parseInt(
            formData.maxIteraciones
          ),
        };
      }

      // GAUSS-JORDAN
      if (method === "gaussJordan") {
        if (!validarMatriz()) return;

        parametros = {
          matrix: convertirMatrizAString(),
        };
      }

      const response = await createJob(
        method,
        parametros
      );

      setJobId(response.jobId);

      alert(`Job creado con ID: ${response.jobId}`);

      navigate(`/job/${response.jobId}`);
    } catch (error: any) {
      console.error("Error completo:", error);

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al crear el job"
      );
    } finally {
      setLoading(false);
    }
  };

  const esMetodoMatriz = [
    "gauss",
    "gaussSeidel",
    "gaussJordan",
  ].includes(method);

  const variables = ["x", "y", "z"];

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Crear Nuevo Job
      </h1>

      <select
        value={method}
        onChange={(e) => {
          setMethod(e.target.value);

          setFormData({
            tolerancia: 0.0001,
            maxIteraciones: 100,
          });

          setJobId(null);
        }}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">
          Seleccione un método
        </option>

        <option value="newton">
          Newton-Raphson
        </option>

        <option value="secante">
          Secante
        </option>

        <option value="muller">
          Müller
        </option>

        <option value="gauss">
          Gauss
        </option>

        <option value="gaussSeidel">
          Gauss-Seidel
        </option>

        <option value="gaussJordan">
          Gauss-Jordan
        </option>
      </select>

      {/* MÉTODOS DE RAÍCES */}
      {["newton", "secante", "muller"].includes(method) && (
        <div className="space-y-3">

          <div>
            <p className="text-sm text-gray-600 mb-1">
              Función f(x):
            </p>

            <div className="flex gap-2 mb-2 flex-wrap">

              <button
                type="button"
                onClick={() =>
                  insertarEnFuncion("exp(x)")
                }
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                eˣ
              </button>

              <button
                type="button"
                onClick={() =>
                  insertarEnFuncion("pi")
                }
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                π
              </button>

              <button
                type="button"
                onClick={() =>
                  insertarEnFuncion("sin(x)")
                }
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                sin(x)
              </button>

              <button
                type="button"
                onClick={() =>
                  insertarEnFuncion("cos(x)")
                }
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                cos(x)
              </button>

            </div>

            <input
              type="text"
              value={formData.funcion || ""}
              placeholder="Ej: x^2 - 4"
              onChange={(e) =>
                handleChange(
                  "funcion",
                  e.target.value
                )
              }
              className="w-full border p-2 rounded font-mono"
            />
          </div>

          {method === "newton" && (
            <input
              type="number"
              placeholder="x0"
              onChange={(e) =>
                handleChange(
                  "x0",
                  e.target.value
                )
              }
              className="w-full border p-2 rounded"
            />
          )}

          {method === "secante" && (
            <>
              <input
                type="number"
                placeholder="x0"
                onChange={(e) =>
                  handleChange(
                    "x0",
                    e.target.value
                  )
                }
                className="w-full border p-2 rounded"
              />

              <input
                type="number"
                placeholder="x1"
                onChange={(e) =>
                  handleChange(
                    "x1",
                    e.target.value
                  )
                }
                className="w-full border p-2 rounded"
              />
            </>
          )}

          {method === "muller" && (
            <>
              <input
                type="number"
                placeholder="x0"
                onChange={(e) =>
                  handleChange(
                    "x0",
                    e.target.value
                  )
                }
                className="w-full border p-2 rounded"
              />

              <input
                type="number"
                placeholder="x1"
                onChange={(e) =>
                  handleChange(
                    "x1",
                    e.target.value
                  )
                }
                className="w-full border p-2 rounded"
              />

              <input
                type="number"
                placeholder="x2"
                onChange={(e) =>
                  handleChange(
                    "x2",
                    e.target.value
                  )
                }
                className="w-full border p-2 rounded"
              />
            </>
          )}
        </div>
      )}

      {/* TOLERANCIA E ITERACIONES */}
      {[
        "newton",
        "secante",
        "muller",
        "gaussSeidel",
      ].includes(method) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">

          <div>
            <label className="block text-sm font-medium mb-1">
              Tolerancia
            </label>

            <input
              type="number"
              step="0.000001"
              value={
                formData.tolerancia || ""
              }
              onChange={(e) =>
                handleChange(
                  "tolerancia",
                  e.target.value
                )
              }
              className="w-full border p-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Máx. Iteraciones
            </label>

            <input
              type="number"
              value={
                formData.maxIteraciones || ""
              }
              onChange={(e) =>
                handleChange(
                  "maxIteraciones",
                  e.target.value
                )
              }
              className="w-full border p-2 rounded"
            />
          </div>

        </div>
      )}

      {/* MATRICES */}
      {esMetodoMatriz && (
        <div className="space-y-5 mt-5">

          <div className="bg-gray-100 p-5 rounded border">

            <p className="font-semibold mb-4">
              Matriz aumentada 3x3
            </p>

            <div className="space-y-3">

              {matrixValues.map(
                (fila, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex flex-wrap items-center gap-2"
                  >

                    {variables.map(
                      (
                        variable,
                        colIndex
                      ) => (
                        <div
                          key={colIndex}
                          className="flex items-center gap-2"
                        >

                          <input
                            type="number"
                            value={
                              fila[colIndex]
                            }
                            onChange={(e) =>
                              handleMatrixChange(
                                rowIndex,
                                colIndex,
                                e.target.value
                              )
                            }
                            className="w-20 border p-2 rounded text-center bg-white"
                          />

                          <span>
                            {variable}
                          </span>

                          {colIndex <
                            variables.length -
                              1 && (
                            <span>
                              +
                            </span>
                          )}
                        </div>
                      )
                    )}

                    <span>=</span>

                    <input
                      type="number"
                      value={
                        fila[matrixSize]
                      }
                      onChange={(e) =>
                        handleMatrixChange(
                          rowIndex,
                          matrixSize,
                          e.target.value
                        )
                      }
                      className="w-20 border p-2 rounded text-center bg-white"
                    />

                  </div>
                )
              )}

            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {loading
          ? "Creando..."
          : "Enviar Job"}
      </button>

      {jobId && (
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p>
            Job creado:{" "}
            <code>{jobId}</code>
          </p>
        </div>
      )}
    </div>
  );
}

export default CreateJob;