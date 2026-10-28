import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  PackageOpen, 
  Boxes, 
  Users, 
  Truck, 
  Wallet, 
  ShieldCheck, 
  LogOut, 
  Wind,
  X
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
  lowStockCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  user,
  onLogout,
  lowStockCount,
  isOpen,
  onClose,
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      labelMm: 'ပင်မ မျက်နှာစာ',
      icon: LayoutDashboard,
      permCode: 'menu:dashboard',
      roles: ['ADMIN', 'ACCOUNTANT', 'SALES_STAFF', 'DELIVERY_COORDINATOR'],
    },
    {
      id: 'pos',
      label: 'POS & Cashier',
      labelMm: 'အရောင်းကောင်တာ',
      icon: ShoppingCart,
      permCode: 'menu:pos',
      roles: ['ADMIN', 'SALES_STAFF'],
      badge: 'Fast',
    },
    {
      id: 'orders',
      label: 'Orders & Sales',
      labelMm: 'အော်ဒါနှင့် အရောင်း',
      icon: PackageOpen,
      permCode: 'menu:orders',
      roles: ['ADMIN', 'ACCOUNTANT', 'SALES_STAFF', 'DELIVERY_COORDINATOR'],
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      labelMm: 'ကုန်ပစ္စည်း စာရင်း',
      icon: Boxes,
      permCode: 'menu:inventory',
      roles: ['ADMIN', 'SALES_STAFF'],
      alertCount: lowStockCount,
    },
    {
      id: 'customers',
      label: 'Customers CRM',
      labelMm: 'ဖောက်သည် စီမံခန့်ခွဲမှု',
      icon: Users,
      permCode: 'menu:customers',
      roles: ['ADMIN', 'SALES_STAFF', 'ACCOUNTANT'],
    },
    {
      id: 'delivery',
      label: 'Delivery & Logistics',
      labelMm: 'ဒယ်လီဗရီ ပို့ဆောင်ရေး',
      icon: Truck,
      permCode: 'menu:delivery',
      roles: ['ADMIN', 'DELIVERY_COORDINATOR', 'SALES_STAFF', 'ACCOUNTANT'],
    },
    {
      id: 'finance',
      label: 'Finance & Ledger',
      labelMm: 'ငွေစာရင်းနှင့် လယ်ဂျာ',
      icon: Wallet,
      permCode: 'menu:finance',
      roles: ['ADMIN', 'ACCOUNTANT'],
    },
    {
      id: 'users',
      label: 'Settings & Users',
      labelMm: 'အကောင့်နှင့် လုပ်ပိုင်ခွင့်များ',
      icon: ShieldCheck,
      permCode: 'menu:settings',
      roles: ['ADMIN'],
    },
  ];

  const filteredItems = menuItems.filter(item => {
    if (!user) return false;
    // Super sysadmin has full access to all menus
    if (user.role === 'SYSADMIN') return true;
    // Organization admin has access to all operational menus
    if (user.role === 'ADMIN') return true;
    // For custom or staff roles, strictly check if the menu permission is assigned!
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(item.permCode);
    }
    return false;
  });

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 w-60 xl:w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full select-none transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 shrink-0">
              <Wind className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-brand-400 bg-clip-text text-transparent">
                  SYSWIND
                </span>
                <span className="text-[10px] bg-brand-500/20 text-brand-400 font-semibold px-1.5 py-0.5 rounded border border-brand-500/30">
                  MM
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Online Shop Management</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-2.5 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-md shadow-brand-600/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-400'}`} />
                  <div className="text-left min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-semibold leading-snug truncate">{item.label}</div>
                    <div className={`text-[10px] sm:text-[11px] leading-snug truncate ${isActive ? 'text-brand-100 font-medium' : 'text-slate-400'}`}>
                      {item.labelMm}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {item.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-400/20 text-brand-300 border border-brand-400/30">
                      {item.badge}
                    </span>
                  )}

                  {item.alertCount && item.alertCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                      {item.alertCount}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Info & Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          {user && (
            <div className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/50 flex items-center justify-between mb-2 transition-all">
              <div 
                onClick={() => handleSelectTab('users')}
                className="flex items-center space-x-2.5 min-w-0 overflow-hidden cursor-pointer flex-1"
                title="Go to User Center & Account Settings"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300 text-xs shrink-0 overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
                  )}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-200 truncate hover:text-brand-300 transition-colors">{user.full_name}</p>
                  <span className="inline-block text-[10px] font-semibold text-brand-400 uppercase tracking-wider truncate">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors shrink-0 ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 py-1">
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>MMK Operations</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
