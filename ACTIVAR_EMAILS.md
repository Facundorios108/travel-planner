# 🚀 CÓMO ACTIVAR EL ENVÍO DE EMAILS - PASOS SIMPLES

## ✅ Lo que ya está listo:
1. ✅ Resend instalado
2. ✅ Código actualizado para enviar emails
3. ✅ Archivo .env.local creado

## 🔑 SOLO TE FALTA OBTENER TU API KEY (2 minutos)

### Paso 1: Crear cuenta en Resend

1. **Abre tu navegador** y ve a: https://resend.com/signup

2. **Regístrate con tu email** (o con Google)
   - ❌ NO necesitas tarjeta de crédito
   - ✅ Plan gratuito: 100 emails al día
   - ✅ 3,000 emails al mes gratis

3. **Verifica tu email** (te enviarán un correo de confirmación)

---

### Paso 2: Obtener tu API Key

1. **Inicia sesión** en https://resend.com

2. **Ve al Dashboard** (te lleva automáticamente)

3. **Click en "API Keys"** (menú lateral izquierdo)

4. **Click en el botón "Create API Key"**

5. Dale un nombre (ejemplo: "StayFinder Dev")

6. **Copia la API key que aparece** 
   - ⚠️ IMPORTANTE: Solo se muestra UNA VEZ
   - Se ve algo así: `re_123abc456def789ghi`

---

### Paso 3: Pegar tu API Key

1. **Abre el archivo** `.env.local` (está en la raíz del proyecto)

2. **Busca esta línea:**
   ```
   RESEND_API_KEY=TU_API_KEY_AQUI
   ```

3. **Reemplázala con tu API key:**
   ```
   RESEND_API_KEY=re_tu_api_key_real_aqui
   ```

4. **Guarda el archivo** (Cmd+S)

---

### Paso 4: Reiniciar el servidor

**En tu terminal, presiona:**
```bash
Ctrl+C  # Para detener el servidor actual
npm run dev  # Para iniciar de nuevo
```

---

## ✅ ¡LISTO! Probar que funciona

1. **Abre tu app** en http://localhost:3000

2. **Ve a un viaje** y click en el botón de compartir (icono de usuarios)

3. **Invita a TU PROPIO EMAIL** (para probar)

4. **Revisa tu bandeja de entrada** 
   - Debería llegar en menos de 1 minuto
   - Si no está en inbox, revisa SPAM

5. **¡Deberías ver un email hermoso!** 🎉

---

## ❓ Si no te llega el email:

1. **Verifica tu API key:**
   - Abre `.env.local`
   - Debe empezar con `re_`
   - No debe tener espacios ni comillas

2. **Reinicia el servidor:**
   ```bash
   Ctrl+C
   npm run dev
   ```

3. **Revisa la consola del servidor:**
   - Busca mensajes como `[EMAIL SENT]`
   - O errores como `[RESEND ERROR]`

4. **Revisa la carpeta de SPAM** en tu email

---

## 📊 Plan Gratuito de Resend

- ✅ 100 emails por día
- ✅ 3,000 emails por mes
- ✅ Sin tarjeta de crédito
- ✅ Para siempre

**Más que suficiente para tu app! 🚀**

---

## 🎯 Resumen Visual

```
1. resend.com/signup → Crear cuenta (2 min)
2. Dashboard → API Keys → Create → Copiar key
3. .env.local → Pegar tu API key
4. Ctrl+C → npm run dev (reiniciar)
5. Probar invitando a tu email
6. ¡Funciona! 🎉
```

---

**¿Necesitas ayuda?** Los pasos están en este orden específico por algo. Si sigues cada paso, ¡funcionará!
