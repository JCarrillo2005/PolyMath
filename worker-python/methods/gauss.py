import numpy as np
import json

def gauss(parametros: dict) -> tuple:
    """
    Resuelve sistema lineal Ax = b usando eliminación Gaussiana
    Recibe matriz aumentada (última columna es el vector b)
    """
    try:
        matrix_str = parametros.get('matrix')
        
        if not matrix_str:
            raise ValueError("No se encontró 'matrix' en los parámetros")
        
        # Convertir la matriz aumentada completa
        try:
            matriz_completa = np.array([list(map(float, row.split(','))) 
                                         for row in matrix_str.split(';')])
        except Exception as e:
            raise ValueError(f"Error en formato de matriz: {str(e)}")
        
        # Separar A (coeficientes) y b (términos independientes)
        A = matriz_completa[:, :-1]
        b = matriz_completa[:, -1]
        
        n = len(A)
        Ab = np.hstack([A, b.reshape(-1, 1)]).astype(float)
        iteraciones = []
        
        # Eliminación hacia adelante
        for i in range(n):
            # Pivoteo parcial
            max_row = np.argmax(np.abs(Ab[i:, i])) + i
            if np.abs(Ab[max_row, i]) < 1e-12:
                raise np.linalg.LinAlgError(f"Matriz singular en pivote {i}")
            
            if max_row != i:
                Ab[[i, max_row]] = Ab[[max_row, i]]
                iteraciones.append({
                    'iteracion': len(iteraciones) + 1,
                    'vector_x': None,
                    'error': None,
                    'datos_adicionales': json.dumps({
                        'descripcion': f'Intercambio fila {i} con {max_row}',
                        'matriz': Ab.tolist()
                    })
                })
            
            for j in range(i + 1, n):
                factor = Ab[j, i] / Ab[i, i]
                Ab[j, i:] -= factor * Ab[i, i:]
                iteraciones.append({
                    'iteracion': len(iteraciones) + 1,
                    'vector_x': None,
                    'error': None,
                    'datos_adicionales': json.dumps({
                        'descripcion': f'Eliminar x{i} de fila {j}',
                        'factor': float(factor),
                        'matriz': Ab.tolist()
                    })
                })
        
        # Sustitución hacia atrás
        x = np.zeros(n)
        for i in range(n - 1, -1, -1):
            x[i] = (Ab[i, -1] - np.dot(Ab[i, i+1:n], x[i+1:n])) / Ab[i, i]
        
        iteraciones.append({
            'iteracion': len(iteraciones) + 1,
            'vector_x': x.tolist(),
            'error': None,
            'datos_adicionales': json.dumps({'descripcion': 'Solución final'})
        })
        
        return x.tolist(), iteraciones, True
        
    except np.linalg.LinAlgError as e:
        # Relanzar para que el llamador capture el error
        raise np.linalg.LinAlgError(f"Matriz singular: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Error en eliminación Gaussiana: {str(e)}")