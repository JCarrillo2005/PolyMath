import numpy as np
import json

def gauss_seidel(parametros: dict) -> tuple:
    """
    Resuelve sistema lineal Ax = b usando Gauss-Seidel (iterativo)
    Recomendado para matrices diagonalmente dominantes
    """
    try:
        # Parsear entrada
        matrix_str = parametros.get('matrix')
        vector_str = parametros.get('vector')
        
        if not matrix_str or not vector_str:
            return None, [], False
        
        A = np.array([list(map(float, row.split(','))) 
                      for row in matrix_str.split(';')])
        b = np.array([float(x) for x in vector_str.split(';')])
        
        tolerancia = parametros.get('tolerancia', 1e-6)
        max_iter = parametros.get('maxIteraciones', 100)
        
        n = len(A)
        x = np.zeros(n)  # vector inicial
        iteraciones = []
        
        for k in range(max_iter):
            x_prev = np.copy(x)
            error_max = 0
            
            for i in range(n):
                sum1 = sum(A[i][j] * x[j] for j in range(i))
                sum2 = sum(A[i][j] * x_prev[j] for j in range(i + 1, n))
                x[i] = (b[i] - sum1 - sum2) / A[i][i]
                
                error = abs(x[i] - x_prev[i])
                if error > error_max:
                    error_max = error
            
            iteraciones.append({
                'iteracion': k + 1,
                'vector_x': x.tolist(),
                'error': error_max,
                'datos_adicionales': None
            })
            
            if error_max < tolerancia:
                return x.tolist(), iteraciones, True
        
        return x.tolist(), iteraciones, False  # No convergió en max_iter
        
    except Exception as e:
        print(f"Error en Gauss-Seidel: {e}")
        return None, [], False