using api_dotnet.Data;
using api_dotnet.DTOs;
using api_dotnet.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Identity.Client;
using System.Text.Json;
namespace api_dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public JobsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // POST api/jobs
        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] JsonElement request)
        {
            try
            {
                // Extraer los datos del JSON
                var metodo = request.GetProperty("metodo").GetString();
                var parametros = request.GetProperty("parametros").ToString(); // Obtener los parámetros como JSON

                // Crear un nuevo Job
                var job = new Job
                {
                    JobId = Guid.NewGuid().ToString(),
                    Metodo = metodo ?? "desconocido",
                    Estado = "PENDING",
                    ParametrosJson = parametros,
                    CreadoEn = DateTime.UtcNow,
                    ActualizadoEn = DateTime.UtcNow,
                };
                _context.Jobs.Add(job);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    jobId = job.JobId,
                    estado = job.Estado,
                    message = "Job creado exitosamente"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = "Error al crear el job",
                    error = ex.Message
                });
            }



        }
        // GET api/jobId
        [HttpGet("{jobId}")]
        public async Task<IActionResult> GetJob(string jobId)
        {
            var job = await _context.Jobs
                .Where(j => j.JobId == jobId)
                .Select(j => new JobResponseDTO  // ← Usando DTO
                {
                    JobId = j.JobId,
                    Metodo = j.Metodo,
                    Estado = j.Estado,
                    Resultado = j.Resultado,
                    Converged = j.Converged,
                    TiempoEjecucionMs = j.TiempoEjecucionMs,
                    ErrorMensaje = j.ErrorMensaje,
                    CreadoEn = j.CreadoEn,
                    ActualizadoEn = j.ActualizadoEn
                })
                .FirstOrDefaultAsync();

            if (job == null)
                return NotFound(new { error = "Job no encontrado" });

            return Ok(job);
        }

        // En JobsController.cs
        [HttpGet("{jobId}/iterations")]
        public async Task<IActionResult> GetIterations(string jobId)
        {
            var iteraciones = await _context.JobIterations
                .Where(i => i.JobId == jobId)
                .OrderBy(i => i.Iteracion)
                .Select(i => new IteracionDTO  // ← DTO limpio
                {
                    Iteracion = i.Iteracion,
                    Xi = i.Xi,
                    Error = i.Error,
                    DatosAdicionales = i.DatosAdicionales
                })
                .ToListAsync();

            if (!iteraciones.Any())
                return NotFound(new { message = "No hay iteraciones para este job" });

            return Ok(iteraciones);
        }

    }

}
