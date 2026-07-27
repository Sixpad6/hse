import { useEffect, useState } from "react";
import api from "../api";

const typeLabel = {
  FIVE_R: "Inspeksi 5R",
  POWER_TOOLS: "Power Tools",
  LIFTING_GEAR: "Lifting Gear",
  PARKING_AREA: "Area Parkir",
  OPERATIONAL_VEHICLE: "Kendaraan Operasional",
};

export default function Inspection() {
  const [templates, setTemplates] = useState({});
  const [type, setType] = useState("FIVE_R");
  const [area, setArea] = useState("");
  const [checklist, setChecklist] = useState([]); // [{item, result, note}]
  const [notes, setNotes] = useState("");

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [tplRes, historyRes] = await Promise.all([api.get("/inspection/templates"), api.get("/inspection/me")]);
      setTemplates(tplRes.data.templates);
      setHistory(historyRes.data.inspections);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (templates[type]) {
      setChecklist(templates[type].map((item) => ({ item, result: "OK", note: "" })));
    }
  }, [type, templates]);

  function updateResult(idx, result) {
    setChecklist((c) => c.map((row, i) => (i === idx ? { ...row, result } : row)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!area) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await api.post("/inspection", { type, area, checklistItems: checklist, notes });
      setMessage({ type: "success", text: `Inspeksi disimpan. Hasil: ${res.data.inspection.overallResult === "PASS" ? "LULUS ✅" : "TIDAK LULUS ⚠️"}` });
      setArea("");
      setNotes("");
      loadAll();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Gagal menyimpan inspeksi." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Modul Inspeksi</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Checklist digital untuk audit 5R, alat, lifting gear, parkir, dan kendaraan.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Jenis Inspeksi</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="input">
              {Object.entries(typeLabel).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Area / Objek Inspeksi</label>
            <input value={area} onChange={(e) => setArea(e.target.value)} required placeholder="mis. Workshop B / Forklift FL-02" className="input" />
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-sm font-medium">Checklist</p>
            {checklist.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2">
                <p className="text-sm flex-1">{row.item}</p>
                <div className="flex gap-1 shrink-0">
                  {["OK", "NOT_OK", "NA"].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => updateResult(idx, opt)}
                      className={`text-xs px-2 py-1 rounded-md border ${
                        row.result === opt
                          ? opt === "OK"
                            ? "bg-emerald-500 text-white border-emerald-500"
                            : opt === "NOT_OK"
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-slate-400 text-white border-slate-400"
                          : "border-slate-300 dark:border-slate-700 text-slate-500"
                      }`}
                    >
                      {opt === "OK" ? "OK" : opt === "NOT_OK" ? "Tidak OK" : "N/A"}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Catatan (opsional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
          </div>

          {message && <p className={`text-sm ${message.type === "success" ? "text-emerald-500" : "text-red-500"}`}>{message.text}</p>}

          <button type="submit" disabled={submitting} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2 text-sm disabled:opacity-50">
            {submitting ? "Menyimpan..." : "Simpan Inspeksi"}
          </button>
        </form>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Riwayat Inspeksi</h3>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada inspeksi.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {history.map((h) => (
                <div key={h.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{typeLabel[h.type]} · {h.area}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(h.date).toLocaleDateString("id-ID")}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${h.overallResult === "PASS" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : "bg-red-500/15 text-red-500 border-red-500/30"}`}>
                    {h.overallResult === "PASS" ? "Lulus" : "Tidak Lulus"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
