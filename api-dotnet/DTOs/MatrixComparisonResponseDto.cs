namespace api_dotnet.DTOs
{
    public class MatrixComparisonResponseDTO
    {
        public string ComparisonId { get; set; } = string.Empty;
        public List<MatrixJobReferenceDTO> Jobs { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class MatrixJobReferenceDTO
    {
        public string JobId { get; set; } = string.Empty;
        public string Metodo { get; set; } = string.Empty;
    }
}