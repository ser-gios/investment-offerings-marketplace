# Deployment Guide: Vercel + Supabase

## Arquitectura

- **Backend**: Node.js/Express en Vercel (Serverless)
- **Frontend**: React/Vite en Vercel (Static)
- **Base de Datos**: PostgreSQL en Supabase
- **Almacenamiento de archivos**: Supabase Storage

## Pasos de Deployment

### 1. Configurar Supabase

```bash
# Crear proyecto en supabase.com
# - Copiar las credenciales:
#   - DATABASE_URL
#   - SUPABASE_ANON_KEY
#   - SUPABASE_SERVICE_ROLE_KEY
```

### 2. Preparar Backend para Vercel

El backend necesita ser convertido de SQLite a PostgreSQL usando Supabase.

**Cambios necesarios:**
1. Reemplazar `better-sqlite3` con `pg` o `@supabase/supabase-js`
2. Actualizar `db.js` para conectar a Supabase
3. Migraciones SQL para crear tablas

### 3. Preparar Frontend para Vercel

El frontend está listo. Solo necesita:
1. Variables de entorno para la URL de API en producción
2. Archivos de configuración de Vercel

### 4. Crear `vercel.json` para Backend

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "BSCSCAN_API_KEY": "@bscscan_api_key"
  }
}
```

## Base de Datos - Migración a PostgreSQL

Las tablas actuales (SQLite) necesitan ser creadas en Supabase:

```sql
-- Users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'investor',
  avatar TEXT,
  balance DECIMAL(12, 2) DEFAULT 0,
  wallet_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1
);

-- Projects table
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  payout_frequency TEXT NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  min_investment DECIMAL(10, 2) DEFAULT 1000,
  max_investment DECIMAL(10, 2),
  total_pool DECIMAL(12, 2) NOT NULL DEFAULT 0,
  funded_amount DECIMAL(12, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  category TEXT,
  risk_level TEXT DEFAULT 'medium',
  duration_months INTEGER DEFAULT 12,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deposits table
CREATE TABLE deposits (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  blockchain_verified INTEGER DEFAULT 0,
  confirmation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investments table
CREATE TABLE investments (
  id TEXT PRIMARY KEY,
  investor_id TEXT NOT NULL REFERENCES users(id),
  project_id TEXT NOT NULL REFERENCES projects(id),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active',
  purchase_price DECIMAL(10, 2) NOT NULL,
  current_value DECIMAL(10, 2) NOT NULL,
  interest_earned DECIMAL(10, 2) DEFAULT 0,
  last_payout TIMESTAMP,
  paid_from_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- [Agregar más tablas según necesidad]
```

## Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-secret-key
BSCSCAN_API_KEY=your-bscscan-api-key
NODE_ENV=production
PORT=3000
BLOCKCHAIN_ADDRESS=0xB9705cEB7821D96bF5083f70E20E268e19c1a156
USDT_CONTRACT=0x55d398326f99059fF775485246999027B3197955
```

### Frontend (.env)
```
VITE_API_URL=https://your-backend.vercel.app/api
```

## Deploy Steps

1. **Preparar repositorio Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Backend en Vercel**
   ```bash
   cd backend
   vercel deploy --prod
   # Configurar variables de entorno en Vercel dashboard
   ```

3. **Frontend en Vercel**
   ```bash
   cd frontend
   vercel deploy --prod
   # Configurar VITE_API_URL en Vercel dashboard
   ```

## Testing Post-Deploy

- [ ] Login funciona
- [ ] "Mi Cuenta" muestra balance $0
- [ ] Depósito se puede crear
- [ ] Inversión debita balance
- [ ] Admin ve sección de depósitos
- [ ] Marketplace muestra proyectos pagados

## Notas Importantes

- **SQLite a PostgreSQL**: Necesita refactoring de la capa de base de datos
- **File Uploads**: Cambiar de `multer` a Supabase Storage
- **API Keys**: Mantener seguros en Vercel Secrets
- **CORS**: Configurar para dominio de producción
