# Hadiaytti - Gift-Giving Platform

A bilingual (Arabic RTL + English LTR) gift-giving platform built with Next.js 15, Supabase, and Stripe.

## 🚀 Features

- **Bilingual Support**: Full Arabic (RTL) and English (LTR) support
- **Authentication**: Supabase Auth with Google login
- **Payments**: Stripe integration for secure transactions
- **Responsive Design**: Mobile-first with DaisyUI components
- **Real-time**: Real-time updates with Supabase
- **Admin Dashboard**: User management and analytics
- **Dark/Light Theme**: Toggle between themes

## 📋 Pages

- **/** - Homepage with hero and features
- **/auth** - Combined login/register/reset page
- **/dashboard** - User dashboard with tabs
- **/wishlist/[username]** - Public wishlist view
- **/admin** - Admin dashboard (protected)
- **/contact** - Contact form
- **/terms** - Terms of service and privacy policy

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, DaisyUI
- **Backend**: Supabase (Auth + Database)
- **Database**: PostgreSQL
- **Payments**: Stripe
- **Deployment**: Vercel

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

### 3. Database Setup

Create the following tables in your Supabase database:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Wishlist items table
CREATE TABLE wishlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  product_url TEXT,
  is_public BOOLEAN DEFAULT true,
  is_purchased BOOLEAN DEFAULT false,
  purchased_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES profiles(id),
  seller_id UUID REFERENCES profiles(id),
  wishlist_item_id UUID REFERENCES wishlist_items(id),
  amount DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view public wishlist items" ON wishlist_items
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist items" ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
```

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📱 Features Overview

### 🏠 Homepage
- Hero section with call-to-action
- Feature highlights
- Responsive design

### 🔐 Authentication
- Login/Register forms
- Google OAuth integration
- Password reset functionality
- Protected routes

### 📊 Dashboard
- **My Wishlist**: Manage personal wishlist items
- **Shared with Me**: View wishlists shared by others
- **Gift History**: Track gift purchases
- **Settings**: Account preferences
- **Analytics**: Wishlist performance stats

### 👑 Admin Dashboard
- User management
- Platform statistics
- Payout management
- System analytics

### 🌐 Internationalization
- Arabic (RTL) and English (LTR) support
- Language toggle in navigation
- Localized content and UI

### 🎨 Theming
- Light/Dark mode toggle
- DaisyUI component library
- Consistent design system

## 🔧 Development

### Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   ├── wishlist/          # Wishlist pages
│   ├── admin/             # Admin pages
│   └── contact/           # Contact page
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── Navbar.tsx        # Navigation
│   ├── Hero.tsx          # Hero section
│   └── ...
├── lib/                  # Utility functions
│   ├── contexts/         # React contexts
│   ├── supabase.ts       # Supabase client
│   └── stripe.ts         # Stripe client
├── middleware.ts         # Route protection
└── ...
```

### Key Technologies

- **Next.js 15**: React framework with App Router
- **Supabase**: Backend-as-a-Service for auth and database
- **Stripe**: Payment processing
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Component library for Tailwind
- **TypeScript**: Type safety

## 🚀 Deployment

### Vercel Deployment

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import project to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Configure Environment Variables in Vercel**
   
   Go to Project Settings → Environment Variables and add:
   
   **Required Variables:**
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Site Configuration
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   
   # Resend (Email) - Optional
   RESEND_API_KEY=your_resend_api_key
   ```

   **Important:** 
   - Set `NEXT_PUBLIC_SITE_URL` to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
   - Add variables for all environments (Production, Preview, Development)
   - Use Vercel's environment variable encryption

4. **Configure Build Settings**
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   - Node.js Version: 18.x or higher (recommended)

5. **Stripe Webhook Configuration**
   - In Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in Vercel

6. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-app.vercel.app`

### Vercel-Specific Settings

The project includes a `vercel.json` configuration file with:
- API route headers for CORS
- Build and install commands
- Region settings (US East - iad1)

### Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test authentication (login/register)
- [ ] Test Stripe payment flow
- [ ] Verify webhook endpoint is accessible
- [ ] Test API routes
- [ ] Check middleware protection on protected routes
- [ ] Verify image loading from external domains
- [ ] Test RTL/LTR language switching

### Supabase Setup

1. Create a new Supabase project
2. Run the SQL commands above
3. Enable authentication providers (Email, Google OAuth)
4. Configure RLS policies
5. Add your Vercel domain to Supabase allowed origins

### Stripe Setup

1. Create a Stripe account
2. Get API keys from dashboard
3. Set up webhooks for payment events (point to your Vercel URL)
4. Configure payment methods
5. Test with Stripe test mode first

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, email support@hadiaytti.com or join our community Discord.

---

Built with ❤️ by the Hadiaytti Team 