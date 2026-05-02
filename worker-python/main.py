import json
import time
from redis_client import redis_client
from db import get_db_connection
from methods.newton import newton

def procesar_job(job_id: str):
    """
    Toma un jobId, procesa el método numérico y guarda resultados
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Obtener el job de la base de datos
        cursor.execute(
            "SELECT Metodo, ParametrosJson FROM Jobs WHERE JobId = ? AND Estado = 'PENDING'",
            (job_id,)
        )
        row = cursor.fetchone()
        
        if not row:
            print(f"Job {job_id} no encontrado o ya procesado")
            return
        
        metodo, parametros_json = row
        parametros = json.loads(parametros_json)
        
        # 2. Actualizar estado a RUNNING
        cursor.execute(
            "UPDATE Jobs SET Estado = 'RUNNING', ActualizadoEn = GETUTCDATE() WHERE JobId = ?",
            (job_id,)
        )
        conn.commit()
        print(f"Job {job_id} - Estado: RUNNING")
        
        # 3. Ejecutar el método numérico
        start_time = time.time()
        resultado = None
        iteraciones = []
        converged = False
        
        if metodo == 'newton':
            resultado, iteraciones, converged = newton(
                parametros.get('funcion'),
                parametros.get('x0'),
                parametros.get('tolerancia', 1e-6),
                parametros.get('maxIteraciones', 100)
            )
        
        tiempo_ms = int((time.time() - start_time) * 1000)
        
        # 4. Guardar iteraciones
        for it in iteraciones:
            cursor.execute("""
                INSERT INTO JobIterations (JobId, Iteracion, Xi, Error)
                VALUES (?, ?, ?, ?)
            """, job_id, it['iteracion'], str(it['xi']), it['error'])
        
        # 5. Actualizar estado final
        estado_final = 'DONE' if converged else 'FAILED'
        cursor.execute("""
            UPDATE Jobs 
            SET Estado = ?, 
                Resultado = ?,
                Converged = ?,
                TiempoEjecucionMs = ?,
                ActualizadoEn = GETUTCDATE()
            WHERE JobId = ?
        """, estado_final, str(resultado), converged, tiempo_ms, job_id)
        
        conn.commit()
        print(f"Job {job_id} - Estado: {estado_final} en {tiempo_ms}ms")
        
    except Exception as e:
        print(f"Error procesando job {job_id}: {e}")
        cursor.execute(
            "UPDATE Jobs SET Estado = 'FAILED', ErrorMensaje = ?, ActualizadoEn = GETUTCDATE() WHERE JobId = ?",
            (str(e), job_id)
        )
        conn.commit()
    
    finally:
        cursor.close()
        conn.close()

def main():
    print("Worker iniciado. Esperando jobs...")
    
    while True:
        try:
            # BLPOP: espera bloqueante hasta que llegue un job
            resultado = redis_client.blpop("job_queue", timeout=30)
            
            if resultado:
                _, job_id = resultado
                print(f"Job {job_id} recibido de Redis")
                procesar_job(job_id)
            else:
                print("No hay jobs en cola. Esperando...")
                
        except KeyboardInterrupt:
            print("\nWorker detenido por el usuario")
            break
        except Exception as e:
            print(f"Error en el loop principal: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()