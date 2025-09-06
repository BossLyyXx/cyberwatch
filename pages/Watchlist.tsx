import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import ConfirmationModal from "../components/ConfirmationModal";
import api, { WatchlistItemOut, WatchlistSyncIn } from "../api";
import { WatchlistStatus } from "../types";
import {
  Users,
  Upload,
  Link as LinkIcon,
  RefreshCw,
  Send,
  Trash2,
  AlertTriangle,
  CheckCircle,
  UploadCloud,
  File as FileIcon,
  X,
  Image as ImageIcon,
  PlusCircle,
  Search,
  ChevronDown,
} from "lucide-react";

// --- Helper Functions ---
const fileToDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const formatBytes = (bytes: number, decimals = 2) => {
  if (typeof bytes !== 'number' || !isFinite(bytes) || bytes < 0) return 'N/A';
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// --- Type Definitions ---
type NewPersonForm = {
  id: string;
  name: string;
  imageUrls: string;
  files: File[];
  status: WatchlistStatus;
  charges: string;
};

type ModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  variant: 'primary' | 'danger';
};

type ActiveModal = 'add' | 'sync' | null;

// --- Main Component ---
const Watchlist: React.FC = () => {
  // Data & Loading States
  const [pending, setPending] = useState<WatchlistSyncIn[]>([]);
  const [serverList, setServerList] = useState<WatchlistItemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // UI States
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [replaceMode, setReplaceMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);


  // Form State
  const [form, setForm] = useState<NewPersonForm>({
    id: "",
    name: "",
    imageUrls: "",
    files: [],
    status: WatchlistStatus.Suspect,
    charges: "",
  });

  // Confirmation Modal State
  const [confirmModalState, setConfirmModalState] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'primary',
  });
  
  // --- Effects ---
  useEffect(() => {
    refreshServerList();
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Memoized Values ---
  const filteredServerList = useMemo(() => {
    if (!searchTerm) return serverList;
    return serverList.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [serverList, searchTerm]);

  const totalPendingImages = useMemo(() =>
    pending.reduce((sum, p) => sum + (p.image_urls?.length ?? 0) + (p.image_base64?.length ?? 0), 0),
    [pending]
  );

  // --- API & State Logic Functions ---
  const closeModal = () => setActiveModal(null);
  
  async function refreshServerList() {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getWatchlist();
      setServerList(list);
    } catch (e: any) {
      setError(e?.message || "โหลดรายชื่อจากเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  async function addPendingFromForm(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.id.trim() || !form.name.trim()) {
      setError("กรุณากรอก ID และ ชื่อ");
      return;
    }

    try {
      const urls = form.imageUrls.split(",").map(s => s.trim()).filter(Boolean);
      const base64s: string[] = await Promise.all(form.files.map(fileToDataURL));
      const chargesList = form.charges.split(",").map(c => c.trim()).filter(Boolean);
      
      const entry: WatchlistSyncIn = {
        id: form.id.trim(),
        name: form.name.trim(),
        image_urls: urls.length ? urls : undefined,
        image_base64: base64s.length ? base64s : undefined,
        meta: { status: form.status, charges: chargesList },
      };

      if (!entry.image_urls && !entry.image_base64) {
        setError("ต้องใส่อย่างน้อย 1 รูป (URL หรือ อัปโหลดไฟล์)");
        return;
      }

      setPending(prev => [...prev.filter(p => p.id !== entry.id), entry]);
      setForm({ id: "", name: "", imageUrls: "", files: [], status: WatchlistStatus.Suspect, charges: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setOkMsg(`เพิ่ม "${entry.name}" ลงในรายการรอซิงก์สำเร็จ`);
      closeModal();
    } catch (err: any) {
      setError(err?.message || "เพิ่มรายการไม่สำเร็จ");
    }
  }

  function removePending(id: string) {
    setPending(prev => prev.filter(p => p.id !== id));
  }

  async function syncToServer() {
    if (pending.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.syncWatchlist(pending, replaceMode);
      setOkMsg(`ซิงก์สำเร็จ: เพิ่ม/อัปเดต ${res.added} คน (รวม ${res.total} คน)${res.failed?.length ? `, ล้มเหลว ${res.failed.length}` : ""}`);
      setPending([]);
      closeModal();
      await refreshServerList();
    } catch (e: any) {
      setError(e?.message || "ซิงก์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const executeDelete = async (id: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.deletePerson(id);
      setOkMsg(`ลบ '${name}' ออกจากเซิร์ฟเวอร์แล้ว`);
      await refreshServerList();
    } catch (e: any) {
      setError(e?.message || `ลบ '${name}' ไม่สำเร็จ`);
    } finally {
      setLoading(false);
    }
  }
  
  const handleDeleteRequest = (id: string, name: string) => {
    setConfirmModalState({
      isOpen: true,
      title: `ยืนยันการลบ`,
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ '${name}' ออกจากเซิร์ฟเวอร์อย่างถาวร?`,
      onConfirm: () => executeDelete(id, name),
      variant: 'danger',
    });
  }

  const executeClearServer = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.syncWatchlist([], true);
      setOkMsg("ล้างรายชื่อบนเซิร์ฟเวอร์แล้ว");
      await refreshServerList();
    } catch (e: any) {
      setError(e?.message || "ล้างรายชื่อบนเซิร์ฟเวอร์ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  const handleClearServerRequest = () => {
    setConfirmModalState({
      isOpen: true,
      title: 'ยืนยันการล้างข้อมูลเซิร์ฟเวอร์',
      message: 'คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดบนเซิร์ฟเวอร์? การกระทำนี้ไม่สามารถย้อนกลับได้',
      onConfirm: executeClearServer,
      variant: 'danger',
    });
  }

  // --- Form File Handlers ---
  const handleFileChange = (files: FileList | null) => { if (files) setForm(f => ({ ...f, files: [...f.files, ...Array.from(files)] }))};
  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); };
  const removeFile = (indexToRemove: number) => { setForm(f => ({ ...f, files: f.files.filter((_, index) => index !== indexToRemove) })); if (fileInputRef.current) fileInputRef.current.value = ""; };

  // --- Main Render ---
  const inputStyle = "w-full bg-transparent border-0 border-b-2 border-slate-300 px-1 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0 focus:border-brand-500 transition-colors";

  return (
    <>
      <div className="bg-slate-50 p-4 sm:p-6 lg:p-8 min-h-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">จัดการรายชื่อเฝ้าระวัง</h1>
            <p className="text-sm text-slate-500 mt-1">
              เพิ่ม แก้ไข และซิงก์ข้อมูลบุคคลในรายชื่อเฝ้าระวังไปยังเซิร์ฟเวอร์
            </p>
          </div>
        </div>

        {error && <Card className="p-4 mb-4 bg-red-50 border border-red-200 flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-500"/><p className="text-sm font-medium text-red-800">{error}</p></Card>}
        {okMsg && <Card className="p-4 mb-4 bg-green-50 border border-green-200 flex items-center gap-3"><CheckCircle className="h-5 w-5 text-green-500"/><p className="text-sm font-medium text-green-800">{okMsg}</p></Card>}

        <Card className="shadow-sm">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                      type="text"
                      placeholder="ค้นหาด้วยชื่อ หรือ ID..."
                      className="w-full bg-slate-100 border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={refreshServerList} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""}/><span>รีเฟรช</span></Button>
                  <Button onClick={() => setActiveModal('add')}><PlusCircle size={16}/><span>เพิ่มรายชื่อ</span></Button>
              </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ชื่อ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">รายละเอียด</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"># รูป</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading && <tr><td colSpan={4} className="p-8 text-center text-slate-500">กำลังโหลดข้อมูล...</td></tr>}
                {!loading && filteredServerList.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-500">{searchTerm ? "ไม่พบผลลัพธ์ที่ตรงกัน" : "(ไม่มีข้อมูลบนเซิร์ฟเวอร์)"}</td></tr>}
                {!loading && filteredServerList.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {s.first_image_base64 ? (
                          <img src={s.first_image_base64} alt={s.name} className="w-10 h-10 rounded-full object-cover border border-slate-200"/>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><ImageIcon size={20} /></div>
                        )}
                        <div>
                          <div className="font-medium text-slate-800">{s.name}</div>
                          <div className="font-mono text-xs text-slate-500">{s.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {s.meta?.status && <Badge>{s.meta.status}</Badge>}
                        <div className="text-xs mt-1 truncate max-w-xs" title={s.meta?.charges?.join(', ')}>{s.meta?.charges?.join(', ') || '–'}</div>
                    </td>
                    <td className="px-4 py-3 text-center">{s.images}</td>
                    <td className="px-4 py-3">
                      <Button variant="danger-ghost" size="sm" onClick={() => handleDeleteRequest(s.id, s.name)} disabled={loading}>
                          <Trash2 size={14} className="mr-1"/> ลบ
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Sync Bar */}
      {pending.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40">
           <div className="bg-white/80 backdrop-blur-sm shadow-[0_-2px_10px_rgba(0,0,0,0.1)] p-4 flex items-center justify-center gap-4 animate-fade-in-up">
              <p className="font-semibold text-slate-800">{pending.length} รายการรอการซิงก์</p>
              <Button onClick={() => setActiveModal('sync')}><Send size={16}/><span>ตรวจสอบและซิงก์</span></Button>
           </div>
           <style>{`@keyframes fade-in-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } } .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }`}</style>
        </div>
      )}

      {/* Add Person Modal */}
      {activeModal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
            <Card className="w-full max-w-2xl animate-scale-in p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                  <h3 className="text-xl font-bold text-gray-900">เพิ่มรายชื่อใหม่</h3>
                  <p className="text-sm text-slate-500 mt-1">กรอกข้อมูลและเพิ่มรูปภาพเพื่อสร้างรายการเฝ้าระวังใหม่</p>
                </div>
                <form onSubmit={addPendingFromForm}>
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">ID *</label>
                                    <input required className={inputStyle} value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="เช่น p001" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">ชื่อ *</label>
                                    <input required className={inputStyle} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น สมชาย ใจดี" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">สถานะ</label>
                                    <div className="relative" ref={statusDropdownRef}>
                                        <button type="button" onClick={() => setIsStatusDropdownOpen(prev => !prev)} className={`${inputStyle} flex items-center justify-between text-left`}>
                                            <span>{form.status}</span>
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`}/>
                                        </button>
                                        {isStatusDropdownOpen && (
                                            <div className="absolute top-full mt-1 w-full z-10 bg-white rounded-md shadow-lg border border-slate-200 animate-fade-in-sm">
                                                {Object.values(WatchlistStatus).map(s => 
                                                    <button type="button" key={s} className="w-full text-left px-3 py-2 hover:bg-slate-100" onClick={() => { setForm(f => ({ ...f, status: s })); setIsStatusDropdownOpen(false); }}>
                                                        {s}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">ข้อหา (คั่นด้วยลูกน้ำ)</label>
                                    <input className={inputStyle} value={form.charges} onChange={e => setForm(f => ({ ...f, charges: e.target.value }))} placeholder="เช่น ลักทรัพย์, ฉ้อโกง" />
                                </div>
                            </div>
                            <div className="border-t border-slate-200 pt-6 flex flex-col gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-2"><LinkIcon size={16} /> Image URLs (ทางเลือก)</label>
                                    <input className={`${inputStyle} border-slate-200`} value={form.imageUrls} onChange={e => setForm(f => ({ ...f, imageUrls: e.target.value }))} placeholder="https://..." />
                                </div>
                                <div className="flex flex-col flex-grow">
                                    <label className="text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-2"><Upload size={16} /> อัปโหลดรูปภาพ</label>
                                    <label htmlFor="file-upload" className={`flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-dashed  ${isDragging ? 'border-brand-500 bg-brand-50' : 'border-slate-300 bg-slate-50'}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                                        <div className="p-6 text-center cursor-pointer"><UploadCloud className="w-10 h-10 mx-auto mb-2 text-slate-400" /><p className="text-sm text-slate-500"><span className="font-semibold text-brand-600">คลิกเพื่อเลือกไฟล์</span> หรือลากมาวาง</p></div>
                                        <input id="file-upload" ref={fileInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={e => handleFileChange(e.target.files)} />
                                    </label>
                                </div>
                                {form.files.length > 0 && (
                                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                        {form.files.map((file, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 text-sm rounded-md bg-slate-100 border border-slate-200">
                                                <div className="flex items-center gap-3 overflow-hidden"><FileIcon className="w-4 h-4 text-slate-500 shrink-0" /><span className="font-medium text-slate-800 truncate">{file.name}</span><span className="text-slate-500 shrink-0">({formatBytes(file.size)})</span></div>
                                                <button type="button" onClick={() => removeFile(index)} className="ml-2 p-1 rounded-full hover:bg-red-100"><X className="w-4 h-4 text-red-500" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                        <Button type="submit" variant="primary">เพิ่มลงรายการรอซิงก์</Button>
                        <Button type="button" variant="secondary" onClick={closeModal}>ยกเลิก</Button>
                    </div>
                </form>
            </Card>
        </div>
      )}

      {/* Sync Modal */}
      {activeModal === 'sync' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={closeModal}>
          <Card className="w-full max-w-3xl animate-scale-in p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">ตรวจสอบและซิงก์ข้อมูล</h3>
              <Button size="sm" variant="danger-ghost" onClick={() => setPending([])}>ล้างรายการรอซิงก์ทั้งหมด</Button>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full w-full text-sm">
                        <thead className="bg-slate-50"><tr>
                            <th className="p-3 text-left text-xs font-semibold text-slate-600">ID</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-600">ชื่อ</th>
                            <th className="p-3 text-center text-xs font-semibold text-slate-600">#รูป</th>
                            <th className="p-3 text-left text-xs font-semibold text-slate-600">รายละเอียด</th>
                            <th className="p-3"></th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-200">
                        {pending.map(p => (
                            <tr key={p.id}>
                                <td className="p-3 font-mono">{p.id}</td>
                                <td className="p-3 font-medium">{p.name}</td>
                                <td className="p-3 text-center">{(p.image_urls?.length ?? 0) + (p.image_base64?.length ?? 0)}</td>
                                <td className="p-3 text-xs text-slate-600 max-w-xs truncate">{JSON.stringify(p.meta)}</td>
                                <td className="p-3 text-right"><Button size="sm" variant="danger-ghost" onClick={() => removePending(p.id)}>ลบ</Button></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse items-center gap-4">
              <Button variant="primary" onClick={syncToServer} disabled={loading}><Send size={16}/>{loading ? "กำลังซิงก์..." : `ยืนยันการซิงก์ ${pending.length} รายการ`}</Button>
              <Button variant="secondary" onClick={closeModal}>ยกเลิก</Button>
              <div className="flex-grow flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-700">โหมดเขียนทับ</label>
                   <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={replaceMode} onChange={e => setReplaceMode(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-600"></div>
                  </label>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Confirmation Modal for Deletes */}
      <ConfirmationModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({...prev, isOpen: false}))}
        onConfirm={confirmModalState.onConfirm}
        title={confirmModalState.title}
        variant={confirmModalState.variant}
      >
        {confirmModalState.message}
      </ConfirmationModal>

       <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scale-in { 
          from { opacity: 0; transform: scale(0.95) translateY(10px); } 
          to { opacity: 1; transform: scale(1) translateY(0); } 
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
        .animate-fade-in-sm { animation: scale-in 0.15s ease-out forwards; }
      `}</style>
    </>
  );
};

export default Watchlist;