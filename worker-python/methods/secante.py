import sympy as sp
import numpy as np

def secante(funcion, x0, x1, tolerancia=1e-6, maxIteraciones=100):
    try:
        x = sp.Symbol('x')
        f_sym = sp.sympify(funcion)
        f_num = sp.lambdify(x, f_sym, 'numpy')
    except Exception:
        raise ValueError("Error en la función. Revise la sintaxis (ej: x**2, exp(x), sin(x)).")
    
    iteraciones = []
    x_prev = float(x0)
    x_curr = float(x1)
    
    # Validar dominio inicial
    try:
        fx_prev = f_num(x_prev)
        fx_curr = f_num(x_curr)
        if np.isnan(fx_prev) or np.isinf(fx_prev):
            raise ValueError(f"La función no está definida en x0 = {x_prev}")
        if np.isnan(fx_curr) or np.isinf(fx_curr):
            raise ValueError(f"La función no está definida en x1 = {x_curr}")
    except Exception as e:
        raise ValueError(f"Error evaluando la función en valores iniciales: {str(e)}")
    
    for k in range(1, maxIteraciones + 1):
        try:
            fx_prev = f_num(x_prev)
            fx_curr = f_num(x_curr)
            
            # Verificar valores no válidos
            if np.isnan(fx_prev) or np.isinf(fx_prev):
                raise RuntimeError(f"Función no definida en x = {x_prev}")
            if np.isnan(fx_curr) or np.isinf(fx_curr):
                raise RuntimeError(f"Función no definida en x = {x_curr}")
            
            denominador = fx_curr - fx_prev
            
            if abs(denominador) < 1e-12:
                raise ZeroDivisionError("Los valores de la función son casi iguales. Revise los valores iniciales.")
            
            x_next = x_curr - fx_curr * (x_curr - x_prev) / denominador
            
            # Verificar si x_next es válido
            if np.isnan(x_next) or np.isinf(x_next):
                raise RuntimeError(f"La siguiente aproximación no es válida: {x_next}")
            
            # Verificar dominio de la función (para log, sqrt, etc.)
            try:
                fx_next = f_num(x_next)
                if np.isnan(fx_next) or np.isinf(fx_next):
                    # Si la función no está definida, ajustar ligeramente
                    if 'log' in funcion and x_next <= 0:
                        x_next = 0.1
                    fx_next = f_num(x_next)
            except:
                pass
            
            error = abs(x_next - x_curr)
            
            iteraciones.append({
                'iteracion': k,
                'xi': float(x_next),
                'error': float(error)
            })
            
            if error <= tolerancia or abs(f_num(x_next)) < tolerancia:
                return x_next, iteraciones, True
            
            x_prev = x_curr
            x_curr = x_next
            
        except ZeroDivisionError as e:
            raise ZeroDivisionError(str(e))
        except RuntimeError as e:
            raise RuntimeError(str(e))
        except Exception as e:
            raise RuntimeError(f"Error en iteración {k}: {str(e)}")
    
    return x_curr, iteraciones, False