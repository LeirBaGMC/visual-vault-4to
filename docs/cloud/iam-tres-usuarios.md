# IAM — 3 usuarios con mínimo privilegio (Visual Vault)

Tres usuarios IAM, uno por integrante, **cada uno con permisos distintos según su rol**.
Esto demuestra el **principio de mínimo privilegio** (lo que pide la defensa Cloud).
Ninguno usa credenciales root/admin.

> Reemplaza `visual-vault-4to-semestre` por tu bucket real si cambia.

| Usuario | Rol | Puede | NO puede |
|---|---|---|---|
| **gabriel-app** | DevOps / la app | Subir, leer, **borrar** + moderar (Rekognition) | nada de admin de cuenta |
| **kata-curadora** | Curadora de contenido | Subir y leer | **borrar** objetos |
| **katty-auditora** | Auditora / lectura | Solo **leer** y listar | subir o borrar |

La app (backend `.env`) usa las llaves de **gabriel-app** (necesita borrar y moderar).
Los otros dos son para la demostración en vivo de roles diferenciados.

---

## 1) Política de `gabriel-app` (la que usa el backend)
`visualvault-gabriel-devops`
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ObjetosCompleto",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre/*"
    },
    {
      "Sid": "ListarBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre"
    },
    {
      "Sid": "ModeracionRekognition",
      "Effect": "Allow",
      "Action": ["rekognition:DetectModerationLabels"],
      "Resource": "*"
    }
  ]
}
```

## 2) Política de `kata-curadora` (sube y lee, NO borra)
`visualvault-kata-curadora`
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SubirYLeer",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre/*"
    },
    {
      "Sid": "ListarBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre"
    }
  ]
}
```

## 3) Política de `katty-auditora` (solo lectura)
`visualvault-katty-auditora`
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SoloLectura",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre/*"
    },
    {
      "Sid": "ListarBucket",
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre"
    }
  ]
}
```

---

## Cómo crearlos en la consola de AWS

### A) Crear las 3 políticas
Por cada una: **IAM → Policies → Create policy → pestaña JSON** → pega el JSON →
**Next** → ponle el nombre indicado (`visualvault-gabriel-devops`, etc.) → **Create policy**.

### B) Crear los 3 usuarios
Por cada uno: **IAM → Users → Create user**:
1. **User name:** `gabriel-app` (luego `kata-curadora`, `katty-auditora`).
2. *(Opcional)* "Provide user access to the AWS Management Console" → solo si quieres que entren por consola; para la app NO hace falta.
3. **Next → Attach policies directly** → busca y marca la política que le toca a ese usuario.
4. **Create user**.

### C) Llaves de acceso (solo si las necesitas)
- Para la **app**: en `gabriel-app` → pestaña **Security credentials → Create access key** → "Application running outside AWS" → copia Access Key ID + Secret → ponlas en `backend/.env`.
- Para la **demo** de Kata/Katty: puedes crear llaves y probar con AWS CLI, o simplemente mostrar el usuario + su política en la consola.

---

## Cómo demostrarlo en la defensa (guion)
1. Muestra **IAM → Users**: los 3 usuarios `gabriel-app`, `kata-curadora`, `katty-auditora`.
2. Abre cada uno → **Permissions** → muestra que cada uno tiene **una política diferente**.
3. Explica el **mínimo privilegio**:
   - *gabriel-app* administra la app (sube/lee/borra + modera), y es el que usa el backend.
   - *kata-curadora* puede subir contenido pero **no borrar** (no puede destruir datos).
   - *katty-auditora* **solo lee** (audita el contenido sin modificar nada).
4. Recalca: **ninguno usa la cuenta root/administradora**; cada quien tiene **solo lo que su rol necesita**.
5. (Opcional fuerte) Demuestra una **denegación**: con las llaves de `katty-auditora` intenta borrar un objeto por AWS CLI → AWS responde `AccessDenied`. Eso prueba el mínimo privilegio en acción:
   ```bash
   aws s3 rm s3://visual-vault-4to-semestre/Pics/Arquitectura/algo.webp
   # → An error occurred (AccessDenied) ...
   ```
