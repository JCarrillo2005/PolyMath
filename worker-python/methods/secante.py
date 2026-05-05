import sympy as sp

def secante(funcion, x0, x1, tolerancia=1e-6, maxIteraciones=100):
    """
    Método de la Secante
    Retorna: (raiz, iteraciones, converged)
    """
    x = sp.Symbol('x')
    f_sym = sp.sympify(funcion)
    f_num = sp.lambdify(x, f_sym, 'numpy')
    
    iteraciones = []
    x_prev = x0
    x_curr = x1
    error = float('inf')
    
    for k in range(1, maxIteraciones + 1):
        fx_prev = f_num(x_prev)
        fx_curr = f_num(x_curr)
        
        if fx_curr - fx_prev == 0:
            break
        
        x_next = x_curr - fx_curr * (x_curr - x_prev) / (fx_curr - fx_prev)
        error = abs(x_next - x_curr)
        
        iteraciones.append({
            'iteracion': k,
            'xi': x_next,
            'error': error
        })
        
        if error <= tolerancia:
            return x_next, iteraciones, True
        
        x_prev = x_curr
        x_curr = x_next
    
    return x_curr, iteraciones, False