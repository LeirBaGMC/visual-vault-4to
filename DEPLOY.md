# Despliegue de Visual Vault en AWS EC2 (manual)

Guía para levantar el proyecto en una instancia EC2 (Ubuntu) y dejar una URL
pública. El backend es **FastAPI** (puerto 8000) y el frontend es **React/Vite**
(se compila a estáticos y los sirve **nginx** en el puerto 80).

> Requisitos previos: una instancia EC2 Ubuntu 22.04+, y credenciales de AWS
> (S3 + Rekognition) y SMTP listas. Todo lo sensible va en `.env` (nunca al repo).

---

## 0) Security Group (puertos)
En la consola de EC2, en el Security Group de la instancia, abre **inbound**:
- **22** (SSH) — solo tu IP.
- **80** (HTTP) — `0.0.0.0/0`.
- **8000** (API) — `0.0.0.0/0` *(opcional; si usas el proxy nginx del paso 6 no hace falta exponerlo)*.

## 1) Conectarte e instalar dependencias del sistema
```bash
ssh -i tu-llave.pem ubuntu@TU_IP_PUBLICA

sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-venv python3-pip nginx git
# Node 20 (para compilar el frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2) Clonar el repo
```bash
cd /home/ubuntu
git clone https://github.com/TU_USUARIO/visual-vault-4to.git
cd visual-vault-4to
```

## 3) Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt          # playwright solo lo usa recolector.py; puedes ignorarlo

cp .env.example .env
nano .env                                 # rellena JWT_SECRET_KEY, ADMIN_EMAIL, AWS_*, MAIL_*
```
En el `.env`, pon el origen del frontend en **CORS_ORIGINS** (tu IP/dominio):
```
CORS_ORIGINS=http://TU_IP_PUBLICA
```
Prueba que arranca (crea la BD SQLite y corre migraciones solo):
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
# Ctrl+C tras ver "Base de datos lista"
```

### Mantenerlo vivo con systemd
```bash
sudo nano /etc/systemd/system/visualvault.service
```
```ini
[Unit]
Description=Visual Vault API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/visual-vault-4to/backend
ExecStart=/home/ubuntu/visual-vault-4to/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now visualvault
sudo systemctl status visualvault
```

## 4) (Opcional) Poblar imágenes
Si quieres datos de ejemplo y tienes el bucket S3 configurado:
```bash
cd /home/ubuntu/visual-vault-4to/backend
source venv/bin/activate
python inyectador.py      # inyecta desde S3 a la BD
```

## 5) Frontend (React/Vite)
La URL del backend se **hornea en el build**, así que configúrala antes de compilar.
```bash
cd /home/ubuntu/visual-vault-4to/frontend-react
cp .env.example .env
nano .env
```
```
# Si usas el proxy nginx del paso 6 (recomendado):
VITE_API_URL=http://TU_IP_PUBLICA/api/v1
# Si expones el 8000 directo en su lugar:
# VITE_API_URL=http://TU_IP_PUBLICA:8000/api/v1
VITE_MSAL_REDIRECT_URI=http://TU_IP_PUBLICA
```
```bash
npm install
npm run build            # genera dist/
sudo mkdir -p /var/www/visualvault
sudo cp -r dist/* /var/www/visualvault/
```

## 6) nginx: servir el frontend y proxiar la API
```bash
sudo nano /etc/nginx/sites-available/visualvault
```
```nginx
server {
    listen 80;
    server_name TU_IP_PUBLICA;            # o tu dominio
    client_max_body_size 25M;             # subidas de imágenes

    root /var/www/visualvault;
    index index.html;

    # SPA: cualquier ruta cae en index.html (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy de la API al backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/visualvault /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```
Ahora la app está en **http://TU_IP_PUBLICA**.

## 7) Login con Microsoft (Outlook)
En el [portal de Azure](https://portal.azure.com) → tu *App registration* →
**Authentication** → añade un **Redirect URI** tipo **SPA** con tu URL pública:
```
http://TU_IP_PUBLICA
```
(Debe coincidir EXACTO con `VITE_MSAL_REDIRECT_URI` / el origen del frontend.)

---

## Notas
- **HTTPS**: para producción real usa un dominio + `certbot` (Let's Encrypt) sobre nginx. Microsoft SSO y muchos navegadores prefieren HTTPS.
- **Actualizar**: `git pull`, luego en backend `pip install -r requirements.txt && sudo systemctl restart visualvault`, y en frontend `npm run build && sudo cp -r dist/* /var/www/visualvault/`.
- **Base de datos**: SQLite (`backend/database.db`) se crea sola y migra al arrancar. No la subas al repo. Para más tráfico, considera Postgres.
- **Secretos**: nunca subas `.env`. Usa `.env.example` como plantilla.
