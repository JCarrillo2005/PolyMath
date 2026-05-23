namespace api_dotnet.DTOs
{
    public class MatrixComparisonHistoryDTO
    {
        public string ComparisonId { get; set; } = string.Empty;
        public string MatrizOriginal { get; set; } = string.Empty;
        public DateTime CreadoEn { get; set; }
        public List<MatrixHistoryJobDTO> Jobs { get; set; } = new();
    }

    public class MatrixHistoryJobDTO
    {
        public string JobId { get; set; } = string.Empty;
        public string Metodo { get; set; } = string.Empty;
        public string Estado { get; set; } = string.Empty;
        public bool Converged { get; set; }
        public string? Resultado { get; set; }
        public int? TiempoEjecucionMs { get; set; }
    }
}