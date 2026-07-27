import { useEffect, useState } from "react";
import api from "../api";

const categoryLabel = {
  UNSAFE_ACTION: "Tindakan Tidak Aman",
  UNSAFE_CONDITION: "Kondisi Tidak Aman",
  NEAR_MISS: "Nyaris Celaka (Near Miss)",
};

const severityStyle = {
  LOW: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  HIGH: "bg-red-500/15 text-red-500 border-red-500/30",
};

export default function HazardReport() {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("UNSAFE_CONDITION");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("LOW");
  const [picId, setPicId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [users, setUsers] = useState([]);
  const [myReports, setMyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, reportsRes] = await Promise.all([api.get("/users"), api.get("/hazard-report/me")]);
      setUsers(usersRes.data.users);
      setMyReports(reportsRes.data.reports);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setStep(1);
    setLocation("");
    setCategory("UNSAFE_CONDITION");
    setDescription("");
    setSeverity("LOW");
    setPicId("");
    setDueDate("");
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post("/hazard-report", { location, category, description, severity, picId: picId || null, dueDate: dueDate || null });
      setMessage({ type: "success", text: "Laporan bahaya berhasil dikirim." });
      resetForm();
      loadData();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Gagal mengirim laporan." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Hazard Report</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Laporkan potensi bahaya di lapangan dalam 3 langkah.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <StepIndicator step={step} />

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Langkah 1 — Lokasi</p>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="mis. Gudang B, Lantai 2" className="input" />
              <NavButtons onNext={() => location && setStep(2)} nextDisabled={!location} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Langkah 2 — Detail Temuan</p>
              <div>
                <label className="text-sm block mb-1">Kategori</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="input">
                  {Object.entries(categoryLabel).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Tingkat Keparahan</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="input">
                  <option value="LOW">Rendah</option>
                  <option value="MEDIUM">Sedang</option>
                  <option value="HIGH">Tinggi</option>
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Deskripsi Temuan</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" placeholder="Jelaskan bahaya yang ditemukan..." />
              </div>
              <NavButtons onBack={() => setStep(1)} onNext={() => description && setStep(3)} nextDisabled={!description} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Langkah 3 — Penunjukan PIC</p>
              <div>
                <label className="text-sm block mb-1">PIC (Penanggung Jawab)</label>
                <select value={picId} onChange={(e) => setPicId(e.target.value)} className="input">
                  <option value="">-- Belum ditentukan --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.department || "-"})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm block mb-1">Target Selesai (opsional)</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
              </div>

              {message && (
                <p className={`text-sm ${message.type === "success" ? "text-emerald-500" : "text-red-500"}`}>{message.text}</p>
              )}

              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(2)} className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg py-2 text-sm">Kembali</button>
                <button type="button" onClick={handleFinalSubmit} disabled={submitting} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
                  {submitting ? "Mengirim..." : "Kirim Laporan"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Laporan Saya</h3>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : myReports.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada laporan.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {myReports.map((r) => (
                <div key={r.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{r.location}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${severityStyle[r.severity]}`}>{r.severity}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{r.description}</p>
                  <p className="text-xs text-slate-400 mt-1">PIC: {r.pic?.name || "Belum ditentukan"} · Status: {r.status}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {[1, 2, 3].map((s) => (
        <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-800"}`} />
      ))}
    </div>
  );
}

function NavButtons({ onBack, onNext, nextDisabled }) {
  return (
    <div className="flex gap-2">
      {onBack && (
        <button type="button" onClick={onBack} className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg py-2 text-sm">
          Kembali
        </button>
      )}
      <button type="button" onClick={onNext} disabled={nextDisabled} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">
        Lanjut
      </button>
    </div>
  );
}
