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
        private readonly ILogger<JobsController> _logger;

        public JobsController(ApplicationDbContext context, IConnectionMultiplexer redis, ILogger<JobsController> logger) 
        {
            _context = context;
            _redis = redis;
            _logger = logger; 
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
                // Log con información
                _logger.LogInformation("Endpoint (POST api/jobs) consumido");
                _logger.LogInformation("Job {JobId} creado y encolado en Redis", job.JobId);

                return Ok(new
                {
                    jobId = job.JobId,
                    estado = job.Estado,
                    message = "Job creado exitosamente"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear job");
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
            _logger.LogInformation("Consultando job {JobId}", jobId);

            var jobEntity = await _context.Jobs
                .Where(j => j.JobId == jobId)
                .FirstOrDefaultAsync();

            if (jobEntity == null)
            {
                _logger.LogWarning("Job {JobId} no encontrado", jobId);
                return NotFound(new { error = "Job no encontrado" });
            }


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
            _logger.LogInformation("Endpoint (GET api/jobs/{JobId}) consumido", jobId);
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
            _logger.LogInformation("Endpoint (GET api/jobs) consumido");
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

            _logger.LogInformation("Endpoint (GET api/jobs/{JobId}/iterations) consumido", jobId);
            return Ok(iteraciones);
        }

        // GET api/stats/jobs-by-status
        [HttpGet("stats/jobs-by-status")]
        public async Task<IActionResult> GetJobsByStatus()
        {
            var jobs = await _context.Jobs.ToListAsync();

            var stats = jobs
                .GroupBy(j => j.Estado)
                .Select(g => new {
                    estado = g.Key,
                    cantidad = g.Count()
                })
                .OrderBy(s => s.estado);

            _logger.LogInformation("Endpoint (GET api/stats/jobs-by-status) consumido");
            return Ok(stats);
        }

        // GET api/stats/jobs-by-method
        [HttpGet("stats/jobs-by-method")]
        public async Task<IActionResult> GetJobsByMethod()
        {
            var jobs = await _context.Jobs.ToListAsync();

            var stats = jobs
                .GroupBy(j => j.Metodo)
                .Select(g => new {
                    metodo = g.Key,
                    cantidad = g.Count()
                })
                .OrderByDescending(s => s.cantidad);

            _logger.LogInformation("Endpoint (GET api/stats/jobs-by-method) consumido");
            return Ok(stats);
        }

        // GET api/stats/convergence
        [HttpGet("stats/convergence")]
        public async Task<IActionResult> GetConvergenceStats()
        {

            var allJobs = await _context.Jobs.ToListAsync();
            var totalJobs = allJobs.Count;

            // Jobs DONE 
            var jobsDone = allJobs.Where(j => j.Estado == "DONE" && j.Converged.HasValue).ToList();
            var convergedJobs = jobsDone.Count(j => j.Converged == true);
            var tasaConvergencia = totalJobs > 0 ? (double)convergedJobs / totalJobs * 100 : 0;

             //Promedio de iteraciones
            var iteraciones = await _context.JobIterations.ToListAsync();
            var promedioIteraciones = iteraciones
                .GroupBy(i => i.JobId)
                .Select(g => g.Count())
                .DefaultIfEmpty(0)
                .Average();

            _logger.LogInformation("Endpoint (GET api/stats/convergence) consumido");
            return Ok(new
            {
                tasaConvergencia = Math.Round(tasaConvergencia, 2),
                promedioIteraciones = Math.Round(promedioIteraciones, 2),
                totalJobs = totalJobs,
                convergedJobs = convergedJobs,
                failedJobs = allJobs.Count(j => j.Estado == "FAILED")
            });
    
        }

        // POST api/compare/roots
        [HttpPost("compare/roots")]
        public async Task<IActionResult> CompareRoots([FromBody] CompareRootsRequestDTO request)
        {
            try
            {
                // Validar
                if (request.Metodos == null || request.Metodos.Count == 0)
                    return BadRequest(new { error = "Debe seleccionar al menos un método" });

                var metodosValidos = new[] { "newton", "secante", "muller" };
                var metodosInvalidos = request.Metodos.Where(m => !metodosValidos.Contains(m)).ToList();
                if (metodosInvalidos.Any())
                    return BadRequest(new { error = $"Métodos inválidos: {string.Join(",", metodosInvalidos)}" });

                // Crear Comparison
                var comparison = new Comparison
                {
                    ComparisonId = Guid.NewGuid().ToString(),
                    Funcion = request.Funcion,
                    X0 = request.X0,
                    X1 = request.X1,
                    X2 = request.X2,
                    Tolerancia = request.Tolerancia,
                    MaxIteraciones = request.MaxIteraciones,
                    MetodosUsados = JsonSerializer.Serialize(request.Metodos),
                    Tipo = "raices",
                    CreadoEn = DateTime.UtcNow
                };

                _context.Comparisons.Add(comparison);
                await _context.SaveChangesAsync();

                // Crear jobs para cada método
                var jobs = new List<Job>();
                var db = _redis.GetDatabase();

                foreach (var metodo in request.Metodos)
                {
                    var parametros = CrearParametrosParaMetodo(metodo, request);

                    var job = new Job
                    {
                        JobId = Guid.NewGuid().ToString(),
                        Metodo = metodo,
                        Estado = "PENDING",
                        ParametrosJson = JsonSerializer.Serialize(parametros),
                        ComparisonId = comparison.ComparisonId,
                        CreadoEn = DateTime.UtcNow,
                        ActualizadoEn = DateTime.UtcNow
                    };

                    _context.Jobs.Add(job);
                    jobs.Add(job);
                }

                await _context.SaveChangesAsync();

                // Encolar jobs en Redis
                foreach (var job in jobs)
                {
                    await db.ListRightPushAsync("job_queue", job.JobId);
                    _logger.LogInformation("Job {JobId} encolado para comparación {ComparisonId}", job.JobId, comparison.ComparisonId);
                }

                _logger.LogInformation("Comparación {ComparisonId} creada con {Count} jobs",
                    comparison.ComparisonId, jobs.Count);

                return Ok(new CompareRootsResponseDTO
                {
                    ComparisonId = comparison.ComparisonId,
                    Jobs = jobs.Select(j => new JobReferenceDTO { JobId = j.JobId, Metodo = j.Metodo }).ToList(),
                    Message = "Comparación creada exitosamente"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear comparación");
                return StatusCode(500, new { error = "Error interno al crear la comparación", details = ex.Message });
            }
        }

        // GET api/compare/roots/{comparisonId}
        [HttpGet("compare/roots/{comparisonId}")]
        public async Task<IActionResult> GetComparisonResult(string comparisonId)
        {
            var comparison = await _context.Comparisons
                .FirstOrDefaultAsync(c => c.ComparisonId == comparisonId);

            if (comparison == null)
                return NotFound(new { error = "Comparación no encontrada" });

            var jobs = await _context.Jobs
                .Where(j => j.ComparisonId == comparisonId)
                .ToListAsync();

            var metodosUsados = JsonSerializer.Deserialize<List<string>>(comparison.MetodosUsados) ?? new List<string>();

            var resultados = new List<MethodResultDTO>();

            foreach (var metodo in metodosUsados)
            {
                var job = jobs.FirstOrDefault(j => j.Metodo == metodo);
                if (job != null)
                {
                    var iteraciones = await _context.JobIterations
                        .Where(i => i.JobId == job.JobId)
                        .OrderBy(i => i.Iteracion)
                        .ToListAsync();

                    resultados.Add(new MethodResultDTO
                    {
                        Metodo = metodo,
                        JobId = job.JobId,
                        Raiz = job.Resultado,
                        Iteraciones = iteraciones.Count,
                        ErrorFinal = job.Estado == "DONE" && job.ErrorMensaje == null && iteraciones.Any() ?
                            (double?)iteraciones.Last().Error : null,
                        Convergio = job.Converged == true,
                        TiempoEjecucionMs = job.TiempoEjecucionMs,
                        Estado = job.Estado,
                        ErrorMensaje = job.ErrorMensaje
                    });
                }
                else
                {
                    resultados.Add(new MethodResultDTO
                    {
                        Metodo = metodo,
                        JobId = string.Empty,
                        Convergio = false,
                        Estado = "NOT_FOUND",
                        ErrorMensaje = "Job no encontrado"
                    });
                }
            }

            var result = new ComparisonResultDTO
            {
                ComparisonId = comparison.ComparisonId,
                ParametrosComunes = new ComparisonParamsDTO
                {
                    Funcion = comparison.Funcion,
                    Tolerancia = comparison.Tolerancia,
                    MaxIteraciones = comparison.MaxIteraciones
                },
                Resultados = resultados,
                CreadoEn = comparison.CreadoEn
            };

            _logger.LogInformation("Resultado de comparación {ComparisonId} consultado", comparisonId);
            return Ok(result);
        }

        // GET api/compare/history
        [HttpGet("compare/history")]
        public async Task<IActionResult> GetComparisonHistory()
        {
            try
            {
                var comparisons = await _context.Comparisons
                    .Where(c => c.Tipo == "raices" || c.Tipo == null) // Filtrar solo raíces.
                    .OrderByDescending(c => c.CreadoEn)
                    .Select(c => new
                    {
                        c.ComparisonId,
                        c.Funcion,
                        c.X0,
                        c.X1,
                        c.X2,
                        c.Tolerancia,
                        c.MaxIteraciones,
                        c.MetodosUsados,
                        c.CreadoEn,
                        Jobs = _context.Jobs
                            .Where(j => j.ComparisonId == c.ComparisonId)
                            .Select(j => new
                            {
                                j.JobId,
                                j.Metodo,
                                j.Estado,
                                j.Converged,
                                j.Resultado,
                                j.TiempoEjecucionMs
                            })
                            .ToList()
                    })
                    .ToListAsync();

                _logger.LogInformation("Endpoint (GET api/compare/history) consumido - {Count} comparaciones de raíces encontradas", comparisons.Count);
                return Ok(comparisons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener historial de comparaciones");
                return StatusCode(500, new { error = "Error al obtener el historial" });
            }
        }

        // GET api/compare/history/{comparisonId}
        [HttpGet("compare/history/{comparisonId}")]
        public async Task<IActionResult> GetComparisonById(string comparisonId)
        {
            try
            {
                var comparison = await _context.Comparisons
                    .Where(c => c.ComparisonId == comparisonId && (c.Tipo == "raices" || c.Tipo == null))
                    .Select(c => new
                    {
                        c.ComparisonId,
                        c.Funcion,
                        c.X0,
                        c.X1,
                        c.X2,
                        c.Tolerancia,
                        c.MaxIteraciones,
                        c.MetodosUsados,
                        c.CreadoEn,
                        Jobs = _context.Jobs
                            .Where(j => j.ComparisonId == c.ComparisonId)
                            .Select(j => new
                            {
                                j.JobId,
                                j.Metodo,
                                j.Estado,
                                j.Converged,
                                j.Resultado,
                                j.TiempoEjecucionMs,
                                j.ErrorMensaje
                            })
                            .ToList()
                    })
                    .FirstOrDefaultAsync();

                if (comparison == null)
                {
                    return NotFound(new { error = "Comparación no encontrada" });
                }

                _logger.LogInformation("Endpoint (GET api/compare/history/{ComparisonId}) consumido", comparisonId);
                return Ok(comparison);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener comparación {ComparisonId}", comparisonId);
                return StatusCode(500, new { error = "Error al obtener la comparación" });
            }
        }

        // Método auxiliar para crear parámetros según el método
        private Dictionary<string, object> CrearParametrosParaMetodo(string metodo, CompareRootsRequestDTO request)
        {
            var parametros = new Dictionary<string, object>
            {
                ["funcion"] = request.Funcion,
                ["tolerancia"] = request.Tolerancia,
                ["maxIteraciones"] = request.MaxIteraciones
            };

            switch (metodo)
            {
                case "newton":
                    parametros["x0"] = request.X0;
                    break;
                case "secante":
                    parametros["x0"] = request.X0;
                    parametros["x1"] = request.X1;
                    break;
                case "muller":
                    parametros["x0"] = request.X0;
                    parametros["x1"] = request.X1;
                    parametros["x2"] = request.X2;
                    break;
            }

            return parametros;
        }

        // POST api/compare/matrices
        [HttpPost("compare/matrices")]
        public async Task<IActionResult> CompareMatrices([FromBody] CompareMatricesRequestDTO request)
        {
            try
            {
                // Validar matriz
                if (string.IsNullOrWhiteSpace(request.Matrix))
                    return BadRequest(new { error = "La matriz no puede estar vacía" });

                // Validar formato básico
                var rows = request.Matrix.Split(';');
                if (rows.Length == 0 || rows.Length > 10)
                    return BadRequest(new { error = "La matriz debe tener entre 1 y 10 filas" });

                // Crear Comparison
                var comparison = new Comparison
                {
                    ComparisonId = Guid.NewGuid().ToString(),
                    Funcion = "", // No aplica para matrices
                    X0 = null,
                    X1 = null,
                    X2 = null,
                    Tolerancia = 0,
                    MaxIteraciones = 0,
                    MetodosUsados = JsonSerializer.Serialize(new[] { "gauss", "gaussJordan" }),
                    Tipo = "matrices",  // Nuevo campo para distinguir
                    CreadoEn = DateTime.UtcNow
                };

                _context.Comparisons.Add(comparison);
                await _context.SaveChangesAsync();

                // Crear jobs para Gauss y Gauss-Jordan
                var jobs = new List<Job>();
                var db = _redis.GetDatabase();
                var metodos = new[] { "gauss", "gaussJordan" };

                foreach (var metodo in metodos)
                {
                    var parametros = new Dictionary<string, object>
                    {
                        ["matrix"] = request.Matrix
                    };

                    var job = new Job
                    {
                        JobId = Guid.NewGuid().ToString(),
                        Metodo = metodo,
                        Estado = "PENDING",
                        ParametrosJson = JsonSerializer.Serialize(parametros),
                        ComparisonId = comparison.ComparisonId,
                        CreadoEn = DateTime.UtcNow,
                        ActualizadoEn = DateTime.UtcNow
                    };

                    _context.Jobs.Add(job);
                    jobs.Add(job);
                }

                await _context.SaveChangesAsync();

                // Encolar jobs en Redis
                foreach (var job in jobs)
                {
                    await db.ListRightPushAsync("job_queue", job.JobId);
                    _logger.LogInformation("Job {JobId} encolado para comparación de matrices {ComparisonId}", job.JobId, comparison.ComparisonId);
                }

                _logger.LogInformation("Comparación de matrices {ComparisonId} creada con {Count} jobs",
                    comparison.ComparisonId, jobs.Count);

                return Ok(new MatrixComparisonResponseDTO
                {
                    ComparisonId = comparison.ComparisonId,
                    Jobs = jobs.Select(j => new MatrixJobReferenceDTO { JobId = j.JobId, Metodo = j.Metodo }).ToList(),
                    Message = "Comparación de matrices creada exitosamente"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al crear comparación de matrices");
                return StatusCode(500, new { error = "Error interno al crear la comparación de matrices", details = ex.Message });
            }
        }

        // GET api/compare/matrices/{comparisonId}
        [HttpGet("compare/matrices/{comparisonId}")]
        public async Task<IActionResult> GetMatrixComparison(string comparisonId)
        {
            try
            {
                var comparison = await _context.Comparisons
                    .FirstOrDefaultAsync(c => c.ComparisonId == comparisonId && c.Tipo == "matrices");

                if (comparison == null)
                    return NotFound(new { error = "Comparación de matrices no encontrada" });

                var jobs = await _context.Jobs
                    .Where(j => j.ComparisonId == comparisonId)
                    .ToListAsync();

                var resultados = new List<MatrixMethodResultDTO>();

                foreach (var job in jobs)
                {
                    var pasos = new List<MatrixStepDTO>();

                    // Obtener iteraciones/pasos del job
                    var iteraciones = await _context.JobIterations
                        .Where(i => i.JobId == job.JobId)
                        .OrderBy(i => i.Iteracion)
                        .ToListAsync();

                    foreach (var iter in iteraciones)
                    {
                        var paso = new MatrixStepDTO
                        {
                            Iteracion = iter.Iteracion
                        };

                        // Extraer información de DatosAdicionales
                        if (!string.IsNullOrEmpty(iter.DatosAdicionales))
                        {
                            try
                            {
                                var datos = JsonSerializer.Deserialize<Dictionary<string, object>>(iter.DatosAdicionales);
                                if (datos != null)
                                {
                                    paso.Descripcion = datos.GetValueOrDefault("descripcion")?.ToString();

                                    if (datos.ContainsKey("matriz"))
                                    {
                                        var matrizObj = datos["matriz"];
                                        paso.Matriz = JsonSerializer.Deserialize<double[][]>(JsonSerializer.Serialize(matrizObj));
                                    }

                                    if (datos.ContainsKey("factor") && datos["factor"] != null)
                                    {
                                        paso.Factor = Convert.ToDouble(datos["factor"]);
                                    }
                                }
                            }
                            catch (Exception ex)
                            {
                                _logger.LogWarning(ex, "Error parseando DatosAdicionales para job {JobId}, iteración {Iteracion}", job.JobId, iter.Iteracion);
                            }
                        }

                        pasos.Add(paso);
                    }

                    // Extraer solución del resultado
                    string? solucion = null;
                    if (job.Estado == "DONE" && !string.IsNullOrEmpty(job.Resultado))
                    {
                        try
                        {
                            var solucionArray = JsonSerializer.Deserialize<List<double>>(job.Resultado);
                            if (solucionArray != null)
                            {
                                solucion = $"[{string.Join(", ", solucionArray)}]";
                            }
                            else
                            {
                                solucion = job.Resultado;
                            }
                        }
                        catch
                        {
                            solucion = job.Resultado;
                        }
                    }

                    resultados.Add(new MatrixMethodResultDTO
                    {
                        Metodo = job.Metodo,
                        JobId = job.JobId,
                        Solucion = solucion,
                        NumeroPasos = pasos.Count,
                        TiempoEjecucionMs = job.TiempoEjecucionMs,
                        Convergio = job.Converged == true,
                        Estado = job.Estado,
                        ErrorMensaje = job.ErrorMensaje,
                        Pasos = pasos
                    });
                }

                var result = new MatrixComparisonResultDTO
                {
                    ComparisonId = comparison.ComparisonId,
                    MatrizOriginal = jobs.FirstOrDefault()?.ParametrosJson != null ?
                        (JsonSerializer.Deserialize<Dictionary<string, object>>(jobs.First().ParametrosJson)?.GetValueOrDefault("matrix")?.ToString() ?? "") : "",
                    Resultados = resultados,
                    CreadoEn = comparison.CreadoEn
                };

                _logger.LogInformation("Resultado de comparación de matrices {ComparisonId} consultado", comparisonId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener comparación de matrices {ComparisonId}", comparisonId);
                return StatusCode(500, new { error = "Error al obtener la comparación de matrices" });
            }
        }

        // GET api/compare/matrices/history
        [HttpGet("compare/matrices/history")]
        public async Task<IActionResult> GetMatrixComparisonHistory()
        {
            try
            {
                var comparisons = await _context.Comparisons
                    .Where(c => c.Tipo == "matrices")
                    .OrderByDescending(c => c.CreadoEn)
                    .Select(c => new MatrixComparisonHistoryDTO
                    {
                        ComparisonId = c.ComparisonId,
                        CreadoEn = c.CreadoEn,
                        Jobs = _context.Jobs
                            .Where(j => j.ComparisonId == c.ComparisonId)
                            .Select(j => new MatrixHistoryJobDTO
                            {
                                JobId = j.JobId,
                                Metodo = j.Metodo,
                                Estado = j.Estado,
                                Converged = j.Converged == true,
                                Resultado = j.Resultado,
                                TiempoEjecucionMs = j.TiempoEjecucionMs
                            })
                            .ToList()
                    })
                    .ToListAsync();

                // Obtener las matrices originales
                foreach (var comp in comparisons)
                {
                    var firstJob = comp.Jobs.FirstOrDefault();
                    if (firstJob != null)
                    {
                        var jobEntity = await _context.Jobs
                            .Where(j => j.JobId == firstJob.JobId)
                            .Select(j => j.ParametrosJson)
                            .FirstOrDefaultAsync();

                        if (jobEntity != null)
                        {
                            var parametros = JsonSerializer.Deserialize<Dictionary<string, object>>(jobEntity);
                            comp.MatrizOriginal = parametros?.GetValueOrDefault("matrix")?.ToString() ?? "";
                        }
                    }
                }

                _logger.LogInformation("Endpoint (GET api/compare/matrices/history) consumido - {Count} comparaciones encontradas", comparisons.Count);
                return Ok(comparisons);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al obtener historial de comparaciones de matrices");
                return StatusCode(500, new { error = "Error al obtener el historial" });
            }
        }


    }

}