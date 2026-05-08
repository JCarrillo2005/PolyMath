import numpy as np

def gauss(A, b, tolerancia=1e-6, maxIteraciones=100):
    """
    Resuelve un sistema de ecuaciones lineales usando eliminación Gaussiana
    A: matriz de coeficientes
    b: vector de términos independientes
    """
    n = len(A)
    # Crear matriz aumentada
    Ab = np.hstack([A, b.reshape(-1, 1)]).astype(float)
    iteraciones = []
    converged = False
    
    # Eliminación hacia adelante
    for i in range(n):
        # Pivoteo parcial
        max_row = np.argmax(np.abs(Ab[i:, i])) + i
        if np.abs(Ab[max_row, i]) < tolerancia:
            raise ValueError(f"Matriz singular o mal condicionada en pivote {i}")
        
        if max_row != i:
            Ab[[i, max_row]] = Ab[[max_row, i]]
            iteraciones.append({
                'iteracion': len(iteraciones) + 1,
                'descripcion': f'Intercambio fila {i} con {max_row}',
                'matriz': Ab.copy().tolist()
            })
        
        # Normalizar y eliminar
        for j in range(i + 1, n):
            factor = Ab[j, i] / Ab[i, i]
            Ab[j, i:] -= factor * Ab[i, i:]
            iteraciones.append({
                'iteracion': len(iteraciones) + 1,
                'descripcion': f'Eliminar x{i} de fila {j}, factor={factor:.6f}',
                'matriz': Ab.copy().tolist()
            })
    
    # Sustitución hacia atrás
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (Ab[i, -1] - np.dot(Ab[i, i+1:n], x[i+1:n])) / Ab[i, i]
        iteraciones.append({
            'iteracion': len(iteraciones) + 1,
            'descripcion': f'Sustitución hacia atrás x{i}',
            'xi': x[i]
        })
    
    converged = True
    return x.tolist(), iteraciones, converged