# Vercel Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Environment Variables (Required in Vercel Dashboard)

Add these in **Project Settings → Environment Variables**:

#### Supabase
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

#### Stripe
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key
- `STRIPE_SECRET_KEY` - Your Stripe secret key (server-side only)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook signing secret

#### Site Configuration
- `NEXT_PUBLIC_SITE_URL` - **IMPORTANT**: Set to your Vercel deployment URL
  - Example: `https://your-app.vercel.app`
  - This is used for Stripe redirects and email links

#### Email (Optional)
- `RESEND_API_KEY` - If using Resend for email notifications

### 2. Stripe Webhook Setup

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your Vercel URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the "Signing secret" and add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### 3. Supabase Configuration

1. In Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel domain to "Site URL" and "Redirect URLs":
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`
3. For Google OAuth, add the callback URL to Google Cloud Console

### 4. Build Configuration

Vercel will auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)
- **Node.js Version**: 18.x or higher

### 5. Project Configuration Files

✅ `vercel.json` - Already configured with:
- Region: US East (iad1)
- API route CORS headers

✅ `next.config.js` - Updated with:
- Image remote patterns (Google profile images)
- Removed deprecated i18n config

## 🚀 Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Configure for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables listed above
   - **Important**: Add them for all environments (Production, Preview, Development)

4. **Deploy**
   - Click "Deploy"
   - Monitor the build logs
   - Wait for deployment to complete

5. **Update Environment Variables**
   - After first deployment, update `NEXT_PUBLIC_SITE_URL` with your actual Vercel URL
   - Redeploy if needed

## 🔍 Post-Deployment Verification

### Test These Features:

- [ ] Homepage loads correctly
- [ ] Authentication (login/register) works
- [ ] Google OAuth login works
- [ ] Dashboard is accessible after login
- [ ] Stripe checkout flow works
- [ ] Webhook receives events (check Stripe dashboard)
- [ ] Email notifications work (if configured)
- [ ] API routes respond correctly
- [ ] Protected routes redirect correctly
- [ ] Images load from external domains
- [ ] Language switching (RTL/LTR) works

### Common Issues & Solutions

**Issue**: Build fails with environment variable errors
- **Solution**: Ensure all required environment variables are set in Vercel

**Issue**: Stripe webhooks not working
- **Solution**: Verify `STRIPE_WEBHOOK_SECRET` is set and webhook URL is correct in Stripe dashboard

**Issue**: Authentication redirects not working
- **Solution**: Add your Vercel domain to Supabase allowed URLs

**Issue**: Images not loading
- **Solution**: Verify image domains are configured in `next.config.js`

**Issue**: API routes return 500 errors
- **Solution**: Check Vercel function logs and verify all environment variables are set

## 📝 Notes

- Vercel automatically handles:
  - Serverless function deployment
  - Edge middleware
  - Static asset optimization
  - Automatic HTTPS
  - CDN distribution

- The `vercel.json` file is optional but recommended for:
  - Custom headers
  - Region selection
  - Redirects/rewrites

- Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser
- Server-side only variables (like `STRIPE_SECRET_KEY`) are secure and not exposed

