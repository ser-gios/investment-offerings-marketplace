# Deployment a Vercel + Supabase

## PASO 1: Ejecutar Migraciones en Supabase ✅

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Click en **SQL Editor** (barra izquierda)
3. Click en **New Query**
4. Copia TODO el contenido de `backend/migrations/001_initial_schema.sql`
5. Pega en el editor y click en **Run**
6. Espera a que se ejecute (2-3 segundos)

✓ Las tablas estarán creadas en Supabase.

---

## PASO 2: Preparar GitHub para Vercel

Necesitas push del código a GitHub:

```bash
cd C:\Users\sgali\Workspace\investment_offerings_marketplace
git add .
git commit -m "Preparation for Vercel deployment with Supabase"
git push origin main
```

---

## PASO 3: Desplegar Backend en Vercel

### 3a. Crear proyecto en Vercel

1. Ve a https://vercel.com
2. Click en **New Project**
3. Selecciona el repositorio `investment_offerings_marketplace`
4. Framework: **Node.js**
5. Root Directory: `backend` ← IMPORTANTE
6. Click en **Deploy**

### 3b. Configurar Variables de Entorno

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Agrega estas variables:

```
DATABASE_URL: postgresql://postgres:SEjulio2000!@db.azakblukrthsdpojpewx.supabase.co:5432/postgres
SUPABASE_URL: https://azakblukrthsdpojpewx.supabase.co
SUPABASE_KEY: sb_publishable_jFSsG8BmvZNVGQLzomiqyw_fIwRRz4... (completa)
BSCSCAN_API_KEY: 5H96S2AQQEBRJ5HBFN5PJXQ1M3K7Y9Z2W4X
BLOCKCHAIN_ADDRESS: 0xB9705cEB7821D96bF5083f70E20E268e19c1a156
USDT_CONTRACT: 0x55d398326f99059fF775485246999027B3197955
FRONTEND_URL: https://investment-marketplace.vercel.app
NODE_ENV: production
```

3. Click en **Deploy**
4. Copia la URL del backend (ej: `https://backend-xxxx.vercel.app`)

---

## PASO 4: Desplegar Frontend en Vercel

### 4a. Crear proyecto en Vercel

1. Ve a https://vercel.com
2. Click en **New Project** → Nuevo proyecto (mismo repo)
3. Framework: **React**
4. Root Directory: `frontend` ← IMPORTANTE
5. Environment Variables:

```
VITE_API_URL: https://backend-xxxx.vercel.app  ← URL que copiaste arriba
VITE_ENVIRONMENT: production
```

6. Click en **Deploy**
7. Copia la URL del frontend

---

## PASO 5: Verificaciones Finales

1. **Backend Health Check**:
   ```
   curl https://backend-xxxx.vercel.app/api/health
   ```
   Debe retornar: `{"status":"ok","ts":"2024-..."}`

2. **Test Endpoint de Depósitos**:
   ```
   GET https://backend-xxxx.vercel.app/api/deposits/balance/current
   ```
   (Requiere JWT token válido)

3. **Acceder al Frontend**:
   ```
   https://investment-marketplace.vercel.app
   ```

---

## Notas Importantes

- **Seguridad**: Nunca hardcodees passwords en el código. Siempre usa Environment Variables en Vercel.
- **CORS**: El backend permite CORS desde cualquier origen (`origin: '*'`). Para producción, actualizar a dominios específicos.
- **Database**: Las migraciones ya incluyen RLS (Row Level Security) para proteger datos.

---

## Troubleshooting

**Error: "Cannot connect to database"**
- Verifica que DATABASE_URL está correcta
- Verifica que Supabase permite conexiones desde Vercel
- En Supabase → Settings → Network → Verifica IP whitelist

**Error: "Module not found: pg"**
- Verifica que en `backend/package.json` está `pg` en dependencies
- Ejecuta `npm install` en el backend localmente

**Frontend no ve el backend**
- Verifica que `VITE_API_URL` está correcto
- Abre browser devtools → Network → verifica requests a `/api/*`
