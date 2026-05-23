namespace api_dotnet.DTOs
{
    public class ComparisonResultDTO
    {
        public string ComparisonId { get; set; } = string.Empty;
        public ComparisonParamsDTO ParametrosComunes { get; set; } = new();
        public List<MethodResultDTO> Resultados { get; set; } = new();
        public DateTime CreadoEn { get; set; }
    }

    public class ComparisonParamsDTO
    {
        public string Funcion { get; set; } = string.Empty;
        public double Tolerancia { get; set; }
        public int MaxIteraciones { get; set; }
    }

    public class MethodResultDTO
    {
        public string Metodo { get; set; } = string.Empty;
        public string JobId { get; set; } = string.Empty;
        public string? Raiz { get; set; }
        public int Iteraciones { get; set; }
        public double? ErrorFinal { get; set; }
        public bool Convergio { get; set; }
        public int? TiempoEjecucionMs { get; set; }
        public string? Estado { get; set; }
        public string? ErrorMensaje { get; set; }
    }
}