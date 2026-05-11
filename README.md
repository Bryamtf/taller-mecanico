# taller-mecanico
# MIAUTONORT - Sistema de Gestión para Taller Mecánico

## 🚀 Inicio rápido

### Prerrequisitos
- Docker y Docker Compose
- Node.js 18+ (opcional, si no usas Docker)

### Levantar el proyecto con Docker

```bash
# Clonar repositorio
git clone <url-repositorio>
cd miautonort

# Copiar variables de entorno
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar .env con tus tokens (json.pe, MiAPI.CLOUD)
nano backend/.env

# Levantar contenedores
docker-compose up -d

# Ver logs
docker-compose logs -f

# Comando para instalar dependencias
npm install jsonwebtoken bcryptjs express-validator multer
npm install pdfkit nodemailer
