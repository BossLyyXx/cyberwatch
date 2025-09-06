import React, { useState, useContext } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { ToastContext, ReviewContext, AuditLogContext } from '../App';
import { Check, X, User, FileText, ShieldQuestion } from 'lucide-react';
import type { ReviewItem } from '../types';

// Type for the rejection modal state
type RejectionState = {
  isOpen: boolean;
  item: ReviewItem | null;
  reason: string;
};

const Reviews: React.FC = () => {
  const toastContext = useContext(ToastContext);
  const reviewContext = useContext(ReviewContext);
  const auditLogContext = useContext(AuditLogContext);

  const [rejectionState, setRejectionState] = useState<RejectionState>({
    isOpen: false,
    item: null,
    reason: '',
  });

  if (!reviewContext) return null;

  const { reviewItems, removeReviewItem } = reviewContext;

  // --- Handlers ---

  const handleConfirm = (item: ReviewItem) => {
    const matchName = item.matches[0]?.watchlistItem.name || 'Unknown';
    removeReviewItem(item.id);
    auditLogContext?.logActivity('Review Confirmed', `Confirmed match for ${matchName} (ID: ${item.id})`);
    toastContext?.showToast(`ยืนยันผลการแมตช์สำหรับ ${matchName} แล้ว`, 'success');
  };

  const handleRejectRequest = (item: ReviewItem) => {
    setRejectionState({ isOpen: true, item, reason: '' });
  };
  
  const closeRejectionModal = () => {
    setRejectionState({ isOpen: false, item: null, reason: '' });
  }

  const handleSubmitRejection = () => {
    if (!rejectionState.item) return;

    if (rejectionState.reason.trim() === '') {
      toastContext?.showToast('กรุณากรอกเหตุผลในการปฏิเสธ', 'warning');
      return;
    }

    const matchName = rejectionState.item.matches[0]?.watchlistItem.name || 'Unknown';
    
    removeReviewItem(rejectionState.item.id);
    auditLogContext?.logActivity(
      'Review Rejected', 
      `Rejected match for ${matchName} (ID: ${rejectionState.item.id}). Reason: ${rejectionState.reason}`
    );
    toastContext?.showToast(`ปฏิเสธผลการแมตช์สำหรับ ${matchName} แล้ว`, 'info');
    
    closeRejectionModal();
  };


  // --- Main Render ---

  return (
    <>
      <div className="max-w-5xl mx-auto">
        <style>{`
          @keyframes fade-in-up { 
            from { opacity: 0; transform: translateY(10px); } 
            to { opacity: 1; transform: translateY(0); } 
          }
          .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
        `}</style>
        
        <div className="text-left mb-6">
            <h2 className="text-3xl font-bold text-gray-900">คิวรีวิวผลการแมตช์</h2>
            <p className="text-gray-600 mt-1">มี <span className="font-bold text-brand-600">{reviewItems.length}</span> รายการที่ต้องตรวจสอบ</p>
        </div>

        {reviewItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 p-10 bg-white rounded-2xl border">
              <Check size={48} className="text-green-500 mb-4"/>
              <h2 className="text-2xl font-bold text-gray-800">คิวรีวิวว่าง</h2>
              <p className="mt-2">ไม่มีรายการที่ต้องตรวจสอบในขณะนี้ ยอดเยี่ยม!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviewItems.map((item, index) => {
              const topMatch = item.matches[0];
              if (!topMatch) return null;

              return (
                <Card key={item.id} className="p-4 animate-fade-in-up" style={{ animationDelay: `${index * 50}ms`}}>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Event Image */}
                    <div className="col-span-12 sm:col-span-3">
                       <img src={item.imageUrl} className="rounded-md w-full aspect-square object-cover" alt="Event capture" />
                       <p className="text-xs text-gray-500 mt-1 text-center truncate">{item.camera} - {item.timestamp}</p>
                    </div>

                    {/* Match Info */}
                    <div className="col-span-12 sm:col-span-6">
                      <div className="flex items-center gap-4">
                        <img src={topMatch.watchlistItem.imageUrl} alt={topMatch.watchlistItem.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
                        <div>
                           <p className="font-bold text-lg text-gray-900">{topMatch.watchlistItem.name}</p>
                           <p className="text-sm text-gray-500">{topMatch.watchlistItem.alias}</p>
                           <p className="font-bold text-brand-600 mt-1">{topMatch.confidence.toFixed(1)}% Confidence</p>
                        </div>
                      </div>
                      <div className="mt-3 text-left bg-gray-50 p-2 rounded-md border text-xs space-y-1">
                          <div><User className="inline-block mr-1.5 h-4 w-4 text-gray-400"/><strong>สถานะ: </strong><Badge>{topMatch.watchlistItem.status}</Badge></div>
                          <div><FileText className="inline-block mr-1.5 h-4 w-4 text-gray-400"/><strong>ข้อหา: </strong><span>{topMatch.watchlistItem.charges.join(', ')}</span></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-12 sm:col-span-3 flex sm:flex-col justify-center gap-2">
                      <Button variant="danger" size="sm" onClick={() => handleRejectRequest(item)}>
                          <X size={16} className="mr-1"/> ปฏิเสธ
                      </Button>
                      <Button size="sm" className="bg-success hover:bg-green-600" onClick={() => handleConfirm(item)}>
                         <Check size={16} className="mr-1"/> ยืนยัน
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={closeRejectionModal}>
          <Card className="w-full max-w-lg animate-scale-in p-0" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 bg-danger/10 text-danger p-2 rounded-full"><ShieldQuestion size={24}/></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">ยืนยันการปฏิเสธ</h3>
                  <p className="text-sm text-gray-500">กรุณาระบุเหตุผลสำหรับการปฏิเสธผลการจับคู่</p>
                </div>
              </div>
              <div className="mt-4">
                  <label htmlFor="rejection-reason" className="text-sm font-semibold text-gray-800">เหตุผล (บังคับ)</label>
                  <textarea 
                      id="rejection-reason"
                      value={rejectionState.reason}
                      onChange={(e) => setRejectionState(s => ({ ...s, reason: e.target.value }))}
                      placeholder="เช่น ใบหน้าไม่ตรงกัน, คุณภาพของภาพต่ำเกินไป..." 
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm mt-2" 
                      rows={4}
                  ></textarea>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                <Button variant="danger" onClick={handleSubmitRejection}>ส่งเหตุผลและปฏิเสธ</Button>
                <Button variant="secondary" onClick={closeRejectionModal}>ยกเลิก</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default Reviews;