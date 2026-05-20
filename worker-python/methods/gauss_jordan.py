import numpy as np
import json

def gauss_jordan(parametros: dict) -> tuple:
    """
    Resuelve sistema lineal Ax = b usando Gauss-Jordan (RREF)
    Recibe matriz aumentada (última columna es el vector b)
    Retorna: (solucion, iteraciones, converged)
    """
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
        
        n = len(A)
        Ab = np.hstack([A, b.reshape(-1, 1)]).astype(float)
        iteraciones = []
        
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
            
            # Normalizar la fila pivote
            pivote = Ab[i, i]
            Ab[i, :] /= pivote
            iteraciones.append({
                'iteracion': len(iteraciones) + 1,
                'vector_x': None,
                'error': None,
                'datos_adicionales': json.dumps({
                    'descripcion': f'Normalizar fila {i}',
                    'matriz': Ab.tolist()
                })
            })
            
            # Eliminar la columna i en las demás filas
            for j in range(n):
                if j != i:
                    factor = Ab[j, i]
                    Ab[j, :] -= factor * Ab[i, :]
                    iteraciones.append({
                        'iteracion': len(iteraciones) + 1,
                        'vector_x': None,
                        'error': None,
                        'datos_adicionales': json.dumps({
                            'descripcion': f'Eliminar x{i} de fila {j}',
                            'matriz': Ab.tolist()
                        })
                    })
        
        x = Ab[:, -1]
        
        iteraciones.append({
            'iteracion': len(iteraciones) + 1,
            'vector_x': x.tolist(),
            'error': None,
            'datos_adicionales': json.dumps({'descripcion': 'Solución final'})
        })
        
        return x.tolist(), iteraciones, True
        
    except np.linalg.LinAlgError as e:
        raise np.linalg.LinAlgError(f"Matriz singular: {str(e)}")
    except Exception as e:
        raise RuntimeError(f"Error en Gauss-Jordan: {str(e)}")