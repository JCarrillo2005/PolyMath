# PolyMath

> Plataforma asíncrona para ejecutar, trazar y comparar métodos numéricos

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![.NET](https://img.shields.io/badge/.NET-10-purple)
![Python](https://img.shields.io/badge/Python-3.12-green)
![React](https://img.shields.io/badge/React-19-cyan)
![Docker](https://img.shields.io/badge/Docker-✓-blue)

## Características

- **6 métodos numéricos implementados**:
  - Newton-Raphson, Secante, Müller (raíces)
  - Eliminación Gaussiana, Gauss-Jordan, Gauss-Seidel (sistemas lineales)

- **Arquitectura híbrida** (API + Worker + Redis)
- **Visualización de convergencia** en tiempo real con gráficas interactivas
- **Trazabilidad completa** de iteraciones paso a paso
- **Comparación de métodos** lado a lado (raíces y matrices)
- **Historial de ejecuciones** persistente
- **Validación de funciones** en tiempo real

## Stack Tecnológico

| Capa             | Tecnologías                                         |
| ---------------- | --------------------------------------------------- |
| **Backend**      | .NET 10, Entity Framework Core, SQL Server          |
| **Worker**       | Python 3.12, SymPy, NumPy                           |
| **Frontend**     | React 19, TypeScript, Tailwind CSS, Recharts, KaTeX |
| **Cola**         | Redis 7                                             |
| **Contenedores** | Docker, Docker Compose                              |

## Instalación y Ejecución

### Requisitos previos

- [Docker](https://www.docker.com/products/docker-desktop/) y Docker Compose
- [Git](https://git-scm.com/install/)

### Pasos para ejecutar

```bash
# 1. Clonar el repositorio
git clone https://github.com/JCarrillo2005/PolyMath.git
cd PolyMath

# 2. Configurar variables de entorno

# Backend
cp .env.example .env

# Frontend
cd frontend
echo "VITE_API_BASE_URL=http://localhost:5000" > .env
cd ..

# 3. Levantar todos los servicios con un solo comando
docker-compose up --build

# 4. Acceder a las aplicaciones
#    - Frontend: http://localhost:5173
#    - API Swagger: http://localhost:5000/swagger
```

## Licencia y Contexto académico

Proyecto desarrollado con fines académicos para el curso de Métodos Numéricos, Facultad de Ingeniería en Sistemas de Información, Universidad Mariano Gálvez de Guatemala (UMG). Prohibida su comercialización sin autorización de los autores.
