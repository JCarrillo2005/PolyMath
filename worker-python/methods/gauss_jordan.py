import numpy as np
import json

def gauss_jordan(parametros: dict) -> tuple:
    """
    Resuelve sistema lineal Ax = b usando Gauss-Jordan (RREF)
    Recibe matriz aumentada (última columna es el vector b)
    Retorna: (solucion, iteraciones, converged)
    """
    try:
        # Obtener la matriz aumentada del frontend
        matrix_str = parametros.get('matrix')
        
        if not matrix_str:
            print("Error: No se encontró 'matrix' en los parámetros")
            return None, [], False
        
        # Convertir la matriz aumentada completa
        matriz_completa = np.array([list(map(float, row.split(','))) 
                                     for row in matrix_str.split(';')])
        
        # Separar A (coeficientes) y b (términos independientes)
        A = matriz_completa[:, :-1]
        b = matriz_completa[:, -1]
        
        n = len(A)
        # Crear matriz aumentada [A|b]
        Ab = np.hstack([A, b.reshape(-1, 1)]).astype(float)
        iteraciones = []
        
        # Método de Gauss-Jordan
        for i in range(n):
            # Pivoteo parcial (buscar la fila con el valor más grande en la columna i)
            max_row = np.argmax(np.abs(Ab[i:, i])) + i
            if np.abs(Ab[max_row, i]) < 1e-12:
                print(f"Error: Matriz singular o mal condicionada en pivote {i}")
                return None, iteraciones, False
            
            # Intercambiar filas si es necesario
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
            
            # Normalizar la fila pivote (dividir por el pivote)
            pivote = Ab[i, i]
            Ab[i, :] /= pivote
            iteraciones.append({
                'iteracion': len(iteraciones) + 1,
                'vector_x': None,
                'error': None,
                'datos_adicionales': json.dumps({
                    'descripcion': f'Normalizar fila {i} (pivote = {pivote:.6f})',
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
                            'descripcion': f'Eliminar x{i} de fila {j} (factor = {factor:.6f})',
                            'matriz': Ab.tolist()
                        })
                    })
        
        # La solución está en la última columna
        x = Ab[:, -1]
        
        # Guardar iteración final con la solución
        iteraciones.append({
            'iteracion': len(iteraciones) + 1,
            'vector_x': x.tolist(),
            'error': None,
            'datos_adicionales': json.dumps({'descripcion': 'Solución final'})
        })
        
        return x.tolist(), iteraciones, True
        
    except Exception as e:
        print(f"Error en Gauss-Jordan: {e}")
        import traceback
        traceback.print_exc()
        return None, [], False