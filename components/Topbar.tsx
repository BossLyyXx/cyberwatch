import React, { useState, useContext, useRef, useEffect } from 'react';
import { Search, Bell, User, UserCheck } from 'lucide-react';
import { ReviewContext, type Page } from '../App';
import Card from './Card';
import Button from './Button';

interface TopbarProps {
  setActivePage: (page: Page) => void;
}

const Topbar: React.FC<TopbarProps> = ({ setActivePage }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const reviewContext = useContext(ReviewContext);
  const notificationCount = reviewContext?.reviewItems.length ?? 0;
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [panelRef]);

  const handleNotificationClick = () => {
    setActivePage('Reviews');
    setIsPanelOpen(false);
  }

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex-shrink-0 flex items-center justify-between px-6">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหา..."
          className="w-full bg-gray-100 border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-focus-ring"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative" ref={panelRef}>
          <button 
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="relative text-gray-600 hover:text-brand-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring rounded-full p-2"
          >
            <Bell className="h-6 w-6" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-white text-xs font-bold">
                {notificationCount}
              </span>
            )}
          </button>
          {isPanelOpen && (
            <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 z-50">
              <Card className="shadow-2xl animate-fade-in-up text-gray-800">
                <div className="p-4 border-b border-gray-200">
                  <h4 className="font-bold text-lg">การแจ้งเตือน</h4>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notificationCount > 0 ? (
                    reviewContext?.reviewItems.map(item => (
                      <div key={item.id} onClick={handleNotificationClick} className="flex items-start gap-4 p-4 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0">
                        <div className="bg-brand-500/10 text-brand-600 p-2 rounded-full mt-1">
                          <UserCheck size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">มีแมตช์ใหม่รอรีวิว</p>
                          <p className="text-sm text-gray-600">
                            '
                            {item.matches[0]?.watchlistItem.name || 'Unknown'}'
                            ต้องการการตรวจสอบ
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="p-8 text-center text-gray-500">ไม่มีการแจ้งเตือนใหม่</p>
                  )}
                </div>
                {notificationCount > 0 && (
                    <div className="p-2 border-t border-gray-200">
                        <Button variant="ghost" className="w-full" onClick={handleNotificationClick}>
                            ดูทั้งหมด
                        </Button>
                    </div>
                )}
              </Card>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-full flex items-center justify-center border-2 border-brand-300">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="text-right hidden sm:block">
            <p className="font-semibold text-gray-800">ผู้ดูแลระบบ</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;