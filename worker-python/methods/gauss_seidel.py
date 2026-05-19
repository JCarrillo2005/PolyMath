import numpy as np
import json

def gauss_seidel(parametros: dict) -> tuple:
    try:
        matrix_str = parametros.get('matrix')
        if not matrix_str:
            return None, [], False
        
        matriz_completa = np.array([list(map(float, row.split(','))) 
                                     for row in matrix_str.split(';')])
        A = matriz_completa[:, :-1]
        b = matriz_completa[:, -1]
        
        tolerancia = parametros.get('tolerancia', 1e-6)
        max_iter = parametros.get('maxIteraciones', 100)
        
        n = len(A)
        x = np.zeros(n)
        x_prev = np.copy(x)
        iteraciones = []
        
        for k in range(max_iter):
            x_prev = np.copy(x)
            errores_individuales = []  # Guardar errores por variable
            
            for i in range(n):
                sum1 = sum(A[i][j] * x[j] for j in range(i))
                sum2 = sum(A[i][j] * x_prev[j] for j in range(i + 1, n))
                x[i] = (b[i] - sum1 - sum2) / A[i][i]
                
                # Error relativo aproximado porcentual
                if x[i] != 0:
                    error_porcentual = abs((x[i] - x_prev[i]) / x[i]) * 100
                else:
                    error_porcentual = abs(x[i] - x_prev[i]) * 100
                errores_individuales.append(error_porcentual)
            
            error_max = max(errores_individuales) if errores_individuales else 0
            
            iteraciones.append({
                'iteracion': k + 1,
                'vector_x': x.tolist(),
                'error': error_max,
                'errores_individuales': errores_individuales,  # ← NUEVO
                'datos_adicionales': None
            })
            
            if error_max < tolerancia:
                return x.tolist(), iteraciones, True
        
        return x.tolist(), iteraciones, False
        
    except Exception as e:
        print(f"Error en Gauss-Seidel: {e}")
        return None, [], False