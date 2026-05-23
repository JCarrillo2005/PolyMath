import sympy as sp
import numpy as np

def muller(funcion, x0, x1, x2, tolerancia=1e-6, maxIteraciones=100):
    try:
        x = sp.Symbol('x')
        f_sym = sp.sympify(funcion)
        # Usar 'numpy' con soporte para complejos
        f_num = sp.lambdify(x, f_sym, modules=['numpy'])
    except Exception:
        raise ValueError("Error en la función. Revise la sintaxis (ej: x**2, exp(x), sin(x)).")
    
    iteraciones = []
    x_0 = float(x0)
    x_1 = float(x1)
    x_2 = float(x2)
    
    for k in range(1, maxIteraciones + 1):
        try:
            # Evaluar función - AHORA SOPORTA COMPLEJOS
            try:
                f0_val = f_num(x_0)
                f1_val = f_num(x_1)
                f2_val = f_num(x_2)
                
                # Convertir a float o complex según el tipo
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
                    
            except (ValueError, TypeError, OverflowError) as e:
                raise RuntimeError(f"Error evaluando la función en x={x_2}: {str(e)}")
            
            # Verificar valores no válidos (solo para reales, complejos pueden continuar)
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
                
                # Manejo del discriminante
                if isinstance(discriminante, complex):
                    sqrt_disc = np.sqrt(discriminante)
                elif abs(discriminante) < 1e-12:
                    sqrt_disc = 0.0
                elif discriminante > 0:
                    sqrt_disc = np.sqrt(discriminante)
                else:
                    # Discriminante negativo - raíz compleja
                    sqrt_disc = np.sqrt(complex(discriminante))
                
                # Elegir el denominador con mayor magnitud
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
                # Si la parte imaginaria es muy pequeña, tratarla como real
                if abs(x_next.imag) < 1e-12:
                    x_next = x_next.real
                # Si la parte real es muy pequeña, ponerla a 0 para mejor visualización
                elif abs(x_next.real) < 1e-12:
                    x_next = complex(0.0, x_next.imag)
            
            # Para funciones con dominio restringido (como log)
            if 'log' in funcion and isinstance(x_next, (int, float)):
                if x_next <= 0:
                    x_next = 0.1
            
            # Evitar valores no válidos
            if isinstance(x_next, (int, float)):
                if np.isnan(x_next) or np.isinf(x_next):
                    raise RuntimeError("La aproximación resultó en un valor no válido")
            
            # Calcular error (usar magnitud para complejos)
            if isinstance(x_next, complex):
                error = abs(x_next - x_2)
            else:
                error = abs(x_next - x_2)
            
            # Guardar iteración con formato mejorado
            if isinstance(x_next, complex):
                # Formato limpio para números complejos
                real = x_next.real
                imag = x_next.imag
                
                if abs(real) < 1e-10:
                    real = 0.0
                if abs(imag) < 1e-10:
                    imag = 0.0
                
                if imag == 0:
                    xi_value = real
                elif real == 0:
                    if imag == 1:
                        xi_value = "i"
                    elif imag == -1:
                        xi_value = "-i"
                    else:
                        xi_value = f"{imag:.8f}i"
                else:
                    sign = "+" if imag > 0 else "-"
                    xi_value = f"{real:.8f}{sign}{abs(imag):.8f}i"
                
                iteraciones.append({
                    'iteracion': k,
                    'xi': xi_value,
                    'error': float(error)
                })
            else:
                iteraciones.append({
                    'iteracion': k,
                    'xi': float(x_next),
                    'error': float(error)
                })
            
            # Verificar convergencia
            if error <= tolerancia:
                # Formatear resultado final para mejor visualización
                if isinstance(x_next, complex):
                    real = x_next.real
                    imag = x_next.imag
                    if abs(real) < 1e-10:
                        real = 0.0
                    if abs(imag) < 1e-10:
                        imag = 0.0
                    
                    if imag == 0:
                        resultado_final = real
                    elif real == 0:
                        if imag == 1:
                            resultado_final = "i"
                        elif imag == -1:
                            resultado_final = "-i"
                        else:
                            resultado_final = f"{imag:.8f}i"
                    else:
                        sign = "+" if imag > 0 else "-"
                        resultado_final = f"{real:.8f}{sign}{abs(imag):.8f}i"
                    return resultado_final, iteraciones, True
                else:
                    return x_next, iteraciones, True
            
           
            x_0 = x_1
            x_1 = x_2
            x_2 = x_next
            
        except ZeroDivisionError as e:
            raise ZeroDivisionError(str(e))
        except RuntimeError as e:
            raise RuntimeError(str(e))
        except Exception as e:
            raise RuntimeError(f"Error en iteración {k}: {str(e)}")
    
    # Formatear resultado final si no convergió
    if isinstance(x_2, complex):
        real = x_2.real
        imag = x_2.imag
        if abs(real) < 1e-10:
            real = 0.0
        if abs(imag) < 1e-10:
            imag = 0.0
        
        if imag == 0:
            resultado_final = real
        elif real == 0:
            if imag == 1:
                resultado_final = "i"
            elif imag == -1:
                resultado_final = "-i"
            else:
                resultado_final = f"{imag:.8f}i"
        else:
            sign = "+" if imag > 0 else "-"
            resultado_final = f"{real:.8f}{sign}{abs(imag):.8f}i"
        return resultado_final, iteraciones, False
    
    return x_2, iteraciones, False