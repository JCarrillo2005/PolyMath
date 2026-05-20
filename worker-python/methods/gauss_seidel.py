import numpy as np
import json

def gauss_seidel(parametros: dict) -> tuple:
    try:
        matrix_str = parametros.get('matrix')
        if not matrix_str:
            raise ValueError("No se encontró 'matrix' en los parámetros")
        
        try:
            matriz_completa = np.array([list(map(float, row.split(','))) 
                                         for row in matrix_str.split(';')])
        except Exception as e:
            raise ValueError(f"Error en formato de matriz: {str(e)}")
        
        A = matriz_completa[:, :-1]
        b = matriz_completa[:, -1]
        
        tolerancia = parametros.get('tolerancia', 1e-6)
        max_iter = parametros.get('maxIteraciones', 100)
        
        n = len(A)
        
        # Verificar diagonales con ceros
        for i in range(n):
            if abs(A[i][i]) < 1e-12:
                raise ZeroDivisionError(
                    f"Elemento diagonal A[{i}][{i}] = {A[i][i]} es cero. "
                    "El método no puede continuar."
                )
        
        x = np.zeros(n)
        x_prev = np.copy(x)
        iteraciones = []
        
        for k in range(max_iter):
            x_prev = np.copy(x)
            errores_individuales = []
            
            for i in range(n):
                sum1 = sum(A[i][j] * x[j] for j in range(i))
                sum2 = sum(A[i][j] * x_prev[j] for j in range(i + 1, n))
                x[i] = (b[i] - sum1 - sum2) / A[i][i]
                
                if x[i] != 0:
                    error_porcentual = abs((x[i] - x_prev[i]) / x[i]) * 100
                else:
                    error_porcentual = abs(x[i] - x_prev[i]) * 100
                errores_individuales.append(float(error_porcentual))
            
            error_max = max(errores_individuales) if errores_individuales else 0
            
            iteraciones.append({
                'iteracion': k + 1,
                'vector_x': x.tolist(),
                'error': float(error_max),
                'errores_individuales': errores_individuales,
                'datos_adicionales': None
            })
            
            if error_max < tolerancia:
                return x.tolist(), iteraciones, True
        
        # No convergió en max_iter
        return x.tolist(), iteraciones, False
        
    except ZeroDivisionError as e:
        raise ZeroDivisionError(f"Gauss-Seidel: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Error en Gauss-Seidel: {str(e)}")