namespace api_dotnet.DTOs
{
    public class CompareRootsResponseDTO
    {
        public string ComparisonId { get; set; } = string.Empty;
        public List<JobReferenceDTO> Jobs { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }

    public class JobReferenceDTO
    {
        public string JobId { get; set; } = string.Empty;
        public string Metodo { get; set; } = string.Empty;
    }
}