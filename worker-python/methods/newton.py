import sympy as sp

def newton(funcion_str, x0, tolerancia=1e-6, max_iter=100):
    try:
        x = sp.Symbol('x')
        f = sp.sympify(funcion_str)
        f_prima = sp.diff(f, x)  # Derivada calculada automáticamente
        
        f_num = sp.lambdify(x, f, 'numpy')
        f_prima_num = sp.lambdify(x, f_prima, 'numpy')
    except Exception as e:
        raise ValueError(f"Error de parsing: Expresión '{funcion_str}' inválida - {str(e)}")
    
    iteraciones = []
    xn = float(x0)
    
    for i in range(max_iter):
        try:
            fx = f_num(xn)
            fpx = f_prima_num(xn)
            
            # Caso: División por cero (f'(x) ≈ 0)
            if abs(fpx) < 1e-12:
                raise ZeroDivisionError(f"Derivada cero en x = {xn}. El método no puede continuar.")
            
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
            raise ZeroDivisionError(f"División por cero en Newton-Raphson: {str(e)}")
    
    return xn, iteraciones, False