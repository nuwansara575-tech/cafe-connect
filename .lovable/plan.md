

## Plan: Full CRM Dashboard for Cafe Connect Promotion

This is a significant expansion from the current simple admin panel to a full CRM system with campaigns, scan tracking, authentication, and richer analytics.

### Current State
- **Database**: Single `coupons` table with basic fields, no campaigns or scans tables
- **Edge function**: Single `coupons` function handling generate/validate/redeem/stats
- **Admin page**: Basic 3-tab panel (generate, list, analytics) with no auth, no search, no campaign management
- **No authentication**: Admin panel is completely open

### What We'll Build

#### 1. Database Schema (Migration)

**New `campaigns` table:**
- id, name, description, offer, start_date, end_date, status (active/expired), created_at

**New `scans` table:**
- id, coupon_id (FK to coupons), token, scan_time, device, ip_address, success (boolean)

**Modify `coupons` table:**
- Add `campaign_id` column (FK to campaigns, nullable for backward compatibility)

**RLS policies:**
- Campaigns: authenticated users can CRUD
- Scans: authenticated users can read; edge function inserts via service role
- Coupons: add INSERT/UPDATE policies for authenticated users

**User roles:**
- Create `app_role` enum and `user_roles` table with `has_role()` security definer function
- Admin role required for dashboard access

#### 2. Authentication

- Create login page at `/login` with email/password
- Create auth context/hook for session management
- Protect `/admin/*` routes behind auth guard
- No signup form (admins created manually or via a seed)

#### 3. Edge Function Updates

**Update `coupons/index.ts`:**
- On `redeem` action: record a scan entry (success=true) with device/IP info from request headers
- On `validate` action: record a scan entry (success depends on status) 
- Add campaign CRUD endpoints or handle campaigns client-side via Supabase SDK

#### 4. Admin CRM Dashboard (Complete Rebuild)

Replace the current single-page Admin with a sidebar-based dashboard layout:

**Pages/Sections:**
- **Dashboard Home** -- overview cards (total QR codes, total scans, total redemptions, redemption rate) + daily scan chart (recharts)
- **Campaigns** -- list campaigns in table, create/edit campaign dialog, each campaign shows its coupon count
- **Coupons** -- full table view with search (by token or code), status filter, sortable columns, bulk actions (deactivate/expire), download QR
- **Analytics** -- charts for daily scans, redemption rate over time, campaign comparison
- **QR Generator** -- select campaign, set discount/count, generate bulk coupons

**Layout:** Sidebar navigation with icons, header with user info and logout button.

#### 5. Scan Tracking

- Edge function captures `user-agent` and `x-forwarded-for` headers on validate/redeem calls
- Inserts into `scans` table
- Admin can view scan history per coupon

### Technical Approach

```text
src/
├── pages/
│   ├── Login.tsx              (new)
│   ├── admin/
│   │   ├── AdminLayout.tsx    (new - sidebar + outlet)
│   │   ├── Dashboard.tsx      (new - overview)
│   │   ├── Campaigns.tsx      (new - campaign CRUD)
│   │   ├── Coupons.tsx        (new - table with search/filter)
│   │   ├── Analytics.tsx      (new - charts)
│   │   └── GenerateQR.tsx     (new - QR generation)
│   ├── Index.tsx
│   └── Redeem.tsx
├── components/
│   ├── ProtectedRoute.tsx     (new)
│   └── admin/
│       ├── StatsCards.tsx      (new)
│       ├── CouponTable.tsx    (new)
│       ├── CampaignDialog.tsx (new)
│       └── ScanChart.tsx      (new)
├── hooks/
│   └── useAuth.tsx            (new)
```

### Implementation Order

1. **Database migration** -- create campaigns, scans tables; alter coupons; set up auth roles and RLS
2. **Authentication** -- login page, auth hook, protected routes
3. **Admin layout** -- sidebar-based layout with routing
4. **Dashboard home** -- stats cards + daily chart
5. **Campaign management** -- CRUD campaigns
6. **Coupon management** -- searchable/filterable table, status actions, QR download
7. **QR generation** -- linked to campaigns
8. **Analytics page** -- detailed charts
9. **Edge function update** -- scan tracking with device/IP
10. **Cleanup** -- remove old Admin.tsx, update routes

