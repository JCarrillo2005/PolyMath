import json
import time
import numpy as np
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
        # IDEMPOTENCIA: Verificar que el job no esté ya DONE o RUNNING
        cursor.execute(
            "SELECT Estado FROM Jobs WHERE JobId = ?",
            (job_id,)
        )
        row = cursor.fetchone()
        
        if not row:
            print(f"Job {job_id} no encontrado")
            return
        
        estado_actual = row[0]
        
        # Si ya está DONE o RUNNING, no re-ejecutar
        if estado_actual in ('DONE', 'RUNNING'):
            print(f"Job {job_id} ya está {estado_actual}. Ignorando por idempotencia.")
            return
        
        # Solo procesar si está PENDING
        if estado_actual != 'PENDING':
            print(f"Job {job_id} tiene estado {estado_actual}. No se procesa.")
            return
        
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
        error_mensaje = None
        
        try:
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
                error_mensaje = f"Método no implementado: {metodo}"
                print(error_mensaje)
                cursor.execute(
                    "UPDATE Jobs SET Estado = 'FAILED', ErrorMensaje = ?, ActualizadoEn = GETUTCDATE() WHERE JobId = ?",
                    (error_mensaje, job_id)
                )
                conn.commit()
                return
                
        except ZeroDivisionError as e:
            # División por cero (Newton, Secante, Muller)
            error_mensaje = str(e)
            converged = False
            print(f"División por cero en {metodo}: {error_mensaje}")
            
        except ValueError as e:
            # Error de parsing (expresión inválida) o formato de matriz
            error_mensaje = str(e)
            converged = False
            print(f"Error de valor en {metodo}: {error_mensaje}")
            
        except RuntimeError as e:
            # Diagonal con ceros (Gauss-Seidel) u otros errores
            error_mensaje = str(e)
            converged = False
            print(f"Error en {metodo}: {error_mensaje}")
            
        except np.linalg.LinAlgError as e:
            # Matriz singular (Gauss, Gauss-Jordan)
            error_mensaje = str(e)
            converged = False
            print(f"Matriz singular en {metodo}: {error_mensaje}")
            
        except Exception as e:
            # Otros errores no clasificados
            error_mensaje = str(e)
            converged = False
            print(f"Error inesperado en {metodo}: {error_mensaje}")
        
        tiempo_ms = int((time.time() - start_time) * 1000)
        
        # GUARDAR ITERACIONES
        if iteraciones:
            for it in iteraciones:
                xi_value = it.get('xi')
                vector_x_value = it.get('vector_x')
                error_value = it.get('error')
                datos_adicionales = it.get('datos_adicionales')
                
                cursor.execute("""
                    INSERT INTO JobIterations (JobId, Iteracion, Xi, VectorX, Error, ErroresIndividuales, DatosAdicionales)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, job_id, it['iteracion'], 
                    str(xi_value) if xi_value is not None else None,
                    json.dumps(vector_x_value) if vector_x_value is not None else None,
                    error_value,
                    json.dumps(it.get('errores_individuales')) if it.get('errores_individuales') is not None else None,
                    datos_adicionales
                )
        
        # DETERMINAR ESTADO FINAL
        if error_mensaje:
            estado_final = 'FAILED'
        else:
            estado_final = 'DONE'
            if not converged:
                print(f"Job {job_id} - Advertencia: Máximo de iteraciones alcanzado ({parametros.get('maxIteraciones', 100)})")
        
        # ACTUALIZAR JOB
        cursor.execute("""
            UPDATE Jobs 
            SET Estado = ?, 
                Resultado = ?,
                Converged = ?,
                TiempoEjecucionMs = ?,
                ErrorMensaje = ?,
                ActualizadoEn = GETUTCDATE()
            WHERE JobId = ?
        """, estado_final, str(resultado) if resultado is not None else None, 
            converged, tiempo_ms, error_mensaje, job_id)
        
        conn.commit()
        print(f"Job {job_id} - Estado: {estado_final} | Converged: {converged} en {tiempo_ms}ms")
        if error_mensaje:
            print(f"Job {job_id} - Error: {error_mensaje}")
        
    except Exception as e:
        print(f"Error procesando job {job_id}: {e}")
        cursor.execute(
            "UPDATE Jobs SET Estado = 'FAILED', ErrorMensaje = ?, ActualizadoEn = GETUTCDATE() WHERE JobId = ?",
            (f"Error en procesamiento: {str(e)}", job_id)
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