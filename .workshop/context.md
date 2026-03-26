# Investment Offerings Marketplace - Project Context

## Current Status (March 26, 2026 - Session 2)

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

6. **Admin Dashboard** (Completed Session 2)
   - ✅ Delete projects functionality (with investment validation)
   - ✅ Category filter in projects tab (Energy, Logistics, Agriculture, Real Estate, Finance, Technology, Healthcare)
   - ✅ Category-based colors for funding bars
   - ✅ Category tags displayed on projects
   - ✅ Color indicators on recent projects in overview
   - ✅ All admin endpoints converted to async for PostgreSQL compatibility
   - Deposits tab displays correctly (shows "No deposits" when empty)
   - Seed endpoint for test data: POST /api/deposits/seed-test

### 🔧 Technical Debt / In Progress
- Payouts endpoint currently returns empty list (table structure issues)
- Deposits table needs test data for UI validation

### 🔑 Key Configuration Files
- **Frontend API URL**: `/frontend/src/api.js` - hardcodes `https://investment-marketplace-api.onrender.com/api` for production
- **Vercel SPA routing**: `/frontend/vercel.json` - rewrites all routes to index.html
- **Database wrapper**: `/backend/db-wrapper.js` - handles async/sync database queries
- **Placeholder conversion**: `/backend/db.js` - converts SQLite ? to PostgreSQL $1, $2
- **Admin routes**: `/backend/routes/admin.js` - all endpoints async with category support
- **Deposits routes**: `/backend/routes/deposits.js` - seed-test endpoint for demo data

### 📊 Category Colors (Implemented)
- Energy: #4ADE80 (Green)
- Logistics: #60A5FA (Blue)
- Agriculture: #34D399 (Teal)
- Real Estate: #FBBF24 (Amber)
- Finance: #F87171 (Red)
- Technology: #A78BFA (Purple)
- Healthcare: #FB7185 (Pink)
- General: #9CA3AF (Gray)

### 📝 Credentials for Testing
- **Admin**: sgalindo@outlook.com / julio2000
- **Demo Investor**: investor@demo.com / demo123
- **Demo Business**: greentech@demo.com / demo123

### 🐛 Known Issues (Session 2)
- JWT token expiration/invalidation when testing from terminal (dev/production JWT_SECRET mismatch)
- Deposits admin tab shows empty (expected - no data in table until seed endpoint runs)

### 🚀 Next Steps
1. Run seed endpoint to populate test deposits
2. Verify deposits appear in admin dashboard
3. Test delete project functionality
4. Test category filter functionality
5. Verify category colors display correctly on funding bars

### 📋 Architecture Notes
- Admin dashboard uses category color system for visual distinction
- Delete project endpoint validates no active investments exist
- Seed endpoint (POST /api/deposits/seed-test) requires no auth for testing
- All admin queries fully async for PostgreSQL pooler compatibility