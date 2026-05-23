// Función para obtener iteraciones de un job específico
export async function getComparisonJobIterations(jobId: string) {
  const response = await fetch(
    `http://localhost:5000/api/Jobs/${jobId}/iterations`,
  );
  if (!response.ok) {
    throw new Error("Error al obtener iteraciones");
  }
  return response.json();
}
