import sympy as sp
import numpy as np

def newton(funcion_str, x0, tolerancia=1e-6, max_iter=100):
    try:
        x = sp.Symbol('x')
        f = sp.sympify(funcion_str)
        f_prima = sp.diff(f, x)
        
        f_num = sp.lambdify(x, f, 'numpy')
        f_prima_num = sp.lambdify(x, f_prima, 'numpy')
    except Exception:
        raise ValueError("Error en la función. Revise la sintaxis (ej: x**2, exp(x), sin(x)).")
    
    iteraciones = []
    xn = float(x0)
    
    # Validar que el valor inicial está en el dominio de la función
    try:
        fx_inicial = f_num(xn)
        if np.isnan(fx_inicial) or np.isinf(fx_inicial):
            raise ValueError(f"La función no está definida en x0 = {xn}")
    except Exception as e:
        raise ValueError(f"Error evaluando la función en x0 = {xn}: {str(e)}")
    
    for i in range(max_iter):
        try:
            fx = f_num(xn)
            fpx = f_prima_num(xn)
            
            # Verificar valores no válidos
            if np.isnan(fx) or np.isinf(fx):
                raise RuntimeError(f"Función no definida en x = {xn}")
            if np.isnan(fpx) or np.isinf(fpx):
                raise RuntimeError(f"Derivada no definida en x = {xn}")
            
            if abs(fpx) < 1e-12:
                raise ZeroDivisionError("La derivada es cero. El método no puede continuar.")
            
            xn_next = xn - fx / fpx
            
            if np.isnan(xn_next) or np.isinf(xn_next):
                raise RuntimeError(f"La siguiente aproximación no es válida: {xn_next}")
            
            error = abs(xn_next - xn)
            
            try:
                f_next = f_num(xn_next)
                if np.isnan(f_next) or np.isinf(f_next):
                    
                    if 'log' in funcion_str and xn_next <= 0:

                        xn_next = 0.1
                        f_next = f_num(xn_next)
                        error = abs(xn_next - xn)
            except:
                pass
            
            iteraciones.append({
                'iteracion': i + 1,
                'xi': float(xn_next),
                'error': float(error)
            })
            
            if error < tolerancia or abs(f_num(xn_next)) < tolerancia:
                return xn_next, iteraciones, True
            
            xn = xn_next
            
        except ZeroDivisionError as e:
            raise ZeroDivisionError(str(e))
        except RuntimeError as e:
            raise RuntimeError(str(e))
        except Exception as e:
            raise RuntimeError(f"Error en iteración {i+1}: {str(e)}")
    
    # Verificar que el resultado final es válido antes de retornar
    if np.isnan(xn) or np.isinf(xn):
        raise RuntimeError("El método no convergió a un valor válido")
    
    return xn, iteraciones, False