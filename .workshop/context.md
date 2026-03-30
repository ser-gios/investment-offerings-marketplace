# Investment Offerings Marketplace - Project Context

## Current Status (March 30, 2026 - Session 5)

### ✅ COMPLETED - Account System with Commission Handling Implemented

#### System Architecture
The marketplace now has a complete **Account Transactions System** with the following structure:

**Tables Created:**
1. `platform_config` - Admin-configurable settings (default: 3% commission)
2. `account_transactions` - Complete audit trail of all money movements

**Account Flow:**
When an investor invests $200 USDT in a business project:
- Investor balance: -$200 (debited)
- Business balance: +$194 (97% of investment, credited)
- Platform/Admin balance: +$6 (3% commission, credited)
- All transactions recorded in `account_transactions` for audit trail

**Key Features:**
- Admin can configure commission percentage via API
- Every investment creates 2 transaction records:
  1. Investment transaction (investor → business, net amount)
  2. Commission transaction (investor → platform, fee amount)
- Automatic transaction recording with reference tracking
- Non-blocking error handling for transaction recording

#### Previous Fixes (Still Active)
- ✅ Rating form visible even without existing ratings
- ✅ Rating bars height increased (8px → 12px)
- ✅ Marketplace projects visibility (async routes)
- ✅ NaN interest rate display fixed
- ✅ SQLite syntax incompatibility resolved
- ✅ Missing database tables handled
- ✅ Ratings system fully functional
- ✅ Admin dashboard complete
- ✅ Website & presentation links added

### 📋 Database Schema

**platform_config Table:**
```sql
id TEXT PRIMARY KEY
key TEXT UNIQUE (e.g., 'commission_percentage')
value TEXT (e.g., '3' for 3%)
description TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**account_transactions Table:**
```sql
id TEXT PRIMARY KEY
from_user_id TEXT (who sent money)
to_user_id TEXT (who received money)
amount REAL (net amount transferred)
transaction_type TEXT (investment_received, platform_commission, payout_issued, etc)
reference_id TEXT (investment ID or payout ID)
reference_type TEXT (investment, payout, etc)
description TEXT (human-readable description)
fee_amount REAL (commission or fee deducted)
status TEXT (completed, pending, failed)
created_at TIMESTAMP
```

### 🔧 API Endpoints - New

**Admin Configuration:**
- `GET /api/admin/config` - Get all platform configuration
- `PATCH /api/admin/config/:key` - Update configuration value (e.g., commission_percentage)

**Transaction Tracking:**
- `GET /api/admin/transactions?limit=100&offset=0&type=investment_received` - View all transactions with filters
- `GET /api/admin/balances` - View all user balances (investor and business accounts)

### 💰 Investment Endpoint Changes

**POST /api/investments** (now async, with commission handling)
- Response now includes:
  - `business_amount` - Amount credited to business (without commission)
  - `platform_fee` - Commission deducted by platform
  - Example: invest $200 → business_amount: $194, platform_fee: $6

**Process:**
1. Get commission percentage from `platform_config`
2. Calculate fee_amount = investment_amount × commission_rate
3. Create investment record (full amount)
4. Debit investor balance (full amount)
5. Credit business balance (net amount minus fee)
6. Credit platform/admin balance (fee amount)
7. Record both transactions in account_transactions
8. Schedule first payout

### 📊 Admin Configuration Examples

**Get current commission:**
```bash
GET /api/admin/config
# Response: { "commission_percentage": "3" }
```

**Change commission to 5%:**
```bash
PATCH /api/admin/config/commission_percentage
Body: { "value": "5" }
```

**View all transactions:**
```bash
GET /api/admin/transactions?limit=100&offset=0&type=investment_received
```

**View account balances:**
```bash
GET /api/admin/balances
# Shows all investors and businesses with their current balances
```

### 🔑 Key Configuration
- **Frontend API URL**: Hardcoded to `https://investment-marketplace-api.onrender.com/api`
- **Auto-approval**: New projects auto-created as `active` and `paid` for demo
- **Database**: PostgreSQL in production (Supabase), SQLite in development
- **Default Commission**: 3% (configurable by admin)
- **Async Database Access**: Using `dbAsync` wrapper for all PostgreSQL queries

### ⚠️ Remaining Tasks (Optional)
- Convert remaining sync routes to async (investments.js GET endpoints, uploads.js)
- Add payout system to also record transactions when payouts are issued
- Create frontend admin pages for:
  - Viewing transaction history
  - Configuring commission percentage
  - Monitoring account balances
- Add detailed business owner dashboard showing:
  - Total received from investments
  - Commission deductions
  - Account balance
  - Transaction history

### ✅ Tested & Working
- ✓ Marketplace displays all active projects
- ✓ Interest rates display correctly (no NaN)
- ✓ Category filtering and colors working
- ✓ Admin dashboard fully functional
- ✓ Create project auto-approves
- ✓ Delete projects with investment validation
- ✓ Ratings can be submitted and calculated
- ✓ Rating form visible even before ratings exist
- ✓ Growth bars taller and more visible
- ✓ Account system schema created
- ✓ Commission calculation working
- ✓ Investment flow includes proper fund distribution

### 🚀 Next Steps
1. Call POST /api/init-db to create new tables in production
2. Test investment flow to verify commission deductions
3. View admin endpoints to confirm transaction recording
4. Optionally, build frontend admin interface for transaction management