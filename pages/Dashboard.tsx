import React, { useContext } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import KpiCard from '../components/KpiCard';
import Button from '../components/Button';
import Card from '../components/Card';
import { Camera, UserCheck, ShieldAlert, Percent, PlusCircle, Video } from 'lucide-react';
import { ReviewContext, AuditLogContext } from '../App';

interface DashboardProps {
    setActivePage: (page: 'Live Scan' | 'Watchlist') => void;
    openWatchlistModal: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActivePage, openWatchlistModal }) => {
  const reviewContext = useContext(ReviewContext);
  const auditLogContext = useContext(AuditLogContext);

  // --- Dynamic Data Calculation ---

  // KPI: Pending Reviews
  const pendingReviews = reviewContext?.reviewItems.length ?? 0;

  // KPI: Average Confidence
  const avgConfidence = (() => {
    if (!reviewContext || reviewContext.reviewItems.length === 0) return 'N/A';
    const allMatches = reviewContext.reviewItems.flatMap(item => item.matches);
    if (allMatches.length === 0) return 'N/A';
    const totalConfidence = allMatches.reduce((sum, match) => sum + match.confidence, 0);
    return `${(totalConfidence / allMatches.length).toFixed(1)}%`;
  })();

  // KPI: False Positives (last 24h) & Chart Data
  const { falsePositives, chartData } = (() => {
    if (!auditLogContext) {
      const defaultChartData = Array.from({ length: 7 }, (_, i) => ({
        name: i === 6 ? 'เมื่อวาน' : `${7 - i} วันก่อน`,
        matches: 0,
      }));
      return { falsePositives: 0, chartData: defaultChartData };
    }
    
    const { auditLogs } = auditLogContext;
    
    // False positives calculation
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    const fp = auditLogs.filter(log => 
        log.activity === 'Review Rejected' && new Date(log.timestamp).getTime() > twentyFourHoursAgo
    ).length;

    // Chart data generation
    const matchLogs = auditLogs.filter(
        log => log.activity === 'Live Scan Match' || log.activity === 'Sent to Review'
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const data = [];
    for (let i = 7; i >= 1; i--) {
        const dayStart = new Date(today);
        dayStart.setDate(today.getDate() - i);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const matchesOnDay = matchLogs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= dayStart && logDate <= dayEnd;
        }).length;
        
        let name = `${i} วันก่อน`;
        if (i === 1) name = 'เมื่อวาน';
        
        data.push({ name, matches: matchesOnDay });
    }
    
    return { falsePositives: fp, chartData: data };
  })();


  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon={<Camera size={24}/>} title="กล้องออนไลน์" value="1 / 1" />
        <KpiCard icon={<UserCheck size={24}/>} title="การแมตช์รอรีวิว" value={String(pendingReviews)} />
        <KpiCard icon={<ShieldAlert size={24}/>} title="False Positive (24 ชม.)" value={String(falsePositives)} />
        <KpiCard icon={<Percent size={24}/>} title="ความเชื่อมั่นเฉลี่ย" value={avgConfidence} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Match History Chart */}
        <div className="lg:col-span-2">
            <Card className="p-5 h-[400px]">
                 <h3 className="text-lg font-semibold text-gray-900 mb-4">จำนวนการแมตช์ย้อนหลัง 7 วัน</h3>
                 <ResponsiveContainer width="100%" height="90%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(203, 213, 225, 0.5)" />
                        <XAxis dataKey="name" stroke="#334155" fontSize={12} />
                        <YAxis stroke="#334155" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                borderColor: '#A7C5FF',
                                color: '#0F172A'
                            }}
                        />
                        <Legend wrapperStyle={{fontSize: "14px"}} />
                        <Line type="monotone" dataKey="matches" name="การแมตช์" stroke="#1F6FEB" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
            <Card className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="flex flex-col gap-3">
                    <Button icon={<PlusCircle size={18}/>} onClick={openWatchlistModal}>เพิ่มบุคคลเฝ้าระวัง</Button>
                    <Button variant="secondary" icon={<Video size={18}/>} onClick={() => setActivePage('Live Scan')}>เปิด Live Scan</Button>
                </div>
            </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;