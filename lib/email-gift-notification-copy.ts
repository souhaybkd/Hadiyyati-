export type GiftNotificationCopy = {
  preview: (senderName: string) => string
  headingEn: string
  headingAr: string
  greetingEn: (recipientName: string) => string
  greetingAr: (recipientName: string) => string
  bodyEn: (senderName: string) => string
  bodyAr: (senderName: string) => string
  messageLabelEn: (senderName: string) => string
  messageLabelAr: (senderName: string) => string
  itemsHeadingEn: string
  itemsHeadingAr: string
  totalEn: (amount: string) => string
  totalAr: (amount: string) => string
  ctaEn: string
  ctaAr: string
  afterCtaEn: (senderName: string) => string
  afterCtaAr: (senderName: string) => string
  signoffEn: string
  signoffAr: string
  footerEn: string
  footerAr: string
  visitEn: string
  visitAr: string
  unsubscribeEn: string
  unsubscribeAr: string
  subject: (senderName: string) => string
}

export const giftNotificationCopy: GiftNotificationCopy = {
  preview: (senderName) =>
    `🎁 Gift from ${senderName} | هدية من ${senderName}`,
  headingEn: "🎁 You've Got a Gift!",
  headingAr: '🎁 لديك هدية!',
  greetingEn: (name) => `Hi ${name},`,
  greetingAr: (name) => `مرحباً ${name}،`,
  bodyEn: (sender) =>
    `Great news! ${sender} has sent you a wonderful gift through hadiyyati! Your wishlist items have been purchased.`,
  bodyAr: (sender) =>
    `أخبار رائعة! أرسل لك ${sender} هدية جميلة عبر هديتي! تم شراء عناصر من قائمة أمنياتك.`,
  messageLabelEn: (sender) => `💌 Personal message from ${sender}:`,
  messageLabelAr: (sender) => `💌 رسالة شخصية من ${sender}:`,
  itemsHeadingEn: 'Your gift items',
  itemsHeadingAr: 'عناصر الهدية',
  totalEn: (amount) => `Total gift value: ${amount}`,
  totalAr: (amount) => `إجمالي قيمة الهدية: ${amount}`,
  ctaEn: 'View gift details',
  ctaAr: 'عرض تفاصيل الهدية',
  afterCtaEn: (sender) =>
    `You can view your gift, send a thank-you note to ${sender}, and track everything in your hadiyyati dashboard.`,
  afterCtaAr: (sender) =>
    `يمكنك عرض الهدية، إرسال رسالة شكر إلى ${sender}، ومتابعة كل التفاصيل من لوحة التحكم في هديتي.`,
  signoffEn: 'Thank you for using hadiyyati — making gift-giving simple and meaningful! 💝',
  signoffAr: 'شكراً لاستخدامك هديتي — نجعل الإهداء بسيطاً وذا معنى! 💝',
  footerEn: 'This email was sent by hadiyyati. Questions?',
  footerAr: 'أُرسل هذا البريد من هديتي. لديك سؤال؟',
  visitEn: 'Visit hadiyyati',
  visitAr: 'زيارة هديتي',
  unsubscribeEn: 'Unsubscribe',
  unsubscribeAr: 'إلغاء الاشتراك',
  subject: (sender) =>
    `🎁 You've received a gift from ${sender}! | هدية من ${sender}!`,
}
