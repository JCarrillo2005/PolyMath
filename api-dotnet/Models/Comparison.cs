using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api_dotnet.Models
{
    public class Comparison
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string ComparisonId { get; set; } = Guid.NewGuid().ToString();
        public string Tipo { get; set; } = "raices";

        [Required]
        public string Funcion { get; set; } = string.Empty;

        public double? X0 { get; set; }      // Newton
        public double? X1 { get; set; }      // Secante
        public double? X2 { get; set; }      // Müller

        public double Tolerancia { get; set; } = 1e-8;
        public int MaxIteraciones { get; set; } = 100;

        [Required]
        public string MetodosUsados { get; set; } = string.Empty; // JSON array ej: ["newton","secante"]

        public DateTime CreadoEn { get; set; } = DateTime.UtcNow;


        public virtual ICollection<Job> Jobs { get; set; } = new List<Job>();
    }
}