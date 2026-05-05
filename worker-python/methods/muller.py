import sympy as sp
import numpy as np

def muller(funcion, x0, x1, x2, tolerancia=1e-6, maxIteraciones=100):
    """
    Método de Muller
    Retorna: (raiz, iteraciones, converged)
    """
    x = sp.Symbol('x')
    f_sym = sp.sympify(funcion)
    f_num = sp.lambdify(x, f_sym, 'numpy')
    
    iteraciones = []
    x_0 = float(x0)
    x_1 = float(x1)
    x_2 = float(x2)
    
    for k in range(1, maxIteraciones + 1):
        h0 = x_1 - x_0
        h1 = x_2 - x_1
        
        delta0 = (f_num(x_1) - f_num(x_0)) / h0
        delta1 = (f_num(x_2) - f_num(x_1)) / h1
        
        a = (delta1 - delta0) / (h1 + h0)
        b = a * h1 + delta1
        c = f_num(x_2)
        
        discriminante = b**2 - 4*a*c
        
        if discriminante >= 0:
            if abs(b + np.sqrt(discriminante)) > abs(b - np.sqrt(discriminante)):
                x_next = x_2 - (2*c) / (b + np.sqrt(discriminante))
            else:
                x_next = x_2 - (2*c) / (b - np.sqrt(discriminante))
        else:
            x_next = x_2 - (2*c) / b
        
        error = abs(x_next - x_2)
        
        iteraciones.append({
            'iteracion': k,
            'xi': x_next,
            'error': error
        })
        
        if error <= tolerancia:
            return x_next, iteraciones, True
        
        x_0 = x_1
        x_1 = x_2
        x_2 = x_next
    
    return x_2, iteraciones, False