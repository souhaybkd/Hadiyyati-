export interface Profile {
  id: string
  username: string
  full_name: string
  email: string
  avatar_url?: string
  role?: 'user' | 'admin'
  created_at: string
  updated_at: string
  wishlist_color_palette?: string
  wishlist_description?: string
  status?: 'active' | 'suspended'
}

export interface WishlistItem {
  id: string
  user_id: string
  title: string
  description?: string
  price: number
  image_url?: string
  product_url?: string
  is_public: boolean
  is_purchased: boolean
  purchased_by?: string
  created_at: string
  updated_at: string
  sort_order?: number
}

export interface Transaction {
  id: string
  buyer_id?: string
  seller_id?: string
  wishlist_item_id?: string
  amount: number
  stripe_payment_intent_id: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  updated_at: string
  gift_message?: string
  delivery_status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  tracking_number?: string
  recipient_email?: string
  sender_name?: string
  is_anonymous: boolean
  delivery_date?: string
  refund_reason?: string
  refund_date?: string
  payout_method?: 'bank_transfer' | 'paypal' | 'stripe'
  payout_notes?: string
  payment_reference?: string
  admin_notes?: string
}

export interface Order {
  id: string
  user_id?: string
  stripe_session_id: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  total_amount: number
  currency: string
  customer_email: string
  custom_message?: string
  is_gift: boolean
  wishlist_owner_ids?: string
  created_at: string
  updated_at: string
  owner_id?: string
  admin_notes?: string
}

// Extended order type for admin with detailed information
export interface DetailedOrder extends Order {
  order_items: OrderItem[]
  gift_messages?: GiftMessage[]
  gift_receipts?: GiftReceipt[]
  thank_you_notes?: ThankYouNote[]
  gift_notifications?: GiftNotification[]
  buyer?: Pick<Profile, 'id' | 'username' | 'full_name' | 'email' | 'avatar_url'>
  owner?: Pick<Profile, 'id' | 'username' | 'full_name' | 'email' | 'avatar_url'>
  receivers: Pick<Profile, 'id' | 'username' | 'full_name' | 'email' | 'avatar_url'>[]
}

export interface OrderItem {
  id: string
  order_id?: string
  wishlist_item_id?: string
  title: string
  description?: string
  price: number
  quantity?: number
  image_url?: string
  created_at: string
}

export interface GiftMessage {
  id: string
  order_id?: string
  sender_id?: string
  recipient_id?: string
  message: string
  is_private?: boolean
  sent_at?: string
  read_at?: string
  created_at: string
}

export interface GiftNotification {
  id: string
  order_id?: string
  recipient_id?: string
  notification_type: string
  email_sent: boolean
  email_sent_at?: string
  is_read: boolean
  read_at?: string
  metadata?: Record<string, any>
  created_at: string
}

export interface ThankYouNote {
  id: string
  order_id?: string
  sender_id?: string
  recipient_id?: string
  message: string
  is_public: boolean
  sent_at?: string
  created_at: string
}

export interface GiftReceipt {
  id: string
  order_id?: string
  receipt_number: string
  receipt_data: Record<string, any>
  pdf_url?: string
  generated_at?: string
  created_at: string
}

export interface WishlistView {
  id: string
  wishlist_owner_id?: string
  viewer_id?: string
  viewer_ip_address?: string
  user_agent?: string
  referrer?: string
  viewed_at?: string
  created_at: string
}

export interface PayoutSettings {
  id: string
  user_id: string
  payout_method: 'bank' | 'western_union' | 'taptap' | 'whish'
  payout_details: PayoutDetails
  is_active: boolean
  created_at: string
  updated_at: string
}

// Payout method specific details
export interface BankTransferDetails {
  iban: string
  accountName: string
}

export interface WesternUnionDetails {
  fullName: string
  country: string
  phoneNumber: string
}

export interface MobileMoneyDetails {
  mobileMoneyNumber: string
}

export type PayoutDetails = BankTransferDetails | WesternUnionDetails | MobileMoneyDetails

export interface GiftStatistics {
  total_gifts_received: number
  total_amount_received: number
  completed_gifts: number
}

// Extended types for gift history views
export interface GiftHistoryItem {
  id: string
  order: Order
  items: OrderItem[]
  message?: GiftMessage
  receipt?: GiftReceipt
  thankYouNote?: ThankYouNote
  notifications: GiftNotification[]
  // Profile information for sender/recipient
  otherParty?: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
}

export interface GiftAnalytics {
  totalGiftsThisYear: number
  totalReceivedThisYear: number
  totalWishlistViews: number
  topGiftCategories: Array<{
    category: string
    count: number
    totalAmount: number
  }>
  monthlyStats: Array<{
    month: string
    giftsReceived: number
    amountReceived: number
    wishlistViews: number
  }>
  recentActivity: GiftHistoryItem[]
}

export interface AnalyticsDateFilter {
  period: 'this_year' | 'this_month' | 'last_month'
  label: string
} 