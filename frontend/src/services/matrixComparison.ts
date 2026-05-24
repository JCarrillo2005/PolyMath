// Usar variable de entorno con fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE = `${API_BASE_URL}/api/Jobs`;

export interface MatrixStep {
  iteracion: number;
  descripcion?: string;
  matriz?: number[][];
  factor?: number;
}

export interface MatrixMethodResult {
  metodo: string;
  jobId: string;
  solucion?: string;
  numeroPasos: number;
  tiempoEjecucionMs?: number;
  convergio: boolean;
  estado: string;
  errorMensaje?: string;
  pasos: MatrixStep[];
}

export interface MatrixComparisonResult {
  comparisonId: string;
  matrizOriginal: string;
  resultados: MatrixMethodResult[];
  creadoEn: string;
}

export interface MatrixComparisonResponse {
  comparisonId: string;
  jobs: { jobId: string; metodo: string }[];
  message: string;
}

export async function createMatrixComparison(
  matrix: string,
): Promise<MatrixComparisonResponse> {
  const response = await fetch(`${API_BASE}/compare/matrices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ matrix }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al crear comparación de matrices");
  }

  return response.json();
}

export async function getMatrixComparison(
  comparisonId: string,
): Promise<MatrixComparisonResult> {
  const response = await fetch(`${API_BASE}/compare/matrices/${comparisonId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || "Error al obtener la comparación de matrices",
    );
  }

  return response.json();
}

export async function getMatrixComparisonHistory(): Promise<any[]> {
  const response = await fetch(`${API_BASE}/compare/matrices/history`);

  if (!response.ok) {
    throw new Error("Error al obtener historial de comparaciones de matrices");
  }

  return response.json();
}
