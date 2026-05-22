import sympy as sp

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
    
    for k in range(1, maxIteraciones + 1):
        fx_prev = f_num(x_prev)
        fx_curr = f_num(x_curr)
        
        if abs(fx_curr - fx_prev) < 1e-12:
            raise ZeroDivisionError("Los valores de la función son casi iguales. Revise los valores iniciales.")
        
        x_next = x_curr - fx_curr * (x_curr - x_prev) / (fx_curr - fx_prev)
        error = abs(x_next - x_curr)
        
        iteraciones.append({
            'iteracion': k,
            'xi': float(x_next),
            'error': float(error)
        })
        
        if error <= tolerancia:
            return x_next, iteraciones, True
        
        x_prev = x_curr
        x_curr = x_next
    
    return x_curr, iteraciones, False