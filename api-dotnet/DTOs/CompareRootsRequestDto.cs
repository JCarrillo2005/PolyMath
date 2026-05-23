namespace api_dotnet.DTOs
{
    public class CompareRootsRequestDTO
    {
        public string Funcion { get; set; } = string.Empty;
        public double X0 { get; set; }      // Newton
        public double X1 { get; set; }      // Secante  
        public double X2 { get; set; }      // Müller
        public double Tolerancia { get; set; } = 1e-8;
        public int MaxIteraciones { get; set; } = 100;
        public List<string> Metodos { get; set; } = new() { "newton", "secante", "muller" };
    }
}