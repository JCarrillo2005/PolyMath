using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace api_dotnet.Models
{
    public class JobIteration
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string JobId { get; set; } = string.Empty;

        [Required]
        public int Iteracion { get; set; }

        public string? Xi { get; set; }  // Para métodos de raíces

        public string? VectorX { get; set; }  // Para sistemas lineales (JSON)

        [Column(TypeName = "decimal(18,15)")]
        public decimal? Error { get; set; }

        public string? DatosAdicionales { get; set; }  // JSON para datos específicos

        [ForeignKey("JobId")]
        public virtual Job? Job { get; set; }
    }
}
