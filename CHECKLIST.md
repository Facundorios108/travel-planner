# ✅ Checklist de Deploy - Cloudflare Pages

## Antes de hacer Push

- [ ] Verificar que `.env.local` existe con todas las variables
- [ ] Confirmar que el build funciona localmente: `npm run build`
- [ ] Verificar que existe `.open-next/worker.js` después del build
- [ ] Confirmar que existe `.open-next/assets/` con los archivos estáticos

## En Cloudflare Pages Dashboard

### Configuración del Proyecto
- [ ] Framework preset: **Next.js**
- [ ] Build command: **`npm run build`**
- [ ] Build output directory: **`.open-next/assets`**
- [ ] Root directory: **`/`**
- [ ] Node version: **`22.x`**

### Variables de Entorno

#### Production Environment
- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- [ ] `NEXT_PUBLIC_APP_URL` (ej: `https://tu-app.pages.dev`)
- [ ] `GEMINI_API_KEY`
- [ ] `RESEND_API_KEY`

#### Preview Environment (opcional)
- [ ] Copiar las mismas variables que Production
- [ ] Cambiar `NEXT_PUBLIC_APP_URL` a la URL de preview si es diferente

## Después del Deploy

- [ ] Verificar que la app carga en la URL de Cloudflare
- [ ] Probar el login con Firebase
- [ ] Crear un viaje de prueba
- [ ] Probar la funcionalidad de IA (generar itinerario)
- [ ] Verificar que se pueden subir documentos
- [ ] Probar la función de gastos
- [ ] Probar invitar miembros por email
- [ ] Instalar la PWA desde el navegador
- [ ] Verificar que funciona offline (datos en caché)

## Troubleshooting Común

### Build falla en Cloudflare
- ✅ Verificar que todas las variables de entorno estén configuradas
- ✅ Revisar los logs del build en Cloudflare Pages Dashboard
- ✅ Confirmar que el build funciona localmente

### API Routes no funcionan
- ✅ Verificar que `GEMINI_API_KEY` y `RESEND_API_KEY` estén configuradas
- ✅ Confirmar que wrangler.jsonc tenga `nodejs_compat` en compatibility_flags

### Firebase no conecta
- ✅ Todas las variables `NEXT_PUBLIC_FIREBASE_*` deben estar configuradas
- ✅ Verificar que el dominio de Cloudflare esté autorizado en Firebase Console

### PWA no se instala
- ✅ Verificar que `manifest.json` sea accesible en `/manifest.json`
- ✅ Confirmar que el icono existe en `/icon.png`
- ✅ La PWA solo funciona con HTTPS (Cloudflare Pages usa HTTPS por defecto)

## Comando Rápido de Deploy

```bash
# 1. Hacer commit de cambios
git add .
git commit -m "chore: Update deployment configuration"

# 2. Push a main (deploy automático)
git push origin main

# 3. O deploy manual con Wrangler
npm run deploy
```

## Monitoreo

- **Logs**: Cloudflare Pages Dashboard > Tu Proyecto > Deployments > [Latest] > View build log
- **Analytics**: Cloudflare Pages Dashboard > Tu Proyecto > Analytics
- **Errors**: Cloudflare Dashboard > Workers & Pages > Tu Proyecto > Logs

---

**¿Todo listo?** Haz push a tu repositorio y Cloudflare desplegará automáticamente 🚀
