import React, { useState, useContext } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { AuditLogContext } from '../App';

interface LegalProps {
    setActivePage: (page: 'Dashboard') => void;
}

const Legal: React.FC<LegalProps> = ({ setActivePage }) => {
    const [agreed, setAgreed] = useState(false);
    const auditLogContext = useContext(AuditLogContext);

    const handleLogin = () => {
        auditLogContext?.logActivity('เข้าสู่ระบบ', 'ผู้ใช้ยอมรับข้อตกลงและเข้าสู่ระบบสำเร็จ', 'สำเร็จ');
        setActivePage('Dashboard');
    }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900">ข้อตกลงและเงื่อนไขการใช้งาน</h2>
      
      <Card className="p-6 text-gray-900">
        <div className="prose max-w-none text-gray-800">
          <h3 className="text-xl font-bold">นโยบายการใช้งานระบบ CYBERWATCH (เวอร์ชันสาธิต)</h3>
          <p>
            ระบบ CYBERWATCH นี้เป็นซอฟต์แวร์ที่จัดทำขึ้นเพื่อ<strong>การสาธิต (Demonstration)</strong> ความสามารถทางเทคโนโลยีเท่านั้น ไม่ได้มีวัตถุประสงค์เพื่อการใช้งานจริงในการระบุตัวตน ชี้ตัว หรือเฝ้าระวังบุคคลในพื้นที่สาธารณะหรือพื้นที่ส่วนบุคคล
          </p>
          <h4>ข้อควรปฏิบัติ:</h4>
          <ul>
            <li><strong>การได้รับความยินยอม:</strong> ผู้ใช้งานต้องได้รับความยินยอมอย่างชัดแจ้งเป็นลายลักษณ์อักษรจากบุคคลทุกคนที่อาจถูกบันทึกภาพโดยระบบก่อนเริ่มการใช้งานทุกครั้ง</li>
            <li><strong>ขอบเขตการใช้งาน:</strong> ห้ามนำระบบนี้ไปใช้ในทางที่ละเมิดสิทธิส่วนบุคคล, ก่อให้เกิดความเสียหาย, หรือขัดต่อกฎหมายและศีลธรรมอันดี</li>
            <li><strong>ข้อมูล:</strong> ข้อมูลภาพและผลลัพธ์ที่ได้จากระบบนี้ถือเป็นข้อมูลสมมติ และห้ามนำไปใช้อ้างอิงหรือตัดสินใจในการดำเนินการใดๆ ที่มีผลกระทบต่อบุคคลจริง</li>
          </ul>
           <div className="bg-danger/10 border-l-4 border-danger text-red-800 p-4 mt-4 rounded-r-lg">
                <p className="font-bold">คำเตือน: การนำระบบไปใช้งานนอกเหนือขอบเขตการสาธิตโดยไม่ได้รับความยินยอมถือเป็นการละเมิดและอาจมีความผิดตามกฎหมาย</p>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
            <label className="flex items-center gap-3 cursor-pointer">
                <input 
                    type="checkbox" 
                    className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    checked={agreed}
                    onChange={() => setAgreed(!agreed)}
                />
                <span className="font-semibold text-gray-800">ข้าพเจ้ารับทราบและยินยอมปฏิบัติตามข้อตกลงและเงื่อนไขการใช้งานข้างต้นทั้งหมด</span>
            </label>
        </div>

        <div className="mt-6 flex justify-end">
            <Button disabled={!agreed} onClick={handleLogin}>
                เข้าสู่ระบบ
            </Button>
        </div>
      </Card>
    </div>
  );
};

export default Legal;