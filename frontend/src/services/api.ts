export async function crearJob(metodo: string, parametros: any) {
  const response = await fetch('http://localhost:5000/api/Jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      metodo: metodo,        // ← minúscula, sin tilde
      parametros: {          // ← dentro de "parametros"
        funcion: parametros.funcion,  // ← "funcion" (sin tilde)
        x0: Number(parametros.x0),    // ← convertir a número
        tolerancia: Number(parametros.tolerancia),
        maxIteraciones: Number(parametros.maxIteraciones)
      }
    })
  });
  return response.json();
}