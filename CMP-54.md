# Plan: Integrate Vercel, Stripe, Supabase

## Task: CMP-54 "对接 vercel，stripe，supabase"

### Goal
Integrate third-party services (Vercel, Stripe, Supabase) into the AI Medical Imaging SaaS platform.

### Integrations

#### 1. Vercel Deployment
- Deploy web frontend to Vercel
- Configure environment variables
- Set up preview deployments for PRs
- Update build configuration

#### 2. Stripe Payment Integration
- Add Stripe SDK to API service
- Create subscription tiers (Free, Pro, Enterprise)
- Add webhook handlers for payment events
- Create pricing page in frontend
- Add billing management to settings

#### 3. Supabase Integration
- Use Supabase Auth for user authentication
- Use Supabase Database for PostgreSQL features
- Use Supabase Storage for non-DICOM files
- Keep MinIO for DICOM file storage (HIPAA compliance)
- Create Supabase client configuration

### Implementation Order
1. Vercel deployment configuration
2. Stripe integration (backend + frontend)
3. Supabase integration (gradual migration)

### Files to Create/Modify
- `vercel.json` - Vercel configuration
- `.env.example` - Environment variables
- `src/api/src/services/stripe.ts` - Stripe service
- `src/api/src/routes/billing.ts` - Billing API routes
- `src/web/src/api/billing.ts` - Billing API client
- `src/web/src/pages/Pricing.tsx` - Pricing page
- `src/web/src/lib/supabase.ts` - Supabase client
