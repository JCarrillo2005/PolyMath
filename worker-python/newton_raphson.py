import numpy as np
import sympy as sp
import redis
import pyodbc
import json
from datetime import datetime

# ─────────────────────────────────────────────
# Configuración de Redis
# ─────────────────────────────────────────────
redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

# ─────────────────────────────────────────────
# Configuración de SQL Server (ajusta según tu BD)
# ─────────────────────────────────────────────
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=localhost;"
    "DATABASE=NewtonRaphsonDB;"
    "UID=your_username;"
    "PWD=your_password;"
    "Trusted_Connection=no;"
)

# ─────────────────────────────────────────────
# Función para crear tabla si no existe
# ─────────────────────────────────────────────
def create_table_if_not_exists():
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        create_table_query = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NewtonIterations' AND xtype='U')
        CREATE TABLE NewtonIterations (
            id INT IDENTITY(1,1) PRIMARY KEY,
            iteration INT NOT NULL,
            x_value FLOAT NOT NULL,
            error FLOAT NOT NULL,
            timestamp DATETIME NOT NULL,
            metadata NVARCHAR(500) NULL
        )
        """
        
        cursor.execute(create_table_query)
        conn.commit()
        cursor.close()
        conn.close()
        print("✅ Tabla 'NewtonIterations' verificada/creada exitosamente")
    except Exception as e:
        print(f"❌ Error creando tabla: {e}")

# ─────────────────────────────────────────────
# Función para guardar en SQL Server
# ─────────────────────────────────────────────
def save_to_sql(iteration, x_value, error):
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        insert_query = """
        INSERT INTO NewtonIterations (iteration, x_value, error, timestamp, metadata)
        VALUES (?, ?, ?, ?, ?)
        """
        
        metadata = json.dumps({
            "method": "Newton-Raphson",
            "function": "x^2 - 2"
        })
        
        cursor.execute(insert_query, (iteration, x_value, error, datetime.now(), metadata))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error guardando en SQL: {e}")
        return False

# ─────────────────────────────────────────────
# Función para guardar en Redis
# ─────────────────────────────────────────────
def save_to_redis(iteration, x_value, error):
    try:
        key = f"newton:iteration:{iteration}"
        data = {
            "iteration": iteration,
            "x_value": x_value,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        
        redis_client.set(key, json.dumps(data))
        redis_client.expire(key, 3600)  # Expira después de 1 hora
        
        # Guardar también en una lista cronológica
        redis_client.rpush("newton:all_iterations", json.dumps(data))
        
        return True
    except Exception as e:
        print(f"❌ Error guardando en Redis: {e}")
        return False

# ─────────────────────────────────────────────
# Función objetivo usando SymPy
# ─────────────────────────────────────────────
def setup_function():
    x = sp.Symbol('x')
    f_sym = x**2 - 2
    df_sym = sp.diff(f_sym, x)
    
    # Convertir a funciones numéricas para cálculo rápido
    f_num = sp.lambdify(x, f_sym, 'numpy')
    df_num = sp.lambdify(x, df_sym, 'numpy')
    
    return f_num, df_num, f_sym, df_sym

# ─────────────────────────────────────────────
# Algoritmo de Newton-Raphson con almacenamiento
# ─────────────────────────────────────────────
def newton_with_storage(f, df, x0, tol, max_iter=1000):
    """
    Método de Newton-Raphson que guarda iteraciones y errores en Redis y SQL Server
    """
    x1 = x0
    iterations_data = []
    
    print("Iter\t x_k\t\t\t Error")
    print("-" * 50)
    
    for k in range(1, max_iter + 1):
        fx = f(x0)
        dfx = df(x0)
        
        if dfx == 0:
            print(f"❌ Error: Derivada cero en iteración {k}")
            break
        
        x1 = x0 - fx / dfx
        error = abs(x1 - x0)
        
        # Guardar datos
        iterations_data.append({
            'iteration': k,
            'x_value': x1,
            'error': error
        })
        
        # Guardar en SQL Server
        save_to_sql(k, x1, error)
        
        # Guardar en Redis
        save_to_redis(k, x1, error)
        
        print(f"{k}\t {x1:.10f}\t {error:.2e}")
        
        # Criterio de convergencia
        if error <= tol and (error / abs(x1) if x1 != 0 else error) <= tol:
            print(f"\n✅ Convergencia alcanzada en {k} iteraciones")
            return x1, iterations_data
        
        x0 = x1
    
    print(f"\n⚠️  Máximo de iteraciones ({max_iter}) alcanzado sin convergencia")
    return x1, iterations_data

# ─────────────────────────────────────────────
# Función para recuperar datos históricos de Redis
# ─────────────────────────────────────────────
def get_history_from_redis():
    """Recupera todas las iteraciones guardadas en Redis"""
    try:
        all_data = redis_client.lrange("newton:all_iterations", 0, -1)
        if all_data:
            print("\n📊 Historial de Redis:")
            for data_str in all_data:
                data = json.loads(data_str)
                print(f"  Iter {data['iteration']}: x={data['x_value']:.6f}, error={data['error']:.2e}")
        else:
            print("  No hay datos en Redis")
    except Exception as e:
        print(f"❌ Error recuperando de Redis: {e}")

# ─────────────────────────────────────────────
# Función para recuperar datos de SQL
# ─────────────────────────────────────────────
def get_history_from_sql():
    """Recupera datos de SQL Server"""
    try:
        conn = pyodbc.connect(connection_string)
        cursor = conn.cursor()
        
        query = "SELECT iteration, x_value, error, timestamp FROM NewtonIterations ORDER BY iteration"
        cursor.execute(query)
        
        rows = cursor.fetchall()
        
        if rows:
            print("\n📊 Historial de SQL Server:")
            for row in rows:
                print(f"  Iter {row[0]}: x={row[1]:.6f}, error={row[2]:.2e}, time={row[3]}")
            
            # Resumen estadístico
            if len(rows) > 0:
                errors = [row[2] for row in rows]
                print(f"\n📈 Resumen:")
                print(f"  Total iteraciones: {len(rows)}")
                print(f"  Error final: {errors[-1]:.2e}")
                print(f"  Error inicial: {errors[0]:.2e}")
                print(f"  Reducción de error: {errors[0]/errors[-1]:.2f}x")
        else:
            print("  No hay datos en SQL Server")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error recuperando de SQL: {e}")

# ─────────────────────────────────────────────
# Función principal
# ─────────────────────────────────────────────
def main():
    print("=" * 60)
    print("MÉTODO DE NEWTON-RAPHSON - WORKER MODE")
    print("=" * 60)
    
    # Crear tabla en SQL si no existe
    create_table_if_not_exists()
    
    # Configurar función con SymPy
    f_num, df_num, f_sym, df_sym = setup_function()
    
    print(f"\n📐 Función objetivo: {f_sym}")
    print(f"   Derivada: {df_sym}")
    print(f"   Raíz esperada: √2 ≈ 1.4142135623730951")
    
    # Configuración del método
    x0 = 1.7
    tol = 1e-7
    max_iter = 100
    
    print(f"\n⚙️  Configuración:")
    print(f"   Punto inicial: {x0}")
    print(f"   Tolerancia: {tol}")
    print(f"   Máx iteraciones: {max_iter}")
    print(f"   Almacenamiento: Redis + SQL Server\n")
    
    # Ejecutar Newton-Raphson
    sqrt2, iterations = newton_with_storage(f_num, df_num, x0, tol, max_iter)
    
    print(f"\n🎯 Resultado final: √2 ≈ {sqrt2:.12f}")
    print(f"   Error teórico: {abs(sqrt2 - np.sqrt(2)):.2e}")
    
    # Mostrar historial completo
    print("\n" + "=" * 60)
    print("HISTORIAL DE DATOS ALMACENADOS")
    print("=" * 60)
    
    get_history_from_redis()
    get_history_from_sql()
    
    # Exportar datos a array numpy
    iterations_array = np.array([(item['iteration'], item['x_value'], item['error']) 
     for item in iterations])
    
    print(f"\n💾 Datos exportados a array numpy:")
    print(f"   Shape: {iterations_array.shape}")
    print(f"   Primeras 5 iteraciones:\n{iterations_array[:5]}")
    
    return sqrt2, iterations_array

# ─────────────────────────────────────────────
# Punto de entrada
# ─────────────────────────────────────────────
if __name__ == "__main__":
    result, data_array = main()