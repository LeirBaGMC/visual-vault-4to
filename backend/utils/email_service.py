import os
from pathlib import Path
from datetime import datetime
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from dotenv import load_dotenv

# 1. Forzamos la lectura del archivo .env desde la raíz de la carpeta actual
BASE_DIR = Path(__file__).resolve().parent.parent
env_path = Path('.') / '.env'

load_dotenv(dotenv_path=env_path)

# DEBUG: Esto imprimirá en tu consola qué correo está leyendo. Si dice "None", tu archivo .env no está bien ubicado.
correo_cargado = os.getenv('MAIL_USERNAME', 'No detectado')
print(f"📧 Iniciando servicio SMTP con el correo: {os.getenv('MAIL_USERNAME')}")

# 2. Configuración del servidor SMTP (Con textos por defecto para evitar que FastAPI colapse)
conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "sin_configurar@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "sin_configurar"),
    MAIL_FROM=os.getenv("MAIL_FROM", "sin_configurar@gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 465)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def enviar_correo_bienvenida(email_destino: str, username: str):
    """
    Envía un correo de bienvenida cuando el usuario se registra exitosamente.
    """
    html_content = f"""
    <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; background-color: #FAF7F4; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0;">
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="background-color: #0f172a; color: white; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold;">V</div>
            <h2 style="color: #0f172a; margin-top: 10px;">Visual Vault</h2>
        </div>
        <h2 style="color: #0f172a;">¡Bienvenido a tu nueva Bóveda, {username}!</h2>
        <p style="color: #334155; font-size: 16px;">Estamos emocionados de tenerte aquí. Tu cuenta ha sido creada con éxito.</p>
        <p style="color: #334155; font-size: 16px;">A partir de ahora, puedes empezar a guardar tus referencias, arquitecturas y código en un solo lugar seguro y organizado.</p>
        <br>
        <p style="color: #64748b; font-size: 14px;">Atentamente,<br><strong>El Equipo de Kyosei Tech</strong></p>
    </div>
    """

    message = MessageSchema(
        subject="¡Bienvenido a Visual Vault!",
        recipients=[email_destino],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"❌ Error al enviar correo de bienvenida: {e}")


async def enviar_alerta_login(email_destino: str, username: str):
    """
    Envía una alerta de seguridad cada vez que el usuario inicia sesión.
    """
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    html_content = f"""
    <div style="font-family: 'Segoe UI', sans-serif; padding: 30px; background-color: #FAF7F4; border-radius: 12px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0;">
        <h3 style="color: #0f172a; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px;">🔒 Nuevo inicio de sesión detectado</h3>
        <p style="color: #334155; font-size: 16px;">Hola <strong>{username}</strong>,</p>
        <p style="color: #334155; font-size: 16px;">Se ha detectado un nuevo acceso a tu bóveda de Visual Vault.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <ul style="color: #475569; margin-bottom: 0; list-style-type: none; padding-left: 0;">
                <li><strong>Fecha y Hora:</strong> {fecha_actual}</li>
                <li><strong>Estado:</strong> Acceso concedido</li>
            </ul>
        </div>
        <p style="color: #64748b; font-size: 14px;">Si fuiste tú, puedes ignorar este mensaje. Si no reconoces esta actividad, por favor contacta a soporte inmediatamente.</p>
    </div>
    """

    message = MessageSchema(
        subject="Alerta de Seguridad: Nuevo inicio de sesión",
        recipients=[email_destino],
        body=html_content,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"❌ Error al enviar alerta de login: {e}")