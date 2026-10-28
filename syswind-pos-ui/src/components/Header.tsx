import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  MapPin, 
  Clock, 
  Menu,
  X,
  Plus
} from 'lucide-react';
import { User, Township } from '../types';
import { api, formatMMK } from '../api/client';

interface HeaderProps {
  title: string;
  subtitleMm: string;
  user: User | null;
  lowStockCount: number;
  onOpenInventoryAlerts: () => void;
  onSwitchToPos: () => void;
  onToggleSidebar: () => void;
  onOpenUserCenter?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitleMm,
  user,
  lowStockCount,
  onOpenInventoryAlerts,
  onSwitchToPos,
  onToggleSidebar,
  onOpenUserCenter,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [showTownshipModal, setShowTownshipModal] = useState(false);
  const [townships, setTownships] = useState<Township[]>([]);
  const [townshipSearch, setTownshipSearch] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const openTownshipModal = async () => {
    setShowTownshipModal(true);
    try {
      const res = await api.get('/deliveries/townships');
      setTownships(res.townships || []);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTownships = townships.filter(t => 
    t.name_en.toLowerCase().includes(townshipSearch.toLowerCase()) ||
    t.name_mm.includes(townshipSearch) ||
    t.city.toLowerCase().includes(townshipSearch.toLowerCase())
  );

  return (
    <>
      <header className="h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 select-none gap-3 sm:gap-4 md:gap-6">
        {/* Left: Mobile Menu Toggle + Title */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0 flex-1">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-tight truncate leading-tight">
                {title}
              </h1>
              {subtitleMm && (
                <span className="hidden md:inline-flex items-center text-[11px] font-medium text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-500/20 shrink-0 whitespace-nowrap">
                  {subtitleMm}
                </span>
              )}
            </div>
            {subtitleMm && (
              <p className="text-[11px] text-slate-400 md:hidden truncate mt-0.5 leading-normal">
                {subtitleMm}
              </p>
            )}
          </div>
        </div>

        {/* Right: Action Widgets */}
        <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 shrink-0">
          {/* Organization Indicator */}
          {user?.organization && (
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-brand-400"></span>
              <span className="font-semibold text-slate-200 truncate max-w-[140px]">{user.organization.name}</span>
            </div>
          )}

          {/* Real-time Clock */}
          <div className="hidden xl:flex items-center space-x-1.5 text-xs text-slate-300 font-mono bg-slate-800/70 px-2.5 py-1.5 rounded-xl border border-slate-700/50 shrink-0 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>{currentTime}</span>
            <span className="text-[10px] text-slate-400 font-sans">MMT</span>
          </div>

          {/* Quick Delivery Fee Rate Check */}
          <button
            onClick={openTownshipModal}
            className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-700/70 hover:border-slate-600 transition-all shrink-0 whitespace-nowrap"
            title="Check delivery rates by township"
          >
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline">Delivery Rates</span>
            <span className="sm:hidden text-[11px]">Rates</span>
          </button>

          {/* Quick POS Trigger */}
          {user && ['ADMIN', 'SALES_STAFF'].includes(user.role) && (
            <button
              onClick={onSwitchToPos}
              className="flex items-center space-x-1.5 text-xs font-bold text-white bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 px-3 py-1.5 rounded-xl shadow-md shadow-brand-500/20 transition-all shrink-0 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">New Sale</span>
              <span className="sm:hidden">POS</span>
            </button>
          )}

          {/* Low Stock Notifications */}
          <button
            onClick={onOpenInventoryAlerts}
            className="relative p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-700 transition-all shrink-0"
            title={`${lowStockCount} items low on stock`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            {lowStockCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center rounded-full animate-pulse shadow-sm">
                {lowStockCount}
              </span>
            )}
          </button>

          {/* User Center Avatar Button */}
          {user && onOpenUserCenter && (
            <button
              onClick={onOpenUserCenter}
              className="flex items-center space-x-2 p-1 pl-1.5 pr-2.5 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70 rounded-xl transition-all"
              title="Open User Center & Account Settings"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-600/30 border border-brand-500/40 flex items-center justify-center font-bold text-white text-xs overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span className="hidden md:inline text-xs font-semibold text-slate-200 truncate max-w-[100px]">
                {user.full_name?.split(' ')[0]}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Township Rates Modal */}
      {showTownshipModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Myanmar Townships Delivery Rates</h3>
                  <p className="text-xs text-slate-400">မြို့နယ်အလိုက် ပို့ဆောင်ခနှင့် ပို့ဆောင်ကြာချိန်</p>
                </div>
              </div>
              <button
                onClick={() => setShowTownshipModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search township (Kamayut, Sanchaung, မန္တလေး, ပဲခူး)..."
                  value={townshipSearch}
                  onChange={(e) => setTownshipSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-4 space-y-2 flex-1">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <th className="py-2">Township</th>
                    <th className="py-2 hidden sm:table-cell">Region</th>
                    <th className="py-2 text-right">Standard Fee</th>
                    <th className="py-2 text-center">COD</th>
                    <th className="py-2 text-right">Est. Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTownships.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 text-slate-300">
                      <td className="py-2.5 font-medium text-white">
                        <div>{t.name_en}</div>
                        <div className="text-xs text-slate-400">{t.name_mm}</div>
                      </td>
                      <td className="py-2.5 text-xs text-slate-400 hidden sm:table-cell">{t.state_division} ({t.city})</td>
                      <td className="py-2.5 text-right font-mono font-semibold text-emerald-400">
                        {formatMMK(t.standard_delivery_fee)}
                      </td>
                      <td className="py-2.5 text-center">
                        {t.is_cod_available ? (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-medium">
                            COD OK
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            Prepaid
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right text-xs text-slate-400">{t.estimated_days}d</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <a
                href="/delivery"
                onClick={() => setShowTownshipModal(false)}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline flex items-center gap-1"
              >
                Go to Delivery Hub to Add/Edit Rates →
              </a>
              <button
                onClick={() => setShowTownshipModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
