# 📧 Guía para Activar Emails Reales con Resend

## 🎯 Resumen

La aplicación ya está preparada para enviar emails reales a los colaboradores. Actualmente el sistema funciona completamente pero necesitas configurar un servicio de email para el envío real.

## ✅ Lo que YA está implementado

1. ✅ **API Route completa** (`/api/send-invite/route.ts`)
2. ✅ **Email HTML hermoso y profesional** con diseño moderno
3. ✅ **Sistema de colaboradores funcional** - Ya se agregan a la base de datos
4. ✅ **UI actualizada** sin mensajes de "Beta"
5. ✅ **Integración en ShareTripModal** - Ya llama a la API

## 📝 Pasos para Activar Emails Reales

### Opción 1: Resend (Recomendado) 🚀

**Resend es el servicio más fácil y moderno para enviar emails desde Next.js.**

#### 1. Crear cuenta en Resend
- Ve a https://resend.com
- Crea una cuenta gratuita (100 emails/día)
- Verifica tu dominio (o usa su dominio de prueba)

#### 2. Obtener API Key
```bash
# En el dashboard de Resend:
# 1. Ve a "API Keys"
# 2. Crea una nueva API Key
# 3. Cópiala (solo se muestra una vez)
```

#### 3. Instalar dependencia
```bash
npm install resend
```

#### 4. Configurar variables de entorno
Crea o actualiza tu archivo `.env.local`:

```env
# Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# URL de tu app (para los links en el email)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 5. Actualizar el código
En `/src/app/api/send-invite/route.ts`, descomenta las líneas:

```typescript
// TODO: Integrate with real email service
// Example with Resend:
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
await resend.emails.send({
    from: 'StayFinder <noreply@stayfinder.com>',
    to: [to],
    subject: `¡Te invitaron a colaborar en ${tripName}!`,
    html: htmlContent
});
```

**Versión TypeScript (recomendada):**
```typescript
import { Resend } from 'resend';

// En la función POST:
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
    from: 'StayFinder <onboarding@resend.dev>', // Usa tu dominio verificado
    to: [to],
    subject: `¡Te invitaron a colaborar en ${tripName}!`,
    html: htmlContent
});
```

#### 6. Probar
```bash
# Reinicia el servidor
npm run dev

# Invita a un colaborador usando tu propio email
# ¡Deberías recibir el email hermoso que diseñamos!
```

### Opción 2: SendGrid (Alternativa)

#### 1. Crear cuenta
- Ve a https://sendgrid.com
- Plan gratuito: 100 emails/día

#### 2. Instalar
```bash
npm install @sendgrid/mail
```

#### 3. Configurar
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 4. Código
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
    to: to,
    from: 'noreply@tudominio.com', // Debe estar verificado
    subject: `¡Te invitaron a colaborar en ${tripName}!`,
    html: htmlContent
});
```

### Opción 3: Nodemailer (Gmail/SMTP)

#### 1. Instalar
```bash
npm install nodemailer
```

#### 2. Configurar Gmail
```env
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-app-password # No tu contraseña real, sino una "App Password"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Para obtener App Password:
1. Ve a tu cuenta de Google
2. Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones
3. Genera una nueva contraseña para "Mail"

#### 3. Código
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

await transporter.sendMail({
    from: '"StayFinder" <noreply@tudominio.com>',
    to: to,
    subject: `¡Te invitaron a colaborar en ${tripName}!`,
    html: htmlContent
});
```

## 🎨 El Email que Diseñamos

El template de email incluye:
- ✨ Header con gradiente azul-índigo
- 🎯 Nombre del viaje destacado
- ✅ Lista de permisos que tendrá el colaborador
- 🔘 Botón CTA grande y llamativo
- 💡 Información importante sobre el login
- 📱 100% responsive (se ve perfecto en móvil)
- 🌙 Colores profesionales y modernos

## 🚀 Para Producción

Cuando despliegues a producción (Vercel, por ejemplo):

1. **Configura las variables de entorno en Vercel:**
```bash
vercel env add RESEND_API_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

2. **Actualiza NEXT_PUBLIC_APP_URL:**
```env
NEXT_PUBLIC_APP_URL=https://tuapp.vercel.app
```

3. **Verifica tu dominio en Resend** para enviar desde tu propio dominio:
```typescript
from: 'StayFinder <invites@tudominio.com>'
```

## 📊 Límites de Planes Gratuitos

| Servicio | Emails/día | Emails/mes |
|----------|-----------|-----------|
| Resend | 100 | 3,000 |
| SendGrid | 100 | 100 |
| Gmail/Nodemailer | 500* | 500* |

*Con Gmail App Password

## ✅ Checklist de Implementación

- [ ] Elegir servicio de email (Resend recomendado)
- [ ] Crear cuenta y obtener API key
- [ ] Instalar dependencia npm
- [ ] Configurar variables de entorno
- [ ] Actualizar `/api/send-invite/route.ts`
- [ ] Probar enviando invitación a tu propio email
- [ ] Configurar dominio personalizado (opcional)
- [ ] Desplegar a producción

## 🎯 Estado Actual

**Todo está listo para funcionar.** Solo necesitas:
1. Elegir un servicio (recomiendo Resend)
2. Agregar la API key
3. Descomentar 5 líneas de código

¡Los emails ya están diseñados y listos para enviarse! 🚀

---

**Nota:** Si tienes algún problema, revisa:
- Que las variables de entorno estén bien configuradas
- Que hayas reiniciado el servidor después de agregar las variables
- Los logs de la consola de la API route para ver errores específicos
