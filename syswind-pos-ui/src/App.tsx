import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { InvoiceModal } from './components/InvoiceModal';
import { DashboardPage } from './pages/DashboardPage';
import { PosOrderPage } from './pages/PosOrderPage';
import { OrdersPage } from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import { CustomersPage } from './pages/CustomersPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { FinancePage } from './pages/FinancePage';
import { AuditPage } from './pages/AuditPage';
import { UsersPage } from './pages/UsersPage';
import { LoginPage } from './pages/LoginPage';
import { User, UserRole, Order } from './types';
import { getStoredUser, removeAuthToken, api } from './api/client';

const roleTabPermissions: Record<string, string[]> = {
  SYSADMIN: ['dashboard', 'pos', 'orders', 'inventory', 'customers', 'delivery', 'finance', 'users', 'audit'],
  ADMIN: ['dashboard', 'pos', 'orders', 'inventory', 'customers', 'delivery', 'finance', 'users', 'audit'],
  ACCOUNTANT: ['dashboard', 'orders', 'customers', 'finance'],
  SALES_STAFF: ['dashboard', 'pos', 'orders', 'inventory', 'customers'],
  DELIVERY_COORDINATOR: ['dashboard', 'orders', 'delivery'],
};

export function App() {
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Enforce Dynamic Role-Based Menu Access
  useEffect(() => {
    if (user) {
      if (user.role === 'SYSADMIN' || user.role === 'ADMIN') return;

      const allowedTabs = roleTabPermissions[user.role] || ['dashboard'];
      const hasDynamicAccess = 
        (user.permissions && Array.isArray(user.permissions) && (
          user.permissions.includes('menu:' + currentTab) || 
          (currentTab === 'users' && user.permissions.includes('menu:settings'))
        )) ||
        allowedTabs.includes(currentTab);

      if (!hasDynamicAccess) {
        setCurrentTab('dashboard');
      }
    }
  }, [user, currentTab]);

  // Poll or fetch low stock alerts
  useEffect(() => {
    if (user) {
      loadInventoryAlertCount();
      const interval = setInterval(loadInventoryAlertCount, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadInventoryAlertCount = async () => {
    try {
      const res = await api.get('/products/alerts');
      setLowStockCount(res.count || 0);
    } catch (err) {
      // ignore if unauthenticated
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setCurrentTab('dashboard');
    setSidebarOpen(false);
  };

  const handleOrderCreated = (order: Order) => {
    setPreviewOrder(order);
    setCurrentTab('orders');
  };

  if (!user) {
    return <LoginPage onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // Titles mapping (concise and elegant to prevent text cramping in navbar)
  const tabTitles: Record<string, { title: string; subtitleMm: string }> = {
    dashboard: { title: 'Operations Dashboard', subtitleMm: 'ပင်မ မျက်နှာစာ' },
    pos: { title: 'Point of Sale (POS)', subtitleMm: 'အရောင်းကောင်တာ' },
    orders: { title: 'Orders & Sales', subtitleMm: 'အော်ဒါနှင့် အရောင်း' },
    inventory: { title: 'Inventory & Stock', subtitleMm: 'ကုန်ပစ္စည်းစာရင်း' },
    customers: { title: 'Customers (CRM)', subtitleMm: 'ဖောက်သည် စီမံခန့်ခွဲမှု' },
    delivery: { title: 'Delivery & Logistics', subtitleMm: 'ဒယ်လီဗရီ ပို့ဆောင်ရေး' },
    finance: { title: 'Finance & Ledger', subtitleMm: 'ငွေစာရင်းနှင့် လယ်ဂျာ' },
    users: { title: 'Settings & User Center', subtitleMm: 'အကောင့်နှင့် လုပ်ငန်း စီမံခန့်ခွဲမှု' },
    audit: { title: 'Security & Audit Logs', subtitleMm: 'လုံခြုံရေး မှတ်တမ်း' },
  };

  const currentInfo = tabTitles[currentTab] || { title: 'Syswind', subtitleMm: 'စီမံခန့်ခွဲမှုစနစ်' };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation (with mobile drawer support) */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        onLogout={handleLogout}
        lowStockCount={lowStockCount}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          title={currentInfo.title}
          subtitleMm={currentInfo.subtitleMm}
          user={user}
          lowStockCount={lowStockCount}
          onOpenInventoryAlerts={() => setCurrentTab('inventory')}
          onSwitchToPos={() => setCurrentTab('pos')}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          onOpenUserCenter={() => setCurrentTab('users')}
        />

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab) => setCurrentTab(tab)}
              onViewInvoice={(ord) => setPreviewOrder(ord)}
            />
          )}

          {currentTab === 'pos' && (
            <PosOrderPage onOrderCreated={handleOrderCreated} />
          )}

          {currentTab === 'orders' && (
            <OrdersPage onViewInvoice={(ord) => setPreviewOrder(ord)} />
          )}

          {currentTab === 'inventory' && (
            <InventoryPage />
          )}

          {currentTab === 'customers' && (
            <CustomersPage />
          )}

          {currentTab === 'delivery' && (
            <DeliveryPage />
          )}

          {currentTab === 'finance' && (
            <FinancePage />
          )}

          {currentTab === 'users' && (
            <UsersPage 
              currentUser={user} 
              onUserUpdated={(updated) => setUser(updated)} 
            />
          )}

          {currentTab === 'audit' && (
            <UsersPage 
              currentUser={user} 
              onUserUpdated={(updated) => setUser(updated)} 
            />
          )}
        </main>
      </div>

      {/* Printable Invoice Modal */}
      {previewOrder && (
        <InvoiceModal
          order={previewOrder}
          onClose={() => setPreviewOrder(null)}
        />
      )}
    </div>
  );
}

export default App;
