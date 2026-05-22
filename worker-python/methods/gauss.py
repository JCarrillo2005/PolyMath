import numpy as np
import json

def gauss(parametros: dict) -> tuple:
    try:
        matrix_str = parametros.get('matrix')
        if not matrix_str:
            raise ValueError("No se encontró 'matrix' en los parámetros")
        
        try:
            matriz_completa = np.array([list(map(float, row.split(','))) 
                                         for row in matrix_str.split(';')])
        except Exception:
            raise ValueError("Formato de matriz inválido. Use: filas separadas por ';' y números por ','")
        
        A = matriz_completa[:, :-1]
        b = matriz_completa[:, -1]
        
        n = len(A)
        Ab = np.hstack([A, b.reshape(-1, 1)]).astype(float)
        iteraciones = []
        
        for i in range(n):
            max_row = np.argmax(np.abs(Ab[i:, i])) + i
            if np.abs(Ab[max_row, i]) < 1e-12:
                raise np.linalg.LinAlgError("La matriz es singular (no tiene solución única).")
            
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
        raise np.linalg.LinAlgError(str(e))
    except Exception:
        raise RuntimeError("Error en el método de Gauss. Verifique la matriz ingresada.")