// Usar variable de entorno con fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const API_BASE = `${API_BASE_URL}/api/Jobs`;

export interface ComparisonHistoryJob {
  jobId: string;
  metodo: string;
  estado: string;
  converged: boolean;
  resultado: string | null;
  tiempoEjecucionMs: number | null;
  errorMensaje?: string;
}

export interface ComparisonHistoryItem {
  comparisonId: string;
  funcion: string;
  x0: number;
  x1: number;
  x2: number;
  tolerancia: number;
  maxIteraciones: number;
  metodosUsados: string;
  creadoEn: string;
  jobs: ComparisonHistoryJob[];
}

export async function getComparisonHistory(): Promise<ComparisonHistoryItem[]> {
  const response = await fetch(`${API_BASE}/compare/history`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error || "Error al obtener historial de comparaciones",
    );
  }

  return response.json();
}

export async function getComparisonById(
  comparisonId: string,
): Promise<ComparisonHistoryItem> {
  const response = await fetch(`${API_BASE}/compare/history/${comparisonId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Error al obtener la comparación");
  }

  return response.json();
}
