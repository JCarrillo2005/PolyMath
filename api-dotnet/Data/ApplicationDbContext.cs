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
        }
    }
}