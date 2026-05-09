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

function CreateJob() {
  const [method, setMethod] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleChange = (key: string, value: any) => {
    setFormData({
      ...formData,
      [key]: value,
    });
  };

  // Función para insertar texto en el campo de función al hacer clic en los botones de ayuda.
  const insertarEnFuncion = (texto: string) => {
    setFormData((prev: any) => ({
      ...prev,
      funcion: (prev.funcion || "") + texto,
    }));
  };

  const validarFuncion = () => {
    if (!formData.funcion || formData.funcion.trim() === "") {
      alert("Ingrese una función");
      return false;
    }
    return true;
  };

  // Validar que la función tenga paréntesis balanceados
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

    if (!validarFuncion()) return;

    const funcionOriginal = formData.funcion;

    // Validar paréntesis
    if (!validarParentesis(funcionOriginal)) {
      alert("Error de Sintaxis: Revise la función.");
      return;
    }

    // Validar que no haya caracteres inválidos
    const caracteresInvalidos = /[^a-zA-Z0-9\+\-\*\/\(\)\^\s\.\,]/g;
    if (caracteresInvalidos.test(funcionOriginal)) {
      alert(
        "Error de Sintaxis: La función contiene caracteres no permitidos. Use solo letras, números, operadores y paréntesis.",
      );
      return;
    }

    setLoading(true);

    try {
      let parametros: any = {};

      if (method === "newton") {
        if (!formData.x0 || isNaN(parseFloat(formData.x0))) {
          alert("Ingrese un valor inicial x0 válido");
          return;
        }

        parametros = {
          funcion: convertirFuncion(funcionOriginal),
          x0: parseFloat(formData.x0),
          tolerancia: 0.0001,
          maxIteraciones: 100,
        };
      }

      if (method === "secante") {
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
          funcion: convertirFuncion(funcionOriginal),
          x0: parseFloat(formData.x0),
          x1: parseFloat(formData.x1),
          tolerancia: 0.0001,
          maxIteraciones: 100,
        };
      }

      if (method === "muller") {
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
          funcion: convertirFuncion(funcionOriginal),
          x0: parseFloat(formData.x0),
          x1: parseFloat(formData.x1),
          x2: parseFloat(formData.x2),
          tolerancia: 0.0001,
          maxIteraciones: 100,
        };
      }

      if (!["newton", "secante", "muller"].includes(method)) {
        alert("Este método todavía no tiene formulario configurado");
        return;
      }

      const response = await createJob(method, parametros);

      setJobId(response.jobId);
      alert(`Job creado con ID: ${response.jobId}`);

      navigate(`/job/${response.jobId}`);
    } catch (error: any) {
      console.error("Error completo:", error);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Error al crear el job",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Crear Nuevo Job</h1>

      <select
        value={method}
        onChange={(e) => {
          setMethod(e.target.value);
          setFormData({});
          setJobId(null);
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

      {["newton", "secante", "muller"].includes(method) && (
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 mb-1">Función f(x):</p>

            {/* BOTONES DE AYUDA */}
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => insertarEnFuncion("exp(x)")}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                eˣ (exp(x))
              </button>
              <button
                type="button"
                onClick={() => insertarEnFuncion("pi")}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                π (pi)
              </button>
              <button
                type="button"
                onClick={() => insertarEnFuncion("sin(x)")}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                sin(x)
              </button>
              <button
                type="button"
                onClick={() => insertarEnFuncion("cos(x)")}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-mono"
              >
                cos(x)
              </button>
            </div>

            <input
              type="text"
              placeholder="Ej: x**2 - 4  o  exp(x) - x  o  sin(x)"
              value={formData.funcion || ""}
              onChange={(e) => handleChange("funcion", e.target.value)}
              className="w-full border p-2 rounded font-mono"
            />
          </div>

          {method === "newton" && (
            <input
              type="number"
              placeholder="x0 (valor inicial)"
              onChange={(e) => handleChange("x0", e.target.value)}
              className="w-full border p-2 rounded"
            />
          )}

          {method === "secante" && (
            <>
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
            </>
          )}

          {method === "muller" && (
            <>
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
            </>
          )}
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