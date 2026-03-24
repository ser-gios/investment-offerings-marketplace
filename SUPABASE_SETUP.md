# Configuración de Supabase para Deployment en Vercel

## PASO 1: Crear Proyecto en Supabase

1. Ve a https://supabase.com
2. Haz click en "Start Your Project"
3. Sign in con tu cuenta GitHub
4. Crea un nuevo proyecto:
   - **Organization**: Selecciona una existente o crea una nueva
   - **Project Name**: `investment-marketplace`
   - **Database Password**: Crea una contraseña segura (guárdala)
   - **Region**: Selecciona la más cercana a tus usuarios
   - **Pricing Plan**: Free tier está bien para empezar

5. Espera a que termine la inicialización (2-3 minutos)

## PASO 2: Obtener Credenciales

Una vez que el proyecto esté listo:

1. Ve a **Settings** → **Database** en la barra lateral
2. Copia estas credenciales:
   - **Host**: `db.[PROJECT_ID].supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: La que creaste arriba

3. Ve a **Settings** → **API** 
4. Copia:
   - **Project URL**: `https://[PROJECT_ID].supabase.co`
   - **anon public key**: Bajo "Project API keys"

## PASO 3: Crear la Connection String

Con los datos anteriores, forma la URL:

```
postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
```

Ejemplo:
```
postgresql://postgres:MyPassword123@db.abcdefghijk.supabase.co:5432/postgres
```

## PASO 4: Ejecutar Migraciones

Cuando estés listo, proporcionaremos la DATABASE_URL a Vercel y ejecutaremos las migraciones SQL.

Las migraciones incluyen:
- Creación de todas las tablas
- Índices para performance
- Políticas de Row Level Security (RLS)

## Variables para Vercel

Necesitarás configurar en Vercel:

```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_ID].supabase.co
SUPABASE_KEY=[anon-public-key]
BSCSCAN_API_KEY=5H96S2AQQEBRJ5HBFN5PJXQ1M3K7Y9Z2W4X
BLOCKCHAIN_ADDRESS=0xB9705cEB7821D96bF5083f70E20E268e19c1a156
USDT_CONTRACT=0x55d398326f99059fF775485246999027B3197955
FRONTEND_URL=https://[tu-dominio].vercel.app
```

## Siguientes Pasos

1. Configura el proyecto en Supabase
2. Compartí las credenciales
3. Ejecutaré las migraciones
4. Despliegue a Vercel
