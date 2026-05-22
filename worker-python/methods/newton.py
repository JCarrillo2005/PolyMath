import sympy as sp

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
    
    for i in range(max_iter):
        try:
            fx = f_num(xn)
            fpx = f_prima_num(xn)
            
            if abs(fpx) < 1e-12:
                raise ZeroDivisionError("La derivada es cero. El método no puede continuar.")
            
            xn_next = xn - fx / fpx
            error = abs(xn_next - xn)
            
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
    
    return xn, iteraciones, False