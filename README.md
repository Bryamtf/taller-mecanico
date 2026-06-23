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

#Produccion tener en cuanto la generación del PDF
# En Ubuntu/Debian
apt-get install -y libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1

#Instalar las nuevas depedencias para generacion del pdf en la carpeta backend
npm install puppeteer@23.11.1
npm uninstall pdfkit
# Luego de instalar la nueva dependencia reconstuir la imagen del docker
docker-compose build --nocache

# Micro servicio de email
 npm install
 agregar las variables
 docker-compose up -d --build notifications
