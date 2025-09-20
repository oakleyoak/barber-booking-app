export default {
  common: {
    save: 'ذخیره',
    cancel: 'لغو',
    delete: 'حذف',
    edit: 'ویرایش',
    add: 'افزودن',
    search: 'جستجو',
    loading: 'در حال بارگذاری...',
    error: 'خطا',
    success: 'موفقیت',
    confirm: 'تأیید',
    yes: 'بله',
    no: 'خیر',
    close: 'بستن',
    back: 'بازگشت',
    next: 'بعدی',
    previous: 'قبلی',
    select: 'انتخاب',
    selected: 'انتخاب شده',
    clear: 'پاک کردن',
    filter: 'فیلتر',
    sort: 'مرتب سازی',
    export: 'صادرات',
    import: 'واردات',
    download: 'دانلود',
    upload: 'آپلود',
    send: 'ارسال',
    receive: 'دریافت',
    pay: 'پرداخت',
    paid: 'پرداخت شده',
    pending: 'در انتظار',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده',
    active: 'فعال',
    inactive: 'غیرفعال',
  },
  navigation: {
    dashboard: 'داشبورد',
    bookings: 'رزروها',
    customers: 'مشتریان',
    services: 'خدمات',
    inventory: 'انبار',
    reports: 'گزارشات',
    settings: 'تنظیمات',
    profile: 'پروفایل',
    logout: 'خروج',
  },
  booking: {
    title: 'رزروها',
    newBooking: 'رزرو جدید',
    editBooking: 'ویرایش رزرو',
    customerName: 'نام مشتری',
    service: 'خدمت',
    date: 'تاریخ',
    time: 'زمان',
    price: 'قیمت',
    notes: 'یادداشت‌ها',
    status: 'وضعیت',
    barber: 'آرایشگر',
    duration: 'مدت زمان',
    total: 'مجموع',
    paymentStatus: 'وضعیت پرداخت',
    paymentMethod: 'روش پرداخت',
    confirmBooking: 'تأیید رزرو',
    cancelBooking: 'لغو رزرو',
    rescheduleBooking: 'تغییر زمان رزرو',
    bookingConfirmed: 'رزرو تأیید شد',
    bookingCancelled: 'رزرو لغو شد',
    bookingRescheduled: 'زمان رزرو تغییر یافت',
    noBookings: 'رزروی یافت نشد',
    searchBookings: 'جستجوی رزروها...',
    filterByStatus: 'فیلتر بر اساس وضعیت',
    filterByDate: 'فیلتر بر اساس تاریخ',
    today: 'امروز',
    tomorrow: 'فردا',
    thisWeek: 'این هفته',
    thisMonth: 'این ماه',
  },
  customer: {
    title: 'مشتریان',
    newCustomer: 'مشتری جدید',
    editCustomer: 'ویرایش مشتری',
    name: 'نام',
    email: 'ایمیل',
    phone: 'تلفن',
    address: 'آدرس',
    notes: 'یادداشت‌ها',
    totalBookings: 'مجموع رزروها',
    totalSpent: 'مجموع هزینه‌ها',
    lastVisit: 'آخرین بازدید',
    addCustomer: 'افزودن مشتری',
    searchCustomers: 'جستجوی مشتریان...',
    noCustomers: 'مشتری یافت نشد',
    customerAdded: 'مشتری با موفقیت اضافه شد',
    customerUpdated: 'مشتری با موفقیت به‌روزرسانی شد',
    customerDeleted: 'مشتری با موفقیت حذف شد',
  },
  invoice: {
    title: 'فاکتور',
    invoiceNumber: 'شماره فاکتور',
    invoiceDate: 'تاریخ فاکتور',
    dueDate: 'تاریخ سررسید',
    from: 'از',
    to: 'به',
    item: 'مورد',
    quantity: 'تعداد',
    unitPrice: 'قیمت واحد',
    amount: 'مبلغ',
    subtotal: 'جمع جزء',
    tax: 'مالیات',
    discount: 'تخفیف',
    total: 'مجموع',
    paymentTerms: 'شرایط پرداخت',
    notes: 'یادداشت‌ها',
    thankYou: 'از کسب و کار شما سپاسگزاریم!',
    payNow: 'همین حالا پرداخت کنید',
    downloadInvoice: 'دانلود فاکتور',
    sendInvoice: 'ارسال فاکتور',
    invoiceSent: 'فاکتور با موفقیت ارسال شد',
    paymentLink: 'لینک پرداخت',
    bankTransfer: 'انتقال بانکی',
    iban: 'IBAN',
    bankName: 'نام بانک',
    accountHolder: 'صاحب حساب',
  },
  notification: {
    title: 'اعلان‌ها',
    sendNotification: 'ارسال اعلان',
    notificationSent: 'اعلان با موفقیت ارسال شد',
    chooseMethod: 'چگونه به {{customerName}} اعلان ارسال شود؟',
    email: 'ایمیل',
    whatsapp: 'واتس‌اپ',
    sms: 'پیامک',
    push: 'اعلان فوری',
    emailSubject: 'تأیید رزرو شما',
    emailBody: 'عزیز {{customerName}}،\n\nرزرو شما برای تاریخ {{date}} ساعت {{time}} تأیید شد.\n\nخدمت: {{service}}\nآرایشگر: {{barber}}\nقیمت: {{price}} ₺\n\nاز انتخاب آرایشگاه Edge & Co سپاسگزاریم!\n\nبا احترام،\nتیم Edge & Co',
    whatsappMessage: '📅 *تأیید رزرو*\n\nعزیز {{customerName}}،\n\n✅ رزرو شما تأیید شد!\n\n📅 تاریخ: {{date}}\n🕐 زمان: {{time}}\n💇 خدمت: {{service}}\n👨 آرایشگر: {{barber}}\n💰 قیمت: {{price}} ₺\n\n📍 مکان: آرایشگاه Edge & Co\n\nاز انتخاب ما سپاسگزاریم!\n\n💳 لینک پرداخت: {{paymentLink}}\n🏦 انتقال بانکی - IBAN: {{iban}}',
  },
  language: {
    title: 'زبان',
    selectLanguage: 'انتخاب زبان',
    english: 'English',
    turkish: 'Türkçe',
    arabic: 'العربية',
    persian: 'فارسی',
    greek: 'Ελληνικά',
    russian: 'Русский',
    languageChanged: 'زبان با موفقیت تغییر یافت',
  },
  business: {
    name: 'آرایشگاه Edge & Co',
    address: 'آدرس شما اینجا',
    phone: 'شماره تلفن شما',
    email: 'ایمیل@شما.com',
    website: 'www.edgeandco.com',
    iban: 'TR00 0000 0000 0000 0000 0000 00',
    bankName: 'نام بانک شما',
    accountHolder: 'آرایشگاه Edge & Co',
  },
};