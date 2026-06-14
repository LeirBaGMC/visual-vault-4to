# Políticas AWS — Visual Vault (mínimo privilegio)

Estas políticas cubren EXACTAMENTE lo que usa la aplicación (verificado en
`backend/utils/aws_client.py`): subir/leer/borrar objetos en el bucket del
proyecto y moderar imágenes con Rekognition. Nada de permisos de administrador.

> Reemplaza `visual-vault-4to-semestre` por el nombre real de tu bucket si cambia.

---

## 1) Política IAM del usuario del proyecto (mínimo privilegio)

Crea esto en **IAM → Policies → Create policy → JSON**, nómbrala
`visualvault-app-minimo-privilegio` y adjúntala al usuario IAM del proyecto.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ObjetosDelBucketDelProyecto",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre/*"
    },
    {
      "Sid": "ListarSoloEseBucket",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::visual-vault-4to-semestre"
    },
    {
      "Sid": "ModeracionDeContenidoRekognition",
      "Effect": "Allow",
      "Action": [
        "rekognition:DetectModerationLabels"
      ],
      "Resource": "*"
    }
  ]
}
```

Por qué es mínimo privilegio (para la defensa):
- Solo el **bucket del proyecto**, no `*`.
- Solo las **3 acciones de objeto** que usa el código (`PutObject`/`GetObject`/`DeleteObject`), no `s3:*`.
- Rekognition solo `DetectModerationLabels` (esta acción no admite recurso por bucket, por eso `*`).
- Sin `iam:*`, sin acceso a otros servicios, sin credenciales de root/admin.

---

## 2) Política de bucket para lectura pública de imágenes (acceso "básico")

La app genera URLs públicas (`https://BUCKET.s3.REGION.amazonaws.com/...`), así que
las imágenes deben ser **legibles por cualquiera (solo GET)**. Para limitar la
exposición (decisión ética → mínima exposición), restringe la lectura pública SOLO
a los prefijos de imágenes, no a todo el bucket:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LecturaPublicaSoloImagenes",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::visual-vault-4to-semestre/uploads/*",
        "arn:aws:s3:::visual-vault-4to-semestre/Pics/*"
      ]
    }
  ]
}
```

Pasos en **S3 → tu bucket → Permissions**:
1. **Block public access**: desmarca "Block all public access" (necesario para que la
   política de bucket surta efecto). Confirma.
2. Pega la política de arriba en **Bucket policy**.

> **Alternativa más segura (y mejor argumento ético):** en vez de bucket público,
> usar **URLs prefirmadas (presigned URLs)** con expiración, o **CloudFront + OAC**.
> Así nadie accede a los objetos sin pasar por tu backend. Es un cambio de código
> (`generate_presigned_url`) — opcional, pero es oro para la "decisión ética
> verificable" que pide el componente de Ética.
