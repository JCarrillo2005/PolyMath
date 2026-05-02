import sympy as sp

def newton(funcion_str, x0, tolerancia=1e-6, max_iter=100):
    x = sp.Symbol('x')
    f = sp.sympify(funcion_str)
    f_prima = sp.diff(f, x)
    
    f_num = sp.lambdify(x, f, 'numpy')
    f_prima_num = sp.lambdify(x, f_prima, 'numpy')
    
    iteraciones = []
    xn = x0
    
    for i in range(max_iter):
        try:
            fx = f_num(xn)
            fpx = f_prima_num(xn)
            
            if abs(fpx) < 1e-12:
                return None, iteraciones, False
            
            xn_next = xn - fx / fpx
            error = abs(xn_next - xn)
            
            iteraciones.append({
                'iteracion': i,
                'xi': xn_next,
                'error': error
            })
            
            if error < tolerancia or abs(f_num(xn_next)) < tolerancia:
                return xn_next, iteraciones, True
            
            xn = xn_next
            
        except Exception as e:
            return None, iteraciones, False
    
    return xn, iteraciones, False