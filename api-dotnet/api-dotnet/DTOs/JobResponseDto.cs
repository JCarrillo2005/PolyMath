namespace api_dotnet.DTOs
{
    // DTOs/JobResponseDTO.cs (para GET /jobs/{id})
    public class JobResponseDTO
    {
        public string JobId { get; set; }
        public string Metodo { get; set; }
        public string Estado { get; set; }
        public string? Resultado { get; set; }
        public bool? Converged { get; set; }
        public int? TiempoEjecucionMs { get; set; }
        public string? ErrorMensaje { get; set; }
        public DateTime CreadoEn { get; set; }
        public DateTime ActualizadoEn { get; set; }
    }

    // DTOs/IteracionDTO.cs (para GET /jobs/{id}/iterations)
    public class IteracionDTO
    {
        public int Iteracion { get; set; }
        public string? Xi { get; set; }
        public decimal? Error { get; set; }
        public string? DatosAdicionales { get; set; }
    }

    // DTOs/CreateJobRequestDTO.cs (para POST /jobs)
    public class CreateJobRequestDTO
    {
        public string Metodo { get; set; }
        public Dictionary<string, object> Parametros { get; set; }
    }
}
