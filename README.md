# PolyMath

> Plataforma asíncrona para ejecutar, trazar y comparar métodos numéricos

## Características

- 6 métodos numéricos implementados
- Arquitectura híbrida (API + Worker + Redis)
- Visualización de convergencia en tiempo real
- Trazabilidad completa de iteraciones

## Stack

- Backend: .NET 10 + SQL Server
- Worker: Python + SymPy + NumPy
- Frontend: React + TypeScript + Tailwind CSS
- Cola: Redis
- Contenedores: Docker

## Instalación y Ejecución

```bash
# 1. Clonar el repositorio
git clone https://github.com/JCarrillo2005/PolyMath.git
cd PolyMath

# 2. Levantar todos los servicios con un solo comando
docker-compose up --build

# 3. Acceder a las aplicaciones
#    - Frontend: http://localhost:5173
#    - API Swagger: http://localhost:5000/swagger
```
