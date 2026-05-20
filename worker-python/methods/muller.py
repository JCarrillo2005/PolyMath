import sympy as sp
import numpy as np

def muller(funcion, x0, x1, x2, tolerancia=1e-6, maxIteraciones=100):
    """
    Método de Müller
    Retorna: (raiz, iteraciones, converged)
    """
    try:
        x = sp.Symbol('x')
        f_sym = sp.sympify(funcion)
        f_num = sp.lambdify(x, f_sym, 'numpy')
    except Exception as e:
        raise ValueError(f"Error de parsing: Expresión '{funcion}' inválida - {str(e)}")
    
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
        
        # Manejo de discriminante negativo
        if discriminante >= 0:
            sqrt_disc = np.sqrt(discriminante)
            if abs(b + sqrt_disc) > abs(b - sqrt_disc):
                x_next = x_2 - (2*c) / (b + sqrt_disc)
            else:
                x_next = x_2 - (2*c) / (b - sqrt_disc)
        else:
            # Discriminante negativo - usar raíz compleja
            # Para el método de Müller, esto puede ocurrir y es aceptable
            sqrt_disc = np.sqrt(complex(discriminante))
            if abs(b + sqrt_disc) > abs(b - sqrt_disc):
                x_next = x_2 - (2*c) / (b + sqrt_disc)
            else:
                x_next = x_2 - (2*c) / (b - sqrt_disc)
        
        # El error se calcula con magnitud (para números complejos también funciona)
        error = abs(x_next - x_2)
        
        # Convertir a float si es real, mantener como complex si tiene parte imaginaria
        if isinstance(x_next, complex) and abs(x_next.imag) < 1e-10:
            x_next = x_next.real
        
        iteraciones.append({
            'iteracion': k,
            'xi': x_next,
            'error': float(error)
        })
        
        if error <= tolerancia:
            return x_next, iteraciones, True
        
        x_0 = x_1
        x_1 = x_2
        x_2 = x_next
    
    return x_2, iteraciones, False