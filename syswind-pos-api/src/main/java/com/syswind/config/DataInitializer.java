package com.syswind.config;

import com.syswind.entity.Organization;
import com.syswind.entity.PaymentMethod;
import com.syswind.entity.Permission;
import com.syswind.entity.User;
import com.syswind.repository.OrganizationRepository;
import com.syswind.repository.PaymentMethodRepository;
import com.syswind.repository.PermissionRepository;
import com.syswind.repository.RoleRepository;
import com.syswind.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PermissionRepository permissionRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PaymentMethodRepository paymentMethodRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.syswind.service.RoleService roleService;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed or Verify Core Permissions
        seedPermissions();

        // 2. Seed Default System Roles and link permissions
        seedRoles();

        // 3. Ensure initial single 'sysadmin' account exists
        ensureSysadminExists();

        // 4. Ensure initial Default Organization and its Org Admin exist
        Organization defaultOrg = ensureDefaultOrganizationExists();

        // 5. Ensure initial Myanmar Payment Methods exist
        ensureDefaultPaymentMethods(defaultOrg);
    }

    private void seedPermissions() {
        List<Permission> defaultPerms = List.of(
                // Menus
                new Permission("menu:dashboard", "Dashboard Access", "MENU", "DASHBOARD", "ပင်မ မျက်နှာစာ ကြည့်ရှုခွင့်"),
                new Permission("menu:pos", "POS Cashier Menu", "MENU", "POS", "အရောင်းကောင်တာ စာမျက်နှာ"),
                new Permission("menu:orders", "Orders & Sales Menu", "MENU", "ORDERS", "အော်ဒါနှင့် ရောင်းဝယ်ရေး စာမျက်နှာ"),
                new Permission("menu:inventory", "Inventory & Stock Menu", "MENU", "INVENTORY", "ကုန်ပစ္စည်း စာရင်း စာမျက်နှာ"),
                new Permission("menu:customers", "CRM & Customers Menu", "MENU", "CRM", "ဖောက်သည် စာရင်း စာမျက်နှာ"),
                new Permission("menu:delivery", "Delivery & Logistics Menu", "MENU", "DELIVERY", "ပို့ဆောင်ရေး စီမံခန့်ခွဲမှု"),
                new Permission("menu:finance", "Finance & Ledger Menu", "MENU", "FINANCE", "ဘဏ္ဍာရေးနှင့် စာရင်းကိုင် စာမျက်နှာ"),
                new Permission("menu:settings", "Account & System Settings Menu", "MENU", "SYSTEM", "အဖွဲ့အစည်းနှင့် စနစ် ဆက်တင်များ"),

                // Buttons
                new Permission("product:create", "Add Product Button", "BUTTON", "INVENTORY", "ကုန်ပစ္စည်း အသစ်ထည့်သွင်းခြင်း ခလုတ်"),
                new Permission("product:edit", "Edit Product & Photo Button", "BUTTON", "INVENTORY", "ကုန်ပစ္စည်းနှင့် ဓာတ်ပုံ ပြင်ဆင်ခြင်း ခလုတ်"),
                new Permission("product:delete", "Delete Product Button", "BUTTON", "INVENTORY", "ကုန်ပစ္စည်း ဖျက်သိမ်းခြင်း ခလုတ်"),
                new Permission("stock:adjust", "Adjust Stock Quantity Button", "BUTTON", "INVENTORY", "ပစ္စည်းလက်ကျန် အတိုးအလျှော့ ပြုလုပ်ခြင်း"),
                new Permission("category:manage", "Add/Edit Category Button", "BUTTON", "INVENTORY", "အမျိုးအစား စီမံခြင်း"),
                new Permission("order:create", "Create New Order Button", "BUTTON", "ORDERS", "အော်ဒါ အသစ်ဖွင့်လှစ်ခြင်း ခလုတ်"),
                new Permission("order:edit", "Update Order Status Button", "BUTTON", "ORDERS", "အော်ဒါ အခြေအနေ ပြင်ဆင်ခြင်း"),
                new Permission("order:cancel", "Cancel Order Button", "BUTTON", "ORDERS", "အော်ဒါ ပယ်ဖျက်ခြင်း"),
                new Permission("order:invoice", "Print / Download Invoice Button", "BUTTON", "ORDERS", "ပြေစာ ဘောက်ချာ ထုတ်ယူခြင်း"),
                new Permission("customer:create", "Add Customer Button", "BUTTON", "CRM", "ဖောက်သည် အသစ်ထည့်သွင်းခြင်း"),
                new Permission("customer:edit", "Edit Customer Details Button", "BUTTON", "CRM", "ဖောက်သည် အချက်အလက် ပြင်ဆင်ခြင်း"),
                new Permission("customer:delete", "Delete Customer Button", "BUTTON", "CRM", "ဖောက်သည် ဖျက်သိမ်းခြင်း"),
                new Permission("delivery:assign", "Assign Rider / Provider Button", "BUTTON", "DELIVERY", "ဒယ်လီဗရီ ပို့ဆောင်သူ တာဝန်ပေးခြင်း"),
                new Permission("delivery:update_status", "Update Delivery Status Button", "BUTTON", "DELIVERY", "ပို့ဆောင်မှု အခြေအနေ ပြောင်းလဲခြင်း"),
                new Permission("delivery:reconcile", "Reconcile COD Button", "BUTTON", "DELIVERY", "COD ငွေကောက်ခံမှု ရှင်းတမ်း"),
                new Permission("township:manage", "Add/Edit Township Rates Button", "BUTTON", "DELIVERY", "မြို့နယ် ပို့ဆောင်ခ နှုန်းထား စီမံခြင်း"),
                new Permission("provider:manage", "Add/Edit Delivery Providers Button", "BUTTON", "DELIVERY", "ဒယ်လီဗရီ ကုမ္ပဏီ ဝန်ဆောင်မှု စီမံခြင်း"),
                new Permission("payment:manage", "Add/Edit Payment Methods Button", "BUTTON", "FINANCE", "ငွေပေးချေမှု နည်းလမ်း စီမံခြင်း"),
                new Permission("finance:income_record", "Record Income Button", "BUTTON", "FINANCE", "ဝင်ငွေ မှတ်တမ်းတင်ခြင်း"),
                new Permission("finance:expense_record", "Record Expense Button", "BUTTON", "FINANCE", "ကုန်ကျစရိတ် မှတ်တမ်းတင်ခြင်း"),
                new Permission("org:manage", "Organization Settings Button", "BUTTON", "SYSTEM", "ကုမ္ပဏီ အချက်အလက်နှင့် Logo စီမံခြင်း"),
                new Permission("role:manage", "Roles & Permission Matrix Button", "BUTTON", "SYSTEM", "ရာထူးနှင့် လုပ်ပိုင်ခွင့် စီမံခြင်း"),
                new Permission("user:manage", "Manage Users & Roles Button", "BUTTON", "SYSTEM", "ဝန်ထမ်း အကောင့် စီမံခြင်း")
        );

        for (Permission p : defaultPerms) {
            if (permissionRepository.findByCode(p.getCode()).isEmpty()) {
                permissionRepository.save(p);
            }
        }
    }

    private void seedRoles() {
        // 1. ADMIN (Organization Administrator)
        createOrUpdateSystemRole("ADMIN", "Organization Admin (အဖွဲ့အစည်း စီမံခန့်ခွဲသူ)",
                "Full operational administrator for the organization. Cannot create external organizations.",
                List.of(
                        "menu:dashboard", "menu:pos", "menu:orders", "menu:inventory", "menu:customers",
                        "menu:delivery", "menu:finance", "menu:settings",
                        "product:create", "product:edit", "product:delete", "stock:adjust", "category:manage",
                        "order:create", "order:edit", "order:cancel", "order:invoice",
                        "customer:create", "customer:edit", "customer:delete",
                        "delivery:assign", "delivery:update_status", "delivery:reconcile", "township:manage", "provider:manage",
                        "payment:manage", "finance:income_record", "finance:expense_record",
                        "role:manage", "user:manage", "org:manage"
                )
        );

        // 2. ACCOUNTANT (Finance & Accounting)
        createOrUpdateSystemRole("ACCOUNTANT", "Accountant (စာရင်းကိုင် / ဘဏ္ဍာရေး)",
                "Financial management, ledger entries, payments, and invoices.",
                List.of(
                        "menu:dashboard", "menu:orders", "menu:finance",
                        "order:invoice", "delivery:reconcile",
                        "payment:manage", "finance:income_record", "finance:expense_record"
                )
        );

        // 3. SALES_STAFF (Sales & Inventory)
        createOrUpdateSystemRole("SALES_STAFF", "Sales Staff (အရောင်းနှင့် ကုန်ပစ္စည်း စာရင်း)",
                "POS counter cashier, order handling, customer management, inventory stock viewing.",
                List.of(
                        "menu:pos", "menu:orders", "menu:inventory", "menu:customers",
                        "product:create", "product:edit", "stock:adjust", "category:manage",
                        "order:create", "order:invoice",
                        "customer:create", "customer:edit"
                )
        );

        // 4. DELIVERY_COORDINATOR (Logistics & Delivery)
        createOrUpdateSystemRole("DELIVERY_COORDINATOR", "Delivery Coordinator (ပို့ဆောင်ရေး တာဝန်ခံ)",
                "Logistics, rider dispatches, delivery statuses, and township rates.",
                List.of(
                        "menu:delivery", "menu:orders",
                        "delivery:assign", "delivery:update_status", "delivery:reconcile", "township:manage",
                        "order:invoice"
                )
        );

        // 5. CASHIER (Fast POS Checkout)
        createOrUpdateSystemRole("CASHIER", "Cashier (ငွေကိုင် / အရောင်းကောင်တာ)",
                "Fast retail sales, cashier register, receipts.",
                List.of(
                        "menu:pos", "menu:orders",
                        "order:create", "order:invoice"
                )
        );

        System.out.println(">>> Seeded default system roles: ADMIN, ACCOUNTANT, SALES_STAFF, DELIVERY_COORDINATOR, CASHIER");
    }

    private void createOrUpdateSystemRole(String code, String displayName, String description, List<String> permCodes) {
        Optional<com.syswind.entity.Role> opt = roleRepository.findByNameIgnoreCase(code);
        com.syswind.entity.Role role = opt.orElseGet(com.syswind.entity.Role::new);
        role.setName(code);
        role.setDisplayName(displayName);
        role.setDescription(description);
        role.setIsSystem(true);

        List<Permission> perms = permissionRepository.findByCodeIn(permCodes);
        role.setPermissions(new java.util.HashSet<>(perms));
        roleRepository.save(role);
    }

    private void ensureSysadminExists() {
        Optional<User> existing = userRepository.findByUsernameIgnoreCase("sysadmin");
        if (existing.isEmpty()) {
            User sysadmin = new User();
            sysadmin.setUsername("sysadmin");
            sysadmin.setEmail("sysadmin@syswind.com");
            sysadmin.setPasswordHash(passwordEncoder.encode("admin123"));
            sysadmin.setFullName("Super System Administrator");
            sysadmin.setPhone("09971000000");
            sysadmin.setRole("SYSADMIN");
            sysadmin.setBio("Global Sysadmin with cross-organization privileges.");
            sysadmin.setIsActive(true);
            userRepository.save(sysadmin);
            System.out.println(">>> Initial 'sysadmin' account created with password 'admin123'");
        }
    }

    private Organization ensureDefaultOrganizationExists() {
        Optional<Organization> existing = organizationRepository.findByCode("SYSWIND");
        Organization org;
        if (existing.isEmpty()) {
            org = new Organization();
            org.setName("Syswind Myanmar Retail & Logistics Group");
            org.setCode("SYSWIND");
            org.setPhone("09798881122");
            org.setEmail("info@syswind.com");
            org.setAddress("No. 128, Hledan Main Road, Kamayut Township");
            org.setCity("Yangon");
            org.setStateDivision("Yangon");
            org.setCurrency("MMK");
            org.setIsActive(true);
            org = organizationRepository.save(org);
            System.out.println(">>> Default Organization 'SYSWIND' created.");
        } else {
            org = existing.get();
        }

        // Seed organization's dedicated operational roles
        roleService.seedRolesForOrganization(org);

        // Ensure default Org Admin exists and is linked to the ADMIN role
        Optional<User> existingAdmin = userRepository.findByUsernameIgnoreCase("admin");
        Optional<com.syswind.entity.Role> adminRoleOpt = roleRepository.findByNameIgnoreCaseAndOrganizationId("ADMIN", org.getId());
        if (adminRoleOpt.isEmpty()) {
            adminRoleOpt = roleRepository.findByNameIgnoreCase("ADMIN");
        }
        com.syswind.entity.Role adminRole = adminRoleOpt.orElse(null);

        if (existingAdmin.isEmpty()) {
            User orgAdmin = new User();
            orgAdmin.setUsername("admin");
            orgAdmin.setEmail("admin@syswind.com");
            orgAdmin.setPasswordHash(passwordEncoder.encode("admin123"));
            orgAdmin.setFullName("Syswind Organization Admin");
            orgAdmin.setPhone("09798881122");
            orgAdmin.setRole("ADMIN");
            orgAdmin.setCustomRole(adminRole);
            orgAdmin.setOrganization(org);
            orgAdmin.setBio("Administrator for Syswind Myanmar Retail & Logistics Group");
            orgAdmin.setIsActive(true);
            userRepository.save(orgAdmin);
            System.out.println(">>> Initial Org 'admin' account created with password 'admin123'");
        } else if (existingAdmin.get().getCustomRole() == null && adminRole != null) {
            User orgAdmin = existingAdmin.get();
            orgAdmin.setCustomRole(adminRole);
            userRepository.save(orgAdmin);
        }

        return org;
    }

    private void ensureDefaultPaymentMethods(Organization org) {
        if (paymentMethodRepository.count() == 0) {
            PaymentMethod cod = new PaymentMethod();
            cod.setName("Cash on Delivery (COD)");
            cod.setNameMm("ပစ္စည်းရောက်မှ ငွေချေ (COD)");
            cod.setType("COD");
            cod.setInstruction("ပစ္စည်းပို့ဆောင်သူထံသို့ တိုက်ရိုက်ငွေချေပါ");
            cod.setIsActive(true);
            cod.setSortOrder(1);
            cod.setOrganization(org);
            paymentMethodRepository.save(cod);

            PaymentMethod kpay = new PaymentMethod();
            kpay.setName("KBZPay (Kpay)");
            kpay.setNameMm("ကေဘီဇက်ပေး (KPay)");
            kpay.setType("KBZPAY");
            kpay.setAccountName("Syswind Store");
            kpay.setAccountNumber("09971000000");
            kpay.setInstruction("ငွေလွှဲပြီးပါက screenshot သို့မဟုတ် Transaction နောက်ဆုံး ၄ လုံးပို့ပေးပါ");
            kpay.setIsActive(true);
            kpay.setSortOrder(2);
            kpay.setOrganization(org);
            paymentMethodRepository.save(kpay);

            PaymentMethod wave = new PaymentMethod();
            wave.setName("Wave Money (WavePay)");
            wave.setNameMm("ဝေ့ဗ်မနီ (WavePay)");
            wave.setType("WAVEMONEY");
            wave.setAccountName("Syswind Store");
            wave.setAccountNumber("09971000000");
            wave.setInstruction("ငွေလွှဲပြီးပါက screenshot ပို့ပေးပါ");
            wave.setIsActive(true);
            wave.setSortOrder(3);
            wave.setOrganization(org);
            paymentMethodRepository.save(wave);

            PaymentMethod aya = new PaymentMethod();
            aya.setName("AYA Pay");
            aya.setNameMm("ဧရာပေး (AYA Pay)");
            aya.setType("AYAPAY");
            aya.setAccountName("Syswind Store");
            aya.setAccountNumber("09971000000");
            aya.setIsActive(true);
            aya.setSortOrder(4);
            aya.setOrganization(org);
            paymentMethodRepository.save(aya);

            PaymentMethod cb = new PaymentMethod();
            cb.setName("CB Pay");
            cb.setNameMm("စီဘီပေး (CB Pay)");
            cb.setType("CBPAY");
            cb.setAccountName("Syswind Store");
            cb.setAccountNumber("09971000000");
            cb.setIsActive(true);
            cb.setSortOrder(5);
            cb.setOrganization(org);
            paymentMethodRepository.save(cb);

            System.out.println(">>> Seeded default Myanmar payment methods: COD, KBZPay, WavePay, AYA Pay, CB Pay");
        }
    }
}
