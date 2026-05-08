import numpy as np

def gauss_jordan(A, b, tolerancia=1e-6, maxIteraciones=100):
    """
    Resuelve un sistema de ecuaciones lineales usando el método de Gauss-Jordan
    A: matriz de coeficientes
    b: vector de términos independientes
    """
    n = len(A)
    # Crear matriz aumentada
    Ab = np.hstack([A, b.reshape(-1, 1)]).astype(float)
    iteraciones = []
    converged = False
    
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
        
        # Normalizar fila pivote
        pivote = Ab[i, i]
        Ab[i, :] /= pivote
        iteraciones.append({
            'iteracion': len(iteraciones) + 1,
            'descripcion': f'Normalizar fila {i}, pivote={pivote:.6f}',
            'matriz': Ab.copy().tolist()
        })
        
        # Eliminar en otras filas
        for j in range(n):
            if j != i:
                factor = Ab[j, i]
                Ab[j, :] -= factor * Ab[i, :]
                iteraciones.append({
                    'iteracion': len(iteraciones) + 1,
                    'descripcion': f'Eliminar x{i} de fila {j}, factor={factor:.6f}',
                    'matriz': Ab.copy().tolist()
                })
    
    x = Ab[:, -1]
    converged = True
    return x.tolist(), iteraciones, converged