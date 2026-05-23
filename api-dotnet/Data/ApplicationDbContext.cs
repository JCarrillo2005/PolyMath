using Microsoft.EntityFrameworkCore;
using api_dotnet.Models;

namespace api_dotnet.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Job> Jobs { get; set; }
        public DbSet<JobIteration> JobIterations { get; set; }
        public DbSet<Comparison> Comparisons { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurar relaciones
            modelBuilder.Entity<JobIteration>()
                .HasOne(j => j.Job)
                .WithMany()
                .HasForeignKey(j => j.JobId)
                .HasPrincipalKey(j => j.JobId);

            modelBuilder.Entity<JobIteration>()
                .Property(j => j.Error)
                .HasPrecision(18, 15);

            modelBuilder.Entity<Comparison>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.ComparisonId).IsUnique();
                entity.Property(e => e.ComparisonId).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Funcion).IsRequired().HasMaxLength(500);
                entity.Property(e => e.MetodosUsados).IsRequired().HasMaxLength(500);
                entity.Property(e => e.Tolerancia).HasPrecision(18, 15);
            });

            modelBuilder.Entity<Job>(entity =>
            {
                entity.HasOne(j => j.Comparison)
                      .WithMany(c => c.Jobs)
                      .HasForeignKey(j => j.ComparisonId)
                      .HasPrincipalKey(c => c.ComparisonId)
                      .OnDelete(DeleteBehavior.SetNull);
            });
        }
    }
}