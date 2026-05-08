import numpy as np

def gauss_seidel(A, b, x0=None, tolerancia=1e-6, maxIteraciones=100):
    """
    Resuelve un sistema de ecuaciones lineales usando el método de Gauss-Seidel
    A: matriz de coeficientes (debe ser diagonal dominante)
    b: vector de términos independientes
    x0: vector inicial
    """
    n = len(A)
    if x0 is None:
        x0 = np.zeros(n)
    
    x = np.array(x0, dtype=float)
    x_prev = np.copy(x)
    iteraciones = []
    converged = False
    
    for k in range(maxIteraciones):
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
            'xi': x.copy().tolist(),
            'error': error_max
        })
        
        if error_max < tolerancia:
            converged = True
            break
    
    return x.tolist(), iteraciones, converged