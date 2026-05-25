# 🚀 Guía de Despliegue en Cloudflare Pages

## ✅ Pre-requisitos

1. Cuenta de Cloudflare Pages
2. Repositorio conectado a Cloudflare Pages
3. Variables de entorno configuradas

## 📋 Configuración de Build en Cloudflare Pages

En el dashboard de Cloudflare Pages, configura lo siguiente:

### Build Configuration
- **Framework preset**: `Next.js`
- **Build command**: `npm run build`
- **Build output directory**: `.open-next/assets`
- **Root directory**: `/`
- **Node version**: `22.x`

### Environment Variables

Configura las siguientes variables de entorno en Cloudflare Pages Dashboard:

#### Variables Públicas (Frontend)
```
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_APP_URL=https://tu-app.pages.dev
```

#### Variables Privadas (Backend/API Routes)
```
GEMINI_API_KEY=tu_gemini_api_key
RESEND_API_KEY=tu_resend_api_key
```

## 🔧 Pasos para Desplegar

### 1. Desde Git (Recomendado)

1. Conecta tu repositorio a Cloudflare Pages
2. Configura las variables de entorno en el dashboard
3. Cada push a la rama principal desplegará automáticamente

### 2. Deploy Manual (CLI)

```bash
# Instalar dependencias
npm install

# Build y deploy
npm run deploy
```

## 🐛 Troubleshooting

### Error: "Could not find compiled Open Next config"
- **Solución**: El comando correcto es:
  ```json
  "build": "next build && npx @opennextjs/cloudflare build --skipNextBuild"
  ```
- El flag `--skipNextBuild` evita que OpenNext ejecute `next build` nuevamente, lo cual causaría un loop infinito

### Error: Firebase no funciona
- **Solución**: Verifica que todas las variables `NEXT_PUBLIC_FIREBASE_*` estén configuradas en Cloudflare
- Las variables públicas DEBEN tener el prefijo `NEXT_PUBLIC_`

### Error: API Routes no funcionan
- **Solución**: Verifica que `wrangler.jsonc` tenga configurado `compatibility_flags: ["nodejs_compat"]`
- Las API routes necesitan el runtime de Node.js

### Error: Imágenes no cargan
- **Solución**: Las imágenes están desoptimizadas (`unoptimized: true` en `next.config.ts`)
- Usa rutas absolutas para imágenes públicas

## 📱 Verificar PWA

Después del deploy, verifica:

1. ✅ El manifest.json es accesible en `/manifest.json`
2. ✅ Los iconos están disponibles en `/icon.png`
3. ✅ La app se puede instalar desde el navegador
4. ✅ Funciona offline (service worker)

## 🔄 Actualizaciones

Para actualizar la app en producción:

```bash
git add .
git commit -m "Update: descripción del cambio"
git push origin main
```

Cloudflare Pages desplegará automáticamente en 2-3 minutos.

## 📊 Monitoreo

- **Logs**: Dashboard de Cloudflare Pages > Tu Proyecto > Logs
- **Analytics**: Dashboard de Cloudflare Pages > Tu Proyecto > Analytics
- **Errores**: Dashboard de Cloudflare Workers > Observability

## 🔗 Links Útiles

- [Documentación OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Next.js Deploy Docs](https://nextjs.org/docs/deployment)
