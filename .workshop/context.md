# Investment Offerings Marketplace - Project Context

## Current Status (March 25, 2026)

### ✅ Completed Features
1. **Authentication System**
   - Login/Register with JWT tokens
   - Password reset with Brevo email integration
   - Role-based access control (investor, business, admin)
   - Admin user created and functional

2. **Frontend Deployment**
   - Vercel SPA routing configured (rewrite all routes to index.html)
   - Hardcoded Render backend URL for production
   - Frontend accessible at: https://investment-marketplace-frontend.vercel.app

3. **Backend Deployment**  
   - Render.com with PostgreSQL via Supabase
   - IPv4-forced DNS resolution to work with Supabase pooler
   - SSL certificate verification disabled for pooler.supabase.com
   - Health check endpoint working
   - API accessible at: https://investment-marketplace-api.onrender.com

4. **Database**
   - PostgreSQL in production (Supabase)
   - SQLite in development
   - Automatic placeholder conversion (? → $1, $2 for PostgreSQL)
   - Migration from SQLite to PostgreSQL successful

5. **Create Project Flow**
   - Business users can create new projects
   - Projects appear in "My Projects" after creation
   - Admin can approve/reject projects before Marketplace visibility

### 🔧 Technical Debt / In Progress
- Many admin endpoints still using synchronous queries (need async conversion)
- Admin panel loads but some endpoints return 500 errors
- Other routes (investments, deposits, payouts) need async query conversion

### 🔑 Key Configuration Files
- **Frontend API URL**: `/frontend/src/api.js` - hardcodes `https://investment-marketplace-api.onrender.com/api` for production
- **Vercel SPA routing**: `/frontend/vercel.json` - rewrites all routes to index.html
- **Database wrapper**: `/backend/db-wrapper.js` - handles async/sync database queries
- **Placeholder conversion**: `/backend/db.js` - converts SQLite ? to PostgreSQL $1, $2

### 📝 Credentials for Testing
- **Admin**: sgalindo@outlook.com / julio2000
- **Demo Investor**: investor@demo.com / demo123
- **Demo Business**: greentech@demo.com / demo123

### 🐛 Known Issues
- Admin panel shows but endpoints like `/api/admin/users` return 500
- Need to make all remaining synchronous queries async for PostgreSQL compatibility
- Some secondary market and investment endpoints may have similar issues

### 🚀 Next Steps
1. Convert all remaining endpoint handlers to async (admin, investments, deposits, ratings, etc.)
2. Test admin approval workflow for projects
3. Test investor investment creation
4. Test marketplace display of approved projects