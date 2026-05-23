namespace api_dotnet.DTOs
{
    public class MatrixComparisonResultDTO
    {
        public string ComparisonId { get; set; } = string.Empty;
        public string MatrizOriginal { get; set; } = string.Empty;
        public List<MatrixMethodResultDTO> Resultados { get; set; } = new();
        public DateTime CreadoEn { get; set; }
    }

    public class MatrixMethodResultDTO
    {
        public string Metodo { get; set; } = string.Empty;
        public string JobId { get; set; } = string.Empty;
        public string? Solucion { get; set; }
        public int NumeroPasos { get; set; }
        public int? TiempoEjecucionMs { get; set; }
        public bool Convergio { get; set; }
        public string Estado { get; set; } = string.Empty;
        public string? ErrorMensaje { get; set; }
        public List<MatrixStepDTO> Pasos { get; set; } = new();
    }

    public class MatrixStepDTO
    {
        public int Iteracion { get; set; }
        public string? Descripcion { get; set; }
        public double[][]? Matriz { get; set; }
        public double? Factor { get; set; }
    }
}