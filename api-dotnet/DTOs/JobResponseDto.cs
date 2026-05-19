namespace api_dotnet.DTOs
{
    // DTOs/JobResponseDTO para GET /jobs/{id}
    public class JobResponseDTO
    {
        public string JobId { get; set; } = string.Empty;
        public string Metodo { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public string? Resultado { get; set; }
        public bool? Converged { get; set; }
        public int? TiempoEjecucionMs { get; set; }
        public string? ErrorMensaje { get; set; }
        public DateTime CreadoEn { get; set; }
        public DateTime ActualizadoEn { get; set; }
        public string? ParametrosJson { get; set; }
        public string? Funcion { get; set; }
    }

    // para GET /jobs/{id}/iterations
    public class IteracionDTO
    {
        public int Iteracion { get; set; }
        public string? VectorX { get; set; }
        public string? Xi { get; set; }
        public decimal? Error { get; set; }
        public string? ErroresIndividuales { get; set; }
        public string? DatosAdicionales { get; set; }
    }

    // DTOs/CreateJobRequestDTO.cs (para POST /jobs)
    public class CreateJobRequestDTO
    {
        public string Metodo { get; set; } = string.Empty;
        public Dictionary<string, object> Parametros { get; set; } = new();
    }
}