// Usar variable de entorno con fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function getComparisonJobIterations(jobId: string) {
  const response = await fetch(`${API_BASE_URL}/api/Jobs/${jobId}/iterations`);
  if (!response.ok) {
    throw new Error("Error al obtener iteraciones");
  }
  return response.json();
}
