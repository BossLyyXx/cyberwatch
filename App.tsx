
import React, { useState, createContext, useContext, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './pages/Dashboard';
import LiveScan from './pages/LiveScan';
import Watchlist from './pages/Watchlist';
import Reviews from './pages/Reviews';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';
import Legal from './pages/Legal';
import Login from './pages/Login';
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react';
import type { ReviewItem, AuditLog, WatchlistItem } from './types';
import { WatchlistStatus } from './types';

export type Page = 'Dashboard' | 'Live Scan' | 'Watchlist' | 'Reviews' | 'Audit Logs' | 'Settings' | 'Legal';
type ToastType = 'success' | 'error' | 'info' | 'warning';
type ToastMessage = { id: number; message: string; type: ToastType };
type ToastContextType = { showToast: (message: string, type?: ToastType) => void; };

type ReviewContextType = {
  reviewItems: ReviewItem[];
  addReviewItem: (item: ReviewItem) => void;
  removeReviewItem: (id: string) => void;
};
type AuditLogContextType = {
  logActivity: (activity: string, details: string, result?: 'สำเร็จ' | 'ล้มเหลว') => void;
  auditLogs: AuditLog[];
};
type WatchlistContextType = {
  watchlistItems: WatchlistItem[];
  addWatchlistItem: (item: WatchlistItem) => void;
  removeWatchlistItem: (id: string) => void;
};


export const ToastContext = createContext<ToastContextType | null>(null);
export const ReviewContext = createContext<ReviewContextType | null>(null);
export const AuditLogContext = createContext<AuditLogContextType | null>(null);
export const WatchlistContext = createContext<WatchlistContextType | null>(null);

const Toast: React.FC<{ message: string; type: ToastType; onClose: () => void; }> = ({ message, type, onClose }) => {
    const icons = {
        success: <CheckCircle className="text-success" />,
        error: <XCircle className="text-danger" />,
        info: <Info className="text-info" />,
        warning: <AlertTriangle className="text-warning" />,
    };
    const bgColor = {
        success: 'bg-green-50 border-green-200',
        error: 'bg-red-50 border-red-200',
        info: 'bg-blue-50 border-blue-200',
        warning: 'bg-yellow-50 border-yellow-200',
    }

    return (
        <div className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg animate-fade-in-right ${bgColor[type]}`}>
            {icons[type]}
            <p className="flex-grow font-semibold text-gray-800">{message}</p>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={18} /></button>
        </div>
    );
};


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activePage, setActivePage] = useState<Page>('Legal');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [initialWatchlistModalOpen, setInitialWatchlistModalOpen] = useState(false);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const showToast = (message: string, type: ToastType = 'success') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addReviewItem = (item: ReviewItem) => {
    setReviewItems(prev => [item, ...prev]);
  };
  const removeReviewItem = (id: string) => {
    setReviewItems(prev => prev.filter(item => item.id !== id));
  };

  const addWatchlistItem = (item: WatchlistItem) => {
    setWatchlistItems(prev => [item, ...prev]);
  };
  const removeWatchlistItem = (id: string) => {
    setWatchlistItems(prev => prev.filter(item => item.id !== id));
  };


  const logActivity = (activity: string, details: string, result: 'สำเร็จ' | 'ล้มเหลว' = 'สำเร็จ') => {
      const newLog: AuditLog = {
          id: `L${Date.now()}`,
          timestamp: new Date().toLocaleString('sv-SE'),
          user: 'admin',
          activity,
          details,
          result,
      };
      setAuditLogs(prev => [newLog, ...prev]);
  };


  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard setActivePage={setActivePage} openWatchlistModal={() => {
            setInitialWatchlistModalOpen(true);
            setActivePage('Watchlist');
        }} />;
      case 'Live Scan':
        return <LiveScan />;
      case 'Watchlist':
        return <Watchlist isModalInitiallyOpen={initialWatchlistModalOpen} onModalClose={() => setInitialWatchlistModalOpen(false)} />;
      case 'Reviews':
        return <Reviews />;
      case 'Audit Logs':
        return <AuditLogs />;
      case 'Settings':
        return <Settings />;
      case 'Legal':
        return <Legal setActivePage={setActivePage} />;
      default:
        return <Dashboard setActivePage={setActivePage} openWatchlistModal={() => {}} />;
    }
  };

  if (!isAuthenticated) {
    return (
        <ToastContext.Provider value={{ showToast }}>
             <Login onLoginSuccess={() => setIsAuthenticated(true)} />
              <div className="fixed top-5 right-5 z-[100] space-y-2">
              {toasts.map(toast => (
              <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
              ))}
            </div>
        </ToastContext.Provider>
    )
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      <AuditLogContext.Provider value={{ logActivity, auditLogs }}>
        <ReviewContext.Provider value={{ reviewItems, addReviewItem, removeReviewItem }}>
          <WatchlistContext.Provider value={{ watchlistItems, addWatchlistItem, removeWatchlistItem }}>
            <div className="flex h-screen bg-brand-50 font-sans text-gray-800">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Topbar setActivePage={setActivePage} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 relative">
                <div className="absolute inset-0 bg-grid-pattern opacity-60"></div>
                <div className="relative z-10 p-6">
                        {renderPage()}
                </div>
                </main>
            </div>
            <div className="fixed top-5 right-5 z-[100] space-y-2">
                {toasts.map(toast => (
                <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
                ))}
          </div>
          <style>{`
            @keyframes fade-in-right {
                from { opacity: 0; transform: translateX(20px); }
                to { opacity: 1; transform: translateX(0); }
            }
            .animate-fade-in-right {
                animation: fade-in-right 0.3s ease-out forwards;
            }
             @keyframes fade-in-up {
                  from { opacity: 0; transform: translateY(-10px); }
                  to { opacity: 1; transform: translateY(0); }
              }
              .animate-fade-in-up {
                  animation: fade-in-up 0.2s ease-out forwards;
              }
          `}</style>
            </div>
          </WatchlistContext.Provider>
        </ReviewContext.Provider>
      </AuditLogContext.Provider>
    </ToastContext.Provider>
  );
};

export default App;
