import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createJob } from "../services/jobs.ts";

function convertirFuncion(funcion: string): string {
  return funcion
    .replace(/(\d)([a-zA-Z])/g, "$1*$2")
    .replace(/\^/g, "**")
    .replace(/sen\(/g, "sin(")
    .replace(/ln\(/g, "log(");
}

function crearMatrizVacia(size: number) {
  return Array.from({ length: size }, () => Array(size + 1).fill(""));
}

function CreateJob() {
  const [method, setMethod] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);

  const [matrixSize, setMatrixSize] = useState(3);
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

  const handleMatrixSizeChange = (size: number) => {
    setMatrixSize(size);
    setMatrixValues(crearMatrizVacia(size));
  };

  const handleMatrixChange = (row: number, col: number, value: string) => {
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
          alert("Complete todos los campos de la matriz con valores numéricos");
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

  const handleSubmit = async () => {
    if (!method) {
      alert("Por favor seleccione un método antes de enviar el job");
      return;
    }

    setLoading(true);

    try {
      let parametros: any = {};

      if (method === "newton") {
        if (!validarFuncion()) return;

        if (!formData.x0 || isNaN(parseFloat(formData.x0))) {
          alert("Ingrese un valor inicial x0 válido");
          return;
        }

        parametros = {
          funcion: convertirFuncion(formData.funcion),
          x0: parseFloat(formData.x0),
          tolerancia: 0.0001,
          maxIteraciones: 100,
        };
      }

      if (method === "secante") {
        if (!validarFuncion()) return;

        if (
          !formData.x0 ||
          !formData.x1 ||
          isNaN(parseFloat(formData.x0)) ||
          isNaN(parseFloat(formData.x1))
        ) {
          alert("Ingrese valores válidos para x0 y x1");
          return;
        }

        parametros = {
          funcion: convertirFuncion(formData.funcion),
          x0: parseFloat(formData.x0),
          x1: parseFloat(formData.x1),
          tolerancia: 0.0001,
          maxIteraciones: 100,
        };
      }

      if (method === "muller") {
        if (!validarFuncion()) return;

        if (
          !formData.x0 ||
          !formData.x1 ||
          !formData.x2 ||
          isNaN(parseFloat(formData.x0)) ||
          isNaN(parseFloat(formData.x1)) ||
          isNaN(parseFloat(formData.x2))
        ) {
          alert("Ingrese valores válidos para x0, x1 y x2");
          return;
        }

        parametros = {
          funcion: convertirFuncion(formData.funcion),
          x0: parseFloat(formData.x0),
          x1: parseFloat(formData.x1),
          x2: parseFloat(formData.x2),
          tolerancia: 0.0001,
          maxIteraciones: 100,
        };
      }

      if (method === "gauss" || method === "gaussJordan") {
        if (!validarMatriz()) return;

        parametros = {
          matrix: convertirMatrizAString(),
        };
      }

      if (method === "gaussSeidel") {
        if (!validarMatriz()) return;

        parametros = {
          matrix: convertirMatrizAString(),
          tolerancia: 0.0001,
          maxIteraciones: 100,
        };
      }

      const response = await createJob(method, parametros);

      setJobId(response.jobId);
      alert(`Job creado con ID: ${response.jobId}`);

      navigate(`/job/${response.jobId}`);
    } catch (error: any) {
      console.error("Error completo:", error);
      console.error("Respuesta del backend:", error.response?.data);

      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al crear el job"
      );
    } finally {
      setLoading(false);
    }
  };

  const esMetodoMatriz =
    method === "gauss" || method === "gaussSeidel" || method === "gaussJordan";

  const variables = matrixSize === 2 ? ["x", "y"] : ["x", "y", "z"];

  return (
    <div className="p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Job</h1>

      <select
        value={method}
        onChange={(e) => {
          setMethod(e.target.value);
          setFormData({});
          setJobId(null);
          handleMatrixSizeChange(3);
        }}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">Seleccione un método</option>
        <option value="newton">Newton-Raphson</option>
        <option value="secante">Secante</option>
        <option value="muller">Müller</option>
        <option value="gauss">Gauss</option>
        <option value="gaussSeidel">Gauss-Seidel</option>
        <option value="gaussJordan">Gauss-Jordan</option>
      </select>

      {method === "newton" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Función f(x) ej: x^2 - 4"
            onChange={(e) => handleChange("funcion", e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="x0 (valor inicial)"
            onChange={(e) => handleChange("x0", e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      {method === "secante" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Función f(x) ej: x^2 - 4"
            onChange={(e) => handleChange("funcion", e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="x0"
            onChange={(e) => handleChange("x0", e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="x1"
            onChange={(e) => handleChange("x1", e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      {method === "muller" && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Función f(x) ej: x^3 - x - 2"
            onChange={(e) => handleChange("funcion", e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="x0"
            onChange={(e) => handleChange("x0", e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="x1"
            onChange={(e) => handleChange("x1", e.target.value)}
            className="w-full border p-2 rounded"
          />

          <input
            type="number"
            placeholder="x2"
            onChange={(e) => handleChange("x2", e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
      )}

      {esMetodoMatriz && (
        <div className="space-y-5">
          <div>
            <label className="block font-semibold mb-2">
              Tamaño del sistema
            </label>

            <select
              value={matrixSize}
              onChange={(e) => handleMatrixSizeChange(Number(e.target.value))}
              className="w-full border p-2 rounded"
            >
              <option value={2}>2x2</option>
              <option value={3}>3x3</option>
            </select>
          </div>

          <div className="bg-gray-100 p-5 rounded border">
            <p className="font-semibold mb-4">Matriz aumentada</p>

            <div className="space-y-3">
              {matrixValues.map((fila, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex flex-wrap items-center gap-2"
                >
                  {variables.map((variable, colIndex) => (
                    <div key={colIndex} className="flex items-center gap-2">
                      <input
                        type="number"
                        value={fila[colIndex]}
                        onChange={(e) =>
                          handleMatrixChange(
                            rowIndex,
                            colIndex,
                            e.target.value
                          )
                        }
                        className="w-20 border p-2 rounded text-center bg-white"
                      />

                      <span className="font-semibold">{variable}</span>

                      {colIndex < variables.length - 1 && (
                        <span className="font-bold">+</span>
                      )}
                    </div>
                  ))}

                  <span className="font-bold mx-2">=</span>

                  <input
                    type="number"
                    value={fila[matrixSize]}
                    onChange={(e) =>
                      handleMatrixChange(rowIndex, matrixSize, e.target.value)
                    }
                    className="w-20 border p-2 rounded text-center bg-white"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm">
            <p className="font-semibold">Formato que se enviará:</p>
            <code>{convertirMatrizAString()}</code>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
      >
        {loading ? "Creando..." : "Enviar Job"}
      </button>

      {jobId && (
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <p>
            Job creado: <code>{jobId}</code>
          </p>
          <a href={`/job/${jobId}`} className="text-blue-600">
            Ver estado →
          </a>
        </div>
      )}
    </div>
  );
}

export default CreateJob;