import React, { useEffect, useRef, useState, useContext } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import Badge from "../components/Badge";
import api, { MatchItem, MatchResponse } from "../api";
import { ReviewContext, AuditLogContext, ToastContext } from "../App";
import type { ReviewItem } from "../types";
import { WatchlistStatus } from "../types";
import { Video, Camera, Upload, Play, StopCircle, RefreshCw, Gauge, Timer } from "lucide-react";

type CamState = "off" | "starting" | "on";
const DEFAULT_INTERVAL_MS = 900;
const DEFAULT_COOLDOWN_MS = 15000; // 15 วินาที

const LiveScan: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const reviewContext = useContext(ReviewContext);
  const auditLogContext = useContext(AuditLogContext);
  const toastContext = useContext(ToastContext);

  const [recentlySubmitted, setRecentlySubmitted] = useState<Record<string, number>>({});
  const [camState, setCamState] = useState<CamState>("off");
  const [scanInterval, setScanInterval] = useState<number>(DEFAULT_INTERVAL_MS);
  const [cooldownMs, setCooldownMs] = useState<number>(DEFAULT_COOLDOWN_MS);
  const [threshold, setThreshold] = useState<number>(0.5);
  const [isAutoScan, setIsAutoScan] = useState(false);
  const [busy, setBusy] = useState(false);

  const [results, setResults] = useState<MatchItem[]>([]);
  const [faces, setFaces] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAutoScan) return;
    const id = setInterval(() => {
      scanOnce().catch(() => {});
    }, Math.max(300, scanInterval));
    return () => clearInterval(id);
  }, [isAutoScan, scanInterval, threshold, recentlySubmitted, cooldownMs]);

  useEffect(() => {
    if (camState !== "on") clearCanvas();
  }, [camState]);

  function clearCanvas() {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
  }

  async function startCamera() {
    if (camState !== "off") return;
    try {
      setError(null);
      setCamState("starting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      const v = videoRef.current;
      if (!v) return;
      v.srcObject = stream;
      await v.play();
      resizeCanvasToVideo();
      setCamState("on");
    } catch (e: any) {
      setCamState("off");
      setError(e?.message || "เปิดกล้องไม่สำเร็จ (อาจไม่ได้อนุญาต)");
    }
  }

  function stopCamera() {
    setIsAutoScan(false);
    setResults([]);
    setFaces(0);
    clearCanvas();
    setError(null);
    setRecentlySubmitted({});
    setCamState("off");
    const v = videoRef.current;
    if (v?.srcObject) {
      (v.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      v.srcObject = null;
    }
  }

  function resizeCanvasToVideo() {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    if (v.videoWidth > 0 && v.videoHeight > 0) {
      c.width = v.videoWidth;
      c.height = v.videoHeight;
    }
  }

  function captureToDataURL(): string | null {
    const v = videoRef.current;
    if (!v || !v.videoWidth || !v.videoHeight) return null;
    const off = document.createElement("canvas");
    off.width = v.videoWidth;
    off.height = v.videoHeight;
    const ctx = off.getContext("2d")!;
    ctx.drawImage(v, 0, 0, off.width, off.height);
    return off.toDataURL("image/jpeg", 0.9);
  }

  function drawResults(items: MatchItem[]) {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2;

    for (const r of items) {
      const { top, right, bottom, left } = r.box;
      const x = left;
      const y = top;
      const w = right - left;
      const h = bottom - top;

      ctx.strokeStyle = r.matched ? "#22c55e" : "#ef4444";
      ctx.strokeRect(x, y, w, h);

      const label = r.matched
        ? `${r.name} (${r.distance.toFixed(2)})`
        : `unknown (${r.distance.toFixed(2)})`;

      ctx.font = "14px sans-serif";
      const padX = 6,
        padY = 4;
      const textWidth = ctx.measureText(label).width;
      const boxW = textWidth + padX * 2;
      const boxH = 20;
      ctx.fillStyle = r.matched ? "rgba(34,197,94,0.9)" : "rgba(239,68,68,0.9)";
      ctx.fillRect(x, Math.max(0, y - boxH), boxW, boxH);
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + padX, Math.max(12, y - 6));
    }
  }

  async function scanOnce(): Promise<MatchResponse | null> {
    if (busy || camState !== "on" || !reviewContext || !auditLogContext) return null;

    const dataUrl = captureToDataURL();
    if (!dataUrl) {
      setError("กล้องยังไม่พร้อม หรือยังไม่มีเฟรมภาพ");
      return null;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.matchBase64(dataUrl, threshold);
      setResults(res.results);
      setFaces(res.faces);
      drawResults(res.results);

      const matchedResults = res.results.filter(r => r.matched && r.id);

      if (matchedResults.length > 0) {
        const currentTime = Date.now();
        
        const newDetections = matchedResults.filter(match => {
          const lastSubmissionTime = recentlySubmitted[match.id!];
          if (!lastSubmissionTime) return true;
          return (currentTime - lastSubmissionTime) > cooldownMs;
        });

        if (newDetections.length > 0) {
          const newReviewItem: ReviewItem = {
            id: `REV${currentTime}`,
            timestamp: new Date(currentTime).toLocaleString('sv-SE'),
            camera: 'Live Scan Camera 1',
            imageUrl: dataUrl,
            matches: newDetections.map(match => ({
              confidence: (1 - match.distance) * 100,
              watchlistItem: {
                id: match.id!,
                name: match.name,
                alias: `Suspect #${match.id}`,
                status: WatchlistStatus.Suspect,
                charges: ['Under Investigation'],
                lastUpdated: new Date().toISOString(),
                imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(match.name)}&background=f9b2b2&color=7d1a1a`,
              }
            }))
          };

          reviewContext.addReviewItem(newReviewItem);
          auditLogContext.logActivity('Live Scan Match', `Match found for ${newReviewItem.matches.map(m => m.watchlistItem.name).join(', ')}. Sent to review queue.`);
          toastContext?.showToast(`พบรายการที่ตรงกัน: ${newReviewItem.matches[0].watchlistItem.name}`, 'info');

          const updatedSubmissions: Record<string, number> = {};
          newDetections.forEach(match => {
            updatedSubmissions[match.id!] = currentTime;
          });
          setRecentlySubmitted(prev => ({ ...prev, ...updatedSubmissions }));
        }
      }

      return res;
    } catch (e: any) {
      setError(e?.message || "สแกนไม่สำเร็จ");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function onUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.matchFile(f, threshold);
      setResults(res.results);
      setFaces(res.faces);

      const blobUrl = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const c = canvasRef.current!;
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, c.width, c.height);
        drawResults(res.results);
        URL.revokeObjectURL(blobUrl);
      };
      img.src = blobUrl;
    } catch (e: any) {
      setError(e?.message || "ตรวจจากไฟล์ไม่สำเร็จ");
    } finally {
      setBusy(false);
      e.currentTarget.value = "";
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Live Scan</h1>
          <p className="text-sm text-gray-500 mt-1">
            สแกนและจับคู่ใบหน้าแบบเรียลไทม์ หรืออัปโหลดภาพเพื่อตรวจครั้งเดียว
          </p>
        </div>
        <Badge color={faces > 0 ? "info" : "default"}>พบใบหน้า: {faces}</Badge>
      </div>

      {error && (
        <Card className="p-4 mb-4 border-danger/30 bg-danger/10">
          <p className="text-danger font-medium">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Video className="text-brand-600" />
              <h2 className="font-semibold text-gray-800">กล้อง & ภาพผลลัพธ์</h2>
            </div>
            <div className="flex items-center gap-2">
              {camState !== "on" ? (
                <Button
                  variant="primary"
                  onClick={startCamera}
                  icon={<Camera className="mr-2 h-4 w-4" />}
                >
                  เปิดกล้อง
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={stopCamera}
                  icon={<StopCircle className="mr-2 h-4 w-4" />}
                >
                  ปิดกล้อง
                </Button>
              )}
              <label className="rounded-lg border px-3 py-2 cursor-pointer text-sm hover:bg-gray-50">
                <span className="inline-flex items-center gap-2">
                  <Upload size={16} /> อัปโหลดไฟล์ภาพ…
                </span>
                <input type="file" accept="image/*" onChange={onUploadFile} className="hidden" />
              </label>
            </div>
          </div>

          <div className="relative w-full max-w-[1120px] aspect-video bg-black/70 rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain"
              onLoadedMetadata={resizeCanvasToVideo}
              playsInline
              autoPlay
              muted
            />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => scanOnce()}
              disabled={camState !== "on" || busy}
              icon={<RefreshCw className="mr-2 h-4 w-4" />}
            >
              {busy ? "กำลังสแกน..." : "สแกนครั้งเดียว"}
            </Button>

            <Button
              variant={isAutoScan ? "danger-ghost" : "primary"}
              onClick={() => setIsAutoScan(!isAutoScan)}
              disabled={camState !== "on"}
              icon={isAutoScan ? <StopCircle className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
            >
              {isAutoScan ? "หยุด Auto scan" : "เริ่ม Auto scan"}
            </Button>
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gauge className="text-brand-600" />
              <h2 className="font-semibold text-gray-800">ตั้งค่าการสแกน</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 flex items-center gap-1.5"><Timer size={14}/>Interval (ms)</label>
                <input
                  type="number"
                  min={200}
                  step={50}
                  className="w-28 rounded-lg border border-gray-300 p-1.5 text-right focus:outline-none focus:ring-2 focus:ring-brand-300"
                  value={scanInterval}
                  onChange={(e) =>
                    setScanInterval(Number(e.target.value) || DEFAULT_INTERVAL_MS)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700 flex items-center gap-1.5"><Timer size={14}/>Cooldown (ms)</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  className="w-28 rounded-lg border border-gray-300 p-1.5 text-right focus:outline-none focus:ring-2 focus:ring-brand-300"
                  value={cooldownMs}
                  onChange={(e) =>
                    setCooldownMs(Number(e.target.value) || DEFAULT_COOLDOWN_MS)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Threshold</label>
                <input
                  type="number"
                  min={0.2}
                  max={1}
                  step={0.01}
                  className="w-28 rounded-lg border border-gray-300 p-1.5 text-right focus:outline-none focus:ring-2 focus:ring-brand-300"
                  value={threshold}
                  onChange={(e) =>
                    setThreshold(
                      Math.min(1, Math.max(0.2, Number(e.target.value)))
                    )
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-800">สรุปผลล่าสุด</h2>
              <Badge color={faces ? "info" : "default"}>{faces} face(s)</Badge>
            </div>
            <div className="overflow-auto rounded-lg border">
              <table className="min-w-[520px] w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-2 text-left">Matched</th>
                    <th className="p-2 text-left">Name / ID</th>
                    <th className="p-2 text-left">Distance</th>
                    <th className="p-2 text-left">Box (t,r,b,l)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2">
                        <Badge color={r.matched ? "success" : "danger"}>
                          {r.matched ? "YES" : "NO"}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {r.matched ? (
                          <>
                            <b>{r.name}</b> {r.id ? `(${r.id})` : ""}
                          </>
                        ) : (
                          "unknown"
                        )}
                      </td>
                      <td className="p-2">
                        {r.distance.toFixed(4)} / th={r.threshold}
                      </td>
                      <td className="p-2">
                        {r.box.top},{r.box.right},{r.box.bottom},{r.box.left}
                      </td>
                    </tr>
                  ))}
                  {results.length === 0 && (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={4}>
                        (ยังไม่มีผลลัพธ์)
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveScan;