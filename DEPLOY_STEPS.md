# 🚀 Pasos para Deploy en Vercel + Supabase

## Paso 1: Crear Base de Datos en Supabase

1. Ir a https://supabase.com y crear cuenta
2. Crear nuevo proyecto
3. Copiar:
   - `Project URL` 
   - `API Key (anon)`
   - `API Key (service_role)`
   - `Database Password`

4. Ir a SQL Editor y ejecutar el script:
   ```
   backend/migrations/001_initial_schema.sql
   ```

5. En Settings → Database, copiar:
   ```
   postgresql://postgres:[password]@[host]:5432/postgres
   ```

## Paso 2: Actualizar Backend para PostgreSQL

### 2.1 Instalar dependencias

```bash
cd backend
npm install pg dotenv
```

### 2.2 Reemplazar db.js

El archivo actual usa SQLite. Necesita ser reemplazado para usar PostgreSQL:

```javascript
// backend/db.js (nuevo)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
```

### 2.3 Actualizar rutas para usar queries async

Cambiar de:
```javascript
db.prepare('SELECT...').all()
```

A:
```javascript
const res = await db.query('SELECT...');
res.rows
```

**Nota:** Este cambio es significativo. Se proporciona un script de migración.

## Paso 3: Deploy Backend en Vercel

### 3.1 Conectar repositorio a Vercel

```bash
# Inicializar Git (si no está)
git init
git add .
git commit -m "Initial commit"

# Opción A: Conectar GitHub a Vercel
# - Ir a https://vercel.com
# - Import Project desde GitHub
# - Seleccionar repositorio

# Opción B: Desplegar directo con CLI
npm install -g vercel
vercel login
vercel --prod
```

### 3.2 Configurar variables de entorno en Vercel

En Vercel Dashboard → Project Settings → Environment Variables:

```
DATABASE_URL = postgresql://...
JWT_SECRET = nexvest_secret_2026
BSCSCAN_API_KEY = 5H96S2AQQEBRJ5HBFN5PJXQ1M3K7Y9Z2W4X
BLOCKCHAIN_ADDRESS = 0xB9705cEB7821D96bF5083f70E20E268e19c1a156
USDT_CONTRACT = 0x55d398326f99059fF775485246999027B3197955
NODE_ENV = production
```

### 3.3 Verificar deployment

```bash
curl https://your-backend.vercel.app/api/health
# Respuesta esperada: {"status":"ok","ts":"2026-03-24T..."}
```

## Paso 4: Deploy Frontend en Vercel

### 4.1 Crear archivo .env.production

En `frontend/.env.production`:
```
VITE_API_URL=https://your-backend.vercel.app/api
```

### 4.2 Desplegar

```bash
cd frontend
vercel --prod
```

### 4.3 Configurar dominio

En Vercel Dashboard:
- Agregar dominio personalizado (opcional)
- Los dominios de Vercel son automáticos: `your-app.vercel.app`

## Paso 5: Testing Post-Deploy

### 5.1 Verificar conectividad

```bash
# Backend health
curl https://your-backend.vercel.app/api/health

# Frontend carga
curl https://your-frontend.vercel.app
```

### 5.2 Test de login

En el navegador:
1. Ir a https://your-frontend.vercel.app
2. Click "Business Demo"
3. Debería funcionar el login

### 5.3 Test de depósitos

1. Click "Investor Demo"
2. Click "Mi Cuenta"
3. Tab "Depositar"
4. Crear depósito de $500

### 5.4 Test de Admin

1. Login con:
   - Email: `sgalindo@outlook.com`
   - Password: `julio2000`
2. Ver Admin Dashboard
3. Nueva sección "Depósitos" debe visible

## Paso 6: Configurar CI/CD (Opcional)

Vercel automáticamente despliega con cada push a main:

```bash
# En tu repositorio local
git add .
git commit -m "Descripción del cambio"
git push origin main

# Vercel automáticamente:
# 1. Construye el proyecto
# 2. Ejecuta tests (si hay)
# 3. Despliega si todo pasa
```

## Troubleshooting

### Error: "Cannot connect to database"

**Causa**: `DATABASE_URL` no configurada
**Solución**: 
1. Ir a Vercel Dashboard
2. Project Settings → Environment Variables
3. Agregar `DATABASE_URL` correctamente

### Error: "CORS error"

**Causa**: Frontend hace request a backend en otro dominio
**Solución**: En `backend/server.js`:
```javascript
app.use(cors({ origin: 'https://your-frontend.vercel.app' }));
```

### Error: "RLS policy violation"

**Causa**: Policies de Row Level Security en Supabase
**Solución**: Desactivar RLS durante development:
```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE deposits DISABLE ROW LEVEL SECURITY;
```

### Depósitos no se acreditan

**Causa**: Blockchain verification fallando
**Solución**: 
1. Verificar que `BSCSCAN_API_KEY` esté configurada
2. Hash de TX debe ser válido en BNB Chain
3. Dirección destino debe ser `0xB9705cEB7821D96bF5083f70E20E268e19c1a156`

## URLs de Referencia

| Servicio | URL |
|----------|-----|
| Supabase | https://supabase.com |
| Vercel | https://vercel.com |
| BscScan API | https://bscscan.com/apis |
| BNB Chain | https://www.bnbchain.org |

## Credenciales Demo (Post-Deploy)

Estas credenciales funcionan después de la migración de datos:

| Tipo | Email | Contraseña |
|------|-------|-----------|
| Inversor | investor@demo.com | demo123 |
| Empresa | greentech@demo.com | demo123 |
| Admin | sgalindo@outlook.com | julio2000 |

## Soporte

Si hay problemas durante el deployment:

1. Verificar logs en Vercel: Dashboard → Deployments → View Logs
2. Verificar logs de Supabase: Database → Logs
3. Verificar variables de entorno están configuradas
4. Asegurar que el script SQL se ejecutó correctamente

---

**Tiempo estimado total**: 30-45 minutos

**Dificultad**: Media (requiere migración de SQLite a PostgreSQL)
