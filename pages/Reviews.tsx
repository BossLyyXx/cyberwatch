import React, { useContext } from 'react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { ToastContext, ReviewContext, AuditLogContext } from '../App';

const Reviews: React.FC = () => {
  const toastContext = useContext(ToastContext);
  const reviewContext = useContext(ReviewContext);
  const auditLogContext = useContext(AuditLogContext);

  if (!reviewContext) return null;

  const { reviewItems, removeReviewItem } = reviewContext;

  const handleReview = (reviewId: string, matchName: string, isConfirmed: boolean) => {
    removeReviewItem(reviewId);
    const action = isConfirmed ? 'Confirmed' : 'Rejected';
    auditLogContext?.logActivity(`Review ${action}`, `${action} review for ${matchName} (ID: ${reviewId})`);

    if (isConfirmed) {
        toastContext?.showToast(`ยืนยันผลการแมตช์สำหรับ ${matchName} แล้ว`, 'success');
    } else {
        toastContext?.showToast(`ปฏิเสธผลการแมตช์สำหรับ ${matchName} แล้ว`, 'info');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">คิวรีวิวผลการแมตช์</h2>

      {reviewItems.length === 0 ? (
        <Card className="p-10 text-center text-gray-500">
          ยังไม่มีรายการรอรีวิว
        </Card>
      ) : (
        <div className="space-y-4">
          {reviewItems.map(item => (
            <Card key={item.id} className="p-5 text-gray-900">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Event Frame */}
                    <div>
                        <p className="font-semibold text-sm text-gray-600 mb-2">ภาพจากเหตุการณ์</p>
                        <img src={item.imageUrl} className="rounded-lg w-full" alt="Event capture" />
                        <p className="text-xs text-gray-500 mt-2">{item.camera} - {item.timestamp}</p>
                    </div>

                    {/* Top-K Matches */}
                    <div className="md:col-span-2 space-y-3">
                         <p className="font-semibold text-sm text-gray-600 mb-1">ผลการจับคู่ที่เข้าข่าย</p>
                         {item.matches.map(match => (
                             <div key={match.watchlistItem.id} className="flex items-center gap-4 p-3 bg-brand-50 rounded-lg border border-brand-300/50">
                                 <img src={match.watchlistItem.imageUrl} alt={match.watchlistItem.name} className="w-16 h-16 rounded-md object-cover" />
                                 <div className="flex-grow">
                                     <p className="font-bold">{match.watchlistItem.name} <span className="font-normal text-gray-500">({match.watchlistItem.alias})</span></p>
                                     <p className="text-sm">ค่าความเชื่อมั่น: <span className="font-bold text-brand-600">{match.confidence.toFixed(1)}%</span></p>
                                 </div>
                                 <div className="flex flex-col gap-2">
                                     <Button variant="secondary" size="sm" onClick={() => handleReview(item.id, match.watchlistItem.name, true)}>ยืนยัน</Button>
                                     <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-200" onClick={() => handleReview(item.id, match.watchlistItem.name, false)}>ปฏิเสธ</Button>
                                 </div>
                             </div>
                         ))}
                    </div>
                </div>
                 <div className="mt-4 pt-4 border-t border-gray-200">
                    <textarea placeholder="บังคับกรอกเหตุผลสั้น ๆ..." className="w-full rounded-md border-gray-300 shadow-sm focus:border-brand-500 focus:ring-brand-500 text-sm" rows={2}></textarea>
                 </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;