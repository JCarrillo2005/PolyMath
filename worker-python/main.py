import json
import time
from redis_client import redis_client
from db import get_db_connection
from methods.newton import newton
from methods.secante import secante
from methods.muller import muller
from methods.gauss import gauss
from methods.gauss_jordan import gauss_jordan
from methods.gauss_seidel import gauss_seidel

def procesar_job(job_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
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
        
        cursor.execute(
            "UPDATE Jobs SET Estado = 'RUNNING', ActualizadoEn = GETUTCDATE() WHERE JobId = ?",
            (job_id,)
        )
        conn.commit()
        print(f"Job {job_id} - Estado: RUNNING")
        
        start_time = time.time()
        resultado = None
        iteraciones = []
        converged = False
        
        # MÉTODOS DE RAÍCES
        if metodo == 'newton':
            resultado, iteraciones, converged = newton(
                parametros.get('funcion'),
                parametros.get('x0'),
                parametros.get('tolerancia', 1e-6),
                parametros.get('maxIteraciones', 100)
            )
        elif metodo == 'secante':
            resultado, iteraciones, converged = secante(
                parametros.get('funcion'),
                parametros.get('x0'),
                parametros.get('x1'),
                parametros.get('tolerancia', 1e-6),
                parametros.get('maxIteraciones', 100)
            )
        elif metodo == 'muller':
            resultado, iteraciones, converged = muller(
                parametros.get('funcion'),
                parametros.get('x0'),
                parametros.get('x1'),
                parametros.get('x2'),
                parametros.get('tolerancia', 1e-6),
                parametros.get('maxIteraciones', 100)
            )
        # MÉTODOS DE SISTEMAS LINEALES
        elif metodo == 'gauss':
            resultado, iteraciones, converged = gauss(parametros)
        elif metodo == 'gaussSeidel':
            resultado, iteraciones, converged = gauss_seidel(parametros)
        elif metodo == 'gaussJordan':
            resultado, iteraciones, converged = gauss_jordan(parametros)
        else:
            print(f"Método desconocido: {metodo}")
            cursor.execute(
                "UPDATE Jobs SET Estado = 'FAILED', ErrorMensaje = ?, ActualizadoEn = GETUTCDATE() WHERE JobId = ?",
                (f"Método no implementado: {metodo}", job_id)
            )
            conn.commit()
            return
        
        tiempo_ms = int((time.time() - start_time) * 1000)
        
        # GUARDAR ITERACIONES
        for it in iteraciones:
            xi_value = it.get('xi')
            vector_x_value = it.get('vector_x')
            error_value = it.get('error')
            datos_adicionales = it.get('datos_adicionales')
            
            cursor.execute("""
                INSERT INTO JobIterations (JobId, Iteracion, Xi, VectorX, Error, DatosAdicionales)
                VALUES (?, ?, ?, ?, ?, ?)
            """, job_id, it['iteracion'], 
                str(xi_value) if xi_value is not None else None,
                json.dumps(vector_x_value) if vector_x_value is not None else None,
                error_value,
                datos_adicionales
            )
        
        estado_final = 'DONE' if converged else 'FAILED'
        cursor.execute("""
            UPDATE Jobs 
            SET Estado = ?, 
                Resultado = ?,
                Converged = ?,
                TiempoEjecucionMs = ?,
                ActualizadoEn = GETUTCDATE()
            WHERE JobId = ?
        """, estado_final, str(resultado) if resultado is not None else None, 
            converged, tiempo_ms, job_id)
        
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