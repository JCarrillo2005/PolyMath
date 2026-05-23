export async function crearJob(metodo: string, parametros: any) {
  const response = await fetch("http://localhost:5000/api/Jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      metodo: metodo,
      parametros: {
        funcion: parametros.funcion,
        x0: Number(parametros.x0),
        tolerancia: Number(parametros.tolerancia),
        maxIteraciones: Number(parametros.maxIteraciones),
      },
    }),
  });
  return response.json();
}
