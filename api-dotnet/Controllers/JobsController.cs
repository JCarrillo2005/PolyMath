using api_dotnet.Data;
using api_dotnet.DTOs;
using api_dotnet.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Identity.Client;
using StackExchange.Redis;
using System.Text.Json;
namespace api_dotnet.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConnectionMultiplexer _redis;  

        public JobsController(ApplicationDbContext context, IConnectionMultiplexer redis) 
        {
            _context = context;
            _redis = redis; 
        }

        // POST api/jobs
        [HttpPost]
        public async Task<IActionResult> CreateJob([FromBody] CreateJobRequestDTO request)
        {
            try
            {
                // Extraer los datos del JSON
                var metodo = request.Metodo;
                var parametros = JsonSerializer.Serialize(request.Parametros); // Obtener los parámetros como JSON

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

                // Encolar el Job en Redis
                var db = _redis.GetDatabase();
                await db.ListRightPushAsync("job_queue", job.JobId);
                Console.WriteLine($"Job {job.JobId} encolado en Redis");

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


        // GET api/jobs/{jobId}
        [HttpGet("{jobId}")]
        public async Task<IActionResult> GetJob(string jobId)
        {
            var jobEntity = await _context.Jobs
                .Where(j => j.JobId == jobId)
                .FirstOrDefaultAsync();

            if (jobEntity == null)
                return NotFound(new { error = "Job no encontrado" });

            var jobResponse = new JobResponseDTO
            {
                JobId = jobEntity.JobId,
                Metodo = jobEntity.Metodo,
                Estado = jobEntity.Estado,
                Resultado = jobEntity.Resultado,
                Converged = jobEntity.Converged,
                TiempoEjecucionMs = jobEntity.TiempoEjecucionMs,
                ErrorMensaje = jobEntity.ErrorMensaje,
                CreadoEn = jobEntity.CreadoEn,
                ActualizadoEn = jobEntity.ActualizadoEn,
                ParametrosJson = jobEntity.ParametrosJson, 
                Funcion = ExtraerFuncionDeParametros(jobEntity.ParametrosJson)
            };

            return Ok(jobResponse);
        }

        // GET api/jobs listar con filtros por estado y método
        [HttpGet]
        public async Task<IActionResult> GetJobs(
            [FromQuery] string? estado,
            [FromQuery] string? metodo)
        {
            var query = _context.Jobs.AsQueryable();

            if (!string.IsNullOrEmpty(estado))
                query = query.Where(j => j.Estado == estado);

            if (!string.IsNullOrEmpty(metodo))
                query = query.Where(j => j.Metodo == metodo);

            var jobsEntities = await query
                .OrderByDescending(j => j.CreadoEn)
                .ToListAsync();

            var jobsResponse = jobsEntities.Select(j => new JobResponseDTO
            {
                JobId = j.JobId,
                Metodo = j.Metodo,
                Estado = j.Estado,
                Resultado = j.Resultado,
                Converged = j.Converged,
                TiempoEjecucionMs = j.TiempoEjecucionMs,
                ErrorMensaje = j.ErrorMensaje,
                CreadoEn = j.CreadoEn,
                ActualizadoEn = j.ActualizadoEn,
                ParametrosJson = j.ParametrosJson, 
                Funcion = ExtraerFuncionDeParametros(j.ParametrosJson) 
            }).ToList();

            return Ok(jobsResponse);
        }

        // Método para extraer la función del JSON
        private string ExtraerFuncionDeParametros(string parametrosJson)
        {
            if (string.IsNullOrEmpty(parametrosJson))
                return "f(x)";

            try
            {
                var parametros = JsonSerializer.Deserialize<Dictionary<string, object>>(parametrosJson);
                return parametros?.GetValueOrDefault("funcion")?.ToString() ?? "f(x)";
            }
            catch
            {
                return "f(x)";
            }
        }



        [HttpGet("{jobId}/iterations")]
        public async Task<IActionResult> GetIterations(string jobId)
        {
            var iteraciones = await _context.JobIterations
                .Where(i => i.JobId == jobId)
                .OrderBy(i => i.Iteracion)
                .Select(i => new IteracionDTO  
                {
                    Iteracion = i.Iteracion,
                    Xi = i.Xi,
                    VectorX = i.VectorX,
                    Error = i.Error,
                    ErroresIndividuales = i.ErroresIndividuales,
                    DatosAdicionales = i.DatosAdicionales
                })
                .ToListAsync();

            if (!iteraciones.Any())
                return NotFound(new { message = "No hay iteraciones para este job" });

            return Ok(iteraciones);
        }    

    }

}