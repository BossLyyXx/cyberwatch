import React from 'react';
import { ShieldCheck, Target, Video, Users, FileCheck, FileClock, Settings, Gavel } from 'lucide-react';

type Page = 'Dashboard' | 'Live Scan' | 'Watchlist' | 'Reviews' | 'Audit Logs' | 'Settings' | 'Legal';

interface SidebarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const navItems = [
  { name: 'Dashboard', icon: Target },
  { name: 'Live Scan', icon: Video },
  { name: 'Watchlist', icon: Users },
  { name: 'Reviews', icon: FileCheck },
  { name: 'Audit Logs', icon: FileClock },
  { name: 'Settings', icon: Settings },
  { name: 'Legal', icon: Gavel },
];

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  return (
    <aside className="w-64 bg-white p-4 flex flex-col border-r border-gray-200">
      <div className="flex items-center gap-3 mb-10 px-2">
        <ShieldCheck className="text-brand-600 h-8 w-8" />
        <h1 className="text-2xl font-bold text-brand-800">CYBERWATCH</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.name;
          return (
            <button
              key={item.name}
              onClick={() => setActivePage(item.name as Page)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring ${
                isActive
                  ? 'bg-brand-500/10 text-brand-600 font-bold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="">{item.name}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto text-center text-xs text-gray-400">
        <p>เวอร์ชัน 1.0.0</p>
        <p>&copy; 2024 CYBERWATCH Demo</p>
      </div>
    </aside>
  );
};

export default Sidebar;