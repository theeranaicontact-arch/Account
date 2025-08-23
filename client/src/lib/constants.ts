export const TRANSACTION_TYPES = {
  // Income types
  REG: { 
    nameEn: 'Regular Income', 
    nameTh: 'รายได้ประจำ (เงินเดือน, ค่าจ้าง, โบนัส)', 
    isIncome: true,
    taxable: true,
    color: 'green'
  },
  SID: { 
    nameEn: 'Side Income', 
    nameTh: 'รายได้เสริม / งานพิเศษ', 
    isIncome: true,
    taxable: true,
    color: 'green'
  },
  INV: { 
    nameEn: 'Investment Income', 
    nameTh: 'รายได้จากการลงทุน (หุ้น, ดอกเบี้ย, ปันผล)', 
    isIncome: true,
    taxable: true,
    color: 'blue'
  },
  OIC: { 
    nameEn: 'Other Income', 
    nameTh: 'รายได้อื่น ๆ (ของขวัญ, ขายทรัพย์สิน)', 
    isIncome: true,
    taxable: true,
    color: 'purple'
  },
  TEX: { 
    nameEn: 'Tax-Exempt Income', 
    nameTh: 'รายได้ที่ได้รับการยกเว้นภาษี', 
    isIncome: true,
    taxable: false,
    color: 'gray'
  },
  
  // Expense types
  ESS: { 
    nameEn: 'Essential', 
    nameTh: 'ค่าใช้จ่ายจำเป็น (อาหาร, ที่พัก, ค่าน้ำไฟ)', 
    isIncome: false,
    taxable: false,
    color: 'red'
  },
  DIS: { 
    nameEn: 'Discretionary', 
    nameTh: 'ค่าใช้จ่ายไม่จำเป็น (ช้อปปิ้ง, ท่องเที่ยว)', 
    isIncome: false,
    taxable: false,
    color: 'orange'
  },
  DEB: { 
    nameEn: 'Debt', 
    nameTh: 'ชำระหนี้ / สินเชื่อ', 
    isIncome: false,
    taxable: false,
    color: 'red'
  },
  SAV: { 
    nameEn: 'Savings / Investment', 
    nameTh: 'การออมเงิน / การลงทุน', 
    isIncome: false,
    taxable: false,
    color: 'blue'
  },
  OEX: { 
    nameEn: 'Other Expense', 
    nameTh: 'รายจ่ายอื่น ๆ (ของขวัญ, บริจาค, ค่าปรับ)', 
    isIncome: false,
    taxable: false,
    color: 'gray'
  },
} as const;

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(num).replace('THB', '฿');
};
