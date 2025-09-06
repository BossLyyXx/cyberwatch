import React, { useContext } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { Filter, Download } from 'lucide-react';
import { AuditLogContext } from '../App';


const AuditLogs: React.FC = () => {
  const auditLogContext = useContext(AuditLogContext);

  if (!auditLogContext) return null;
  const { auditLogs } = auditLogContext;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Audit Logs</h2>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
           <div className="flex items-center gap-2 flex-grow">
              <input type="date" className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-focus-ring"/>
              <span className="text-gray-500">ถึง</span>
              <input type="date" className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-focus-ring"/>
              <Button variant="ghost" icon={<Filter size={18} />}>ประเภทกิจกรรม</Button>
           </div>
           <Button variant="secondary" icon={<Download size={18} />}>ส่งออกบันทึก</Button>
        </div>
      </Card>
      
      <Card>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-gray-800">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr className="text-sm text-gray-600">
                        <th className="p-4 font-semibold">เวลา</th>
                        <th className="p-4 font-semibold">ผู้ใช้</th>
                        <th className="p-4 font-semibold">กิจกรรม</th>
                        <th className="p-4 font-semibold">รายละเอียด</th>
                        <th className="p-4 font-semibold">ผลลัพธ์</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {auditLogs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-500">
                                ไม่มีบันทึกกิจกรรม
                            </td>
                        </tr>
                    ) : (
                        auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                            <td className="p-4 font-mono text-sm text-gray-600">{log.timestamp}</td>
                            <td className="p-4">{log.user}</td>
                            <td className="p-4 font-semibold">{log.activity}</td>
                            <td className="p-4 text-gray-600">{log.details}</td>
                            <td className="p-4">
                               <Badge color={log.result === 'สำเร็จ' ? 'success' : 'danger'}>{log.result}</Badge>
                            </td>
                        </tr>
                    )))}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};

export default AuditLogs;