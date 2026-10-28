-- ====================================================================
-- Syswind V2: Seed Granular Menu and Button Permissions
-- ====================================================================

INSERT INTO permissions (code, name, type, module, description) VALUES
-- Menus
('menu:dashboard', 'Dashboard Access', 'MENU', 'DASHBOARD', 'ပင်မ မျက်နှာစာ ကြည့်ရှုခွင့်'),
('menu:pos', 'POS Cashier Menu', 'MENU', 'POS', 'အရောင်းကောင်တာ စာမျက်နှာ'),
('menu:orders', 'Orders & Sales Menu', 'MENU', 'ORDERS', 'အော်ဒါနှင့် ရောင်းဝယ်ရေး စာမျက်နှာ'),
('menu:inventory', 'Inventory & Stock Menu', 'MENU', 'INVENTORY', 'ကုန်ပစ္စည်း စာရင်း စာမျက်နှာ'),
('menu:customers', 'CRM & Customers Menu', 'MENU', 'CRM', 'ဖောက်သည် စာရင်း စာမျက်နှာ'),
('menu:delivery', 'Delivery & Logistics Menu', 'MENU', 'DELIVERY', 'ပို့ဆောင်ရေး စီမံခန့်ခွဲမှု'),
('menu:finance', 'Finance & Ledger Menu', 'MENU', 'FINANCE', 'ဘဏ္ဍာရေးနှင့် စာရင်းကိုင် စာမျက်နှာ'),
('menu:settings', 'Account & System Settings Menu', 'MENU', 'SYSTEM', 'အဖွဲ့အစည်းနှင့် စနစ် ဆက်တင်များ'),

-- Buttons & Operations: Inventory
('product:create', 'Add Product Button', 'BUTTON', 'INVENTORY', 'ကုန်ပစ္စည်း အသစ်ထည့်သွင်းခြင်း ခလုတ်'),
('product:edit', 'Edit Product & Photo Button', 'BUTTON', 'INVENTORY', 'ကုန်ပစ္စည်းနှင့် ဓာတ်ပုံ ပြင်ဆင်ခြင်း ခလုတ်'),
('product:delete', 'Delete Product Button', 'BUTTON', 'INVENTORY', 'ကုန်ပစ္စည်း ဖျက်သိမ်းခြင်း ခလုတ်'),
('stock:adjust', 'Adjust Stock Quantity Button', 'BUTTON', 'INVENTORY', 'ပစ္စည်းလက်ကျန် အတိုးအလျှော့ ပြုလုပ်ခြင်း'),
('category:manage', 'Add/Edit Category Button', 'BUTTON', 'INVENTORY', 'အမျိုးအစား စီမံခြင်း'),

-- Buttons & Operations: Orders
('order:create', 'Create New Order Button', 'BUTTON', 'ORDERS', 'အော်ဒါ အသစ်ဖွင့်လှစ်ခြင်း ခလုတ်'),
('order:edit', 'Update Order Status Button', 'BUTTON', 'ORDERS', 'အော်ဒါ အခြေအနေ ပြင်ဆင်ခြင်း'),
('order:cancel', 'Cancel Order Button', 'BUTTON', 'ORDERS', 'အော်ဒါ ပယ်ဖျက်ခြင်း'),
('order:invoice', 'Print / Download Invoice Button', 'BUTTON', 'ORDERS', 'ပြေစာ ဘောက်ချာ ထုတ်ယူခြင်း'),

-- Buttons & Operations: CRM
('customer:create', 'Add Customer Button', 'BUTTON', 'CRM', 'ဖောက်သည် အသစ်ထည့်သွင်းခြင်း'),
('customer:edit', 'Edit Customer Details Button', 'BUTTON', 'CRM', 'ဖောက်သည် အချက်အလက် ပြင်ဆင်ခြင်း'),
('customer:delete', 'Delete Customer Button', 'BUTTON', 'CRM', 'ဖောက်သည် ဖျက်သိမ်းခြင်း'),

-- Buttons & Operations: Delivery
('delivery:assign', 'Assign Rider / Provider Button', 'BUTTON', 'DELIVERY', 'ဒယ်လီဗရီ ပို့ဆောင်သူ တာဝန်ပေးခြင်း'),
('delivery:update_status', 'Update Delivery Status Button', 'BUTTON', 'DELIVERY', 'ပို့ဆောင်မှု အခြေအနေ ပြောင်းလဲခြင်း'),
('delivery:reconcile', 'Reconcile COD Button', 'BUTTON', 'DELIVERY', 'COD ငွေကောက်ခံမှု ရှင်းတမ်း'),
('township:manage', 'Add/Edit Township Rates Button', 'BUTTON', 'DELIVERY', 'မြို့နယ် ပို့ဆောင်ခ နှုန်းထား စီမံခြင်း'),
('provider:manage', 'Add/Edit Delivery Providers Button', 'BUTTON', 'DELIVERY', 'ဒယ်လီဗရီ ကုမ္ပဏီ ဝန်ဆောင်မှု စီမံခြင်း'),

-- Buttons & Operations: Finance
('payment:manage', 'Add/Edit Payment Methods Button', 'BUTTON', 'FINANCE', 'ငွေပေးချေမှု နည်းလမ်း စီမံခြင်း'),
('finance:income_record', 'Record Income Button', 'BUTTON', 'FINANCE', 'ဝင်ငွေ မှတ်တမ်းတင်ခြင်း'),
('finance:expense_record', 'Record Expense Button', 'BUTTON', 'FINANCE', 'ကုန်ကျစရိတ် မှတ်တမ်းတင်ခြင်း'),

-- Buttons & Operations: System / RBAC
('org:manage', 'Organization Settings Button', 'BUTTON', 'SYSTEM', 'ကုမ္ပဏီ အချက်အလက်နှင့် Logo စီမံခြင်း'),
('role:manage', 'Roles & Permission Matrix Button', 'BUTTON', 'SYSTEM', 'ရာထူးနှင့် လုပ်ပိုင်ခွင့် စီမံခြင်း'),
('user:manage', 'Manage Users & Roles Button', 'BUTTON', 'SYSTEM', 'ဝန်ထမ်း အကောင့် စီမံခြင်း')
ON CONFLICT (code) DO NOTHING;
