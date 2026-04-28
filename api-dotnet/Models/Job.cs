using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api_dotnet.Models
{
    public class Job
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string JobId { get; set; } = Guid.NewGuid().ToString();
        [Required]
        public string Metodo { get; set; } = string.Empty;
        [Required]
        public string Estado { get; set; } = "PENDING"; 

        [Required]
        public string ParametrosJson { get; set; } = string.Empty; // string JSON con los parámetros del job.
        public string? Resultado { get; set; }
        public bool? Converged { get; set; }
        public int? TiempoEjecucionMs { get; set; }

        public string? ErrorMensaje { get; set; }

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;

        public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;

    }
}
