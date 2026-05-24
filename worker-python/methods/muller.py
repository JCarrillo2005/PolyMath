import sympy as sp
import numpy as np

def muller(funcion, x0, x1, x2, tolerancia=1e-6, maxIteraciones=100):
    try:
        x = sp.Symbol('x')
        f_sym = sp.sympify(funcion)
        f_num = sp.lambdify(x, f_sym, modules=['numpy'])
    except Exception:
        raise ValueError("Error en la función. Revise la sintaxis (ej: x**2, exp(x), sin(x)).")
    
    iteraciones = []
    x_0 = float(x0)
    x_1 = float(x1)
    x_2 = float(x2)
    
    for k in range(1, maxIteraciones + 1):
        try:
            # Evaluar función en los tres puntos
            f0_val = f_num(x_0)
            f1_val = f_num(x_1)
            f2_val = f_num(x_2)
            
            # Convertir a float o complex
            if isinstance(f0_val, (np.complex128, complex)):
                f0 = f0_val
            else:
                f0 = float(f0_val)
            if isinstance(f1_val, (np.complex128, complex)):
                f1 = f1_val
            else:
                f1 = float(f1_val)
            if isinstance(f2_val, (np.complex128, complex)):
                f2 = f2_val
            else:
                f2 = float(f2_val)
            
            # Verificar valores no válidos
            if not isinstance(f0, complex) and (np.isnan(f0) or np.isinf(f0)):
                raise RuntimeError(f"Función no definida en x={x_0}")
            if not isinstance(f1, complex) and (np.isnan(f1) or np.isinf(f1)):
                raise RuntimeError(f"Función no definida en x={x_1}")
            if not isinstance(f2, complex) and (np.isnan(f2) or np.isinf(f2)):
                raise RuntimeError(f"Función no definida en x={x_2}")
            
            h0 = x_1 - x_0
            h1 = x_2 - x_1
            
            if abs(h0) < 1e-12 or abs(h1) < 1e-12:
                raise ZeroDivisionError("Los puntos iniciales son demasiado cercanos")
            
            delta0 = (f1 - f0) / h0
            delta1 = (f2 - f1) / h1
            
            a = (delta1 - delta0) / (h1 + h0)
            b = a * h1 + delta1
            c = f2
            
            if abs(a) < 1e-12:
                if abs(b) < 1e-12:
                    raise ZeroDivisionError("No se puede calcular la siguiente aproximación")
                x_next = x_2 - c / b
            else:
                discriminante = b**2 - 4 * a * c
                
                if isinstance(discriminante, complex):
                    sqrt_disc = np.sqrt(discriminante)
                elif abs(discriminante) < 1e-12:
                    sqrt_disc = 0.0
                elif discriminante > 0:
                    sqrt_disc = np.sqrt(discriminante)
                else:
                    sqrt_disc = np.sqrt(complex(discriminante))
                
                if isinstance(sqrt_disc, complex):
                    if abs(b + sqrt_disc) > abs(b - sqrt_disc):
                        x_next = x_2 - (2 * c) / (b + sqrt_disc)
                    else:
                        x_next = x_2 - (2 * c) / (b - sqrt_disc)
                else:
                    if abs(b + sqrt_disc) > abs(b - sqrt_disc):
                        x_next = x_2 - (2 * c) / (b + sqrt_disc)
                    else:
                        x_next = x_2 - (2 * c) / (b - sqrt_disc)
            
            # Manejo de resultados complejos
            if isinstance(x_next, complex):
                if abs(x_next.imag) < 1e-12:
                    x_next = x_next.real
                elif abs(x_next.real) < 1e-12:
                    x_next = complex(0.0, x_next.imag)
            
            # Para funciones con dominio restringido
            if 'log' in funcion and isinstance(x_next, (int, float)):
                if x_next <= 0:
                    x_next = 0.1
            
            if isinstance(x_next, (int, float)):
                if np.isnan(x_next) or np.isinf(x_next):
                    raise RuntimeError("La aproximación resultó en un valor no válido")
            
            # Calcular error aproximado porcentual
            if isinstance(x_next, complex):
                error = abs(x_next - x_2)
                error_porcentual = abs(x_next - x_2) / abs(x_next) * 100 if abs(x_next) > 1e-12 else 0
            else:
                error = abs(x_next - x_2)
                error_porcentual = abs(x_next - x_2) / abs(x_next) * 100 if abs(x_next) > 1e-12 else 0
            
            # Formatear valores para mostrar
            def format_valor(val):
                if isinstance(val, complex):
                    real = val.real
                    imag = val.imag
                    if abs(real) < 1e-10:
                        real = 0.0
                    if abs(imag) < 1e-10:
                        imag = 0.0
                    if imag == 0:
                        return real
                    elif real == 0:
                        return f"{imag:.8f}i"
                    else:
                        sign = "+" if imag > 0 else "-"
                        return f"{real:.8f}{sign}{abs(imag):.8f}i"
                else:
                    return val
            
            # Guardar iteración con todos los datos
            iteraciones.append({
                'iteracion': k,
                'x0': format_valor(x_0),
                'x1': format_valor(x_1),
                'x2': format_valor(x_2),
                'fx0': format_valor(f0),
                'fx1': format_valor(f1),
                'fx2': format_valor(f2),
                'x3': format_valor(x_next),
                'error_porcentual': float(error_porcentual),
                'xi': format_valor(x_next),  # Para compatibilidad
                'error': float(error)
            })
            
            # Verificar convergencia
            if error <= tolerancia:
                return x_next, iteraciones, True
            
            # Actualizar puntos
            x_0 = x_1
            x_1 = x_2
            x_2 = x_next
            
        except ZeroDivisionError as e:
            raise ZeroDivisionError(str(e))
        except RuntimeError as e:
            raise RuntimeError(str(e))
        except Exception as e:
            raise RuntimeError(f"Error en iteración {k}: {str(e)}")
    
    return x_2, iteraciones, False