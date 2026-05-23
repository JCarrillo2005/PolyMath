const API_BASE = "http://localhost:5000/api/Jobs";

export interface CompareRootsRequest {
  funcion: string;
  x0: number;
  x1: number;
  x2: number;
  tolerancia: number;
  maxIteraciones: number;
  metodos: ("newton" | "secante" | "muller")[];
}

export interface ComparisonResponse {
  comparisonId: string;
  jobs: JobReference[];
  message: string;
}

export interface JobReference {
  jobId: string;
  metodo: string;
}

export interface ComparisonResult {
  comparisonId: string;
  parametrosComunes: {
    funcion: string;
    tolerancia: number;
    maxIteraciones: number;
  };
  resultados: MethodResult[];
  creadoEn: string;
}

export interface MethodResult {
  metodo: string;
  jobId: string;
  raiz: string | null;
  iteraciones: number;
  errorFinal: number | null;
  convergio: boolean;
  tiempoEjecucionMs: number | null;
  estado: string;
  errorMensaje: string | null;
}

export async function createComparison(
  data: CompareRootsRequest,
): Promise<ComparisonResponse> {
  const response = await fetch(`${API_BASE}/compare/roots`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear comparación");
  }

  return response.json();
}

export async function getComparisonResult(
  comparisonId: string,
): Promise<ComparisonResult> {
  const response = await fetch(`${API_BASE}/compare/roots/${comparisonId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al obtener resultados");
  }

  return response.json();
}
