import React, { useState, useContext } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { Info, ChevronDown } from 'lucide-react';
import { ToastContext, AuditLogContext } from '../App';

const Settings: React.FC = () => {
  const [threshold, setThreshold] = useState(90);
  const [retention, setRetention] = useState('30');
  const toastContext = useContext(ToastContext);
  const auditLogContext = useContext(AuditLogContext);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toastContext?.showToast('บันทึกการเปลี่ยนแปลงสำเร็จแล้ว', 'success');
    auditLogContext?.logActivity(
        'Settings Updated', 
        `Threshold set to ${threshold}%, Retention policy set to ${retention} days.`
    );
  };

  return (
    <form className="space-y-6 max-w-4xl mx-auto" onSubmit={handleSave}>
      <h2 className="text-3xl font-bold text-gray-900">Settings</h2>

      <Card className="p-6 text-gray-900">
        <h3 className="text-xl font-bold border-b border-gray-200 pb-3 mb-6">การตั้งค่าระบบ</h3>
        <div className="space-y-8">
            <div>
                <label htmlFor="threshold-range" className="font-semibold flex items-center gap-2 text-gray-800">
                    ค่าความเชื่อมั่น Threshold
                    <span className="has-tooltip">
                        <Info size={16} className="text-gray-500 cursor-pointer"/>
                        <span className="tooltip rounded shadow-lg p-2 bg-gray-900 text-white text-xs -mt-10">
                            ค่าความเชื่อมั่นขั้นต่ำในการแจ้งเตือน
                        </span>
                    </span>
                </label>
                <div className="flex items-center gap-4 mt-2">
                    <input 
                        id="threshold-range"
                        type="range" 
                        min="50" 
                        max="100" 
                        value={threshold}
                        onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600" />
                    <span className="font-bold text-brand-800 w-20 text-center bg-gray-100 py-1 rounded-md">{threshold}%</span>
                </div>
            </div>
             <div>
                <label htmlFor="retention" className="font-semibold text-gray-800">นโยบายการลบอัตโนมัติ (Retention)</label>
                <div className="relative mt-2 max-w-xs">
                    <select 
                        id="retention" 
                        value={retention}
                        onChange={(e) => setRetention(e.target.value)}
                        className="appearance-none w-full bg-gray-700 border border-gray-600 text-white font-semibold rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-focus-ring"
                    >
                        <option value="7">7 วัน</option>
                        <option value="30">30 วัน</option>
                        <option value="90">90 วัน</option>
                        <option value="0">ไม่ลบอัตโนมัติ</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
                        <ChevronDown size={20} />
                    </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">ข้อมูลการแมตช์และบันทึกที่เก่ากว่าที่กำหนดจะถูกลบ</p>
            </div>
        </div>
      </Card>
      
      <Card className="p-6 text-gray-900">
        <h3 className="text-xl font-bold border-b border-gray-200 pb-3 mb-4">การจัดการผู้ใช้</h3>
        <p className="text-gray-600">จัดการบทบาทและสิทธิ์การเข้าถึงของผู้ใช้ในระบบ</p>
         <Button type="button" variant="secondary" className="mt-4" onClick={() => toastContext?.showToast('หน้านี้ยังไม่พร้อมใช้งาน', 'info')}>จัดการสิทธิ์ผู้ใช้</Button>
      </Card>
      
      <div className="pt-4 flex justify-end">
          <Button type="submit">บันทึกการเปลี่ยนแปลง</Button>
      </div>

       <style>{`
          .has-tooltip {
            position: relative;
          }
          .tooltip {
            visibility: hidden;
            position: absolute;
            width: max-content;
            z-index: 100;
            left: 50%;
            transform: translateX(-50%);
          }
          .has-tooltip:hover .tooltip {
            visibility: visible;
          }
      `}</style>
    </form>
  );
};

export default Settings;