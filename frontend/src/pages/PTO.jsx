import { useEffect, useState } from "react";
import api from "../api";

export default function PTO() {
  const [department, setDepartment] = useState("");
  const [procedureRef, setProcedureRef] = useState("");
  const [positiveFindings, setPositiveFindings] = useState("");
  const [improvementFindings, setImprovementFindings] = useState("");
  const [actionTaken, setActionTaken] = useState("");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api.get("/pto/me");
      setEntries(res.data.entries);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post("/pto", { department, procedureRef, positiveFindings, improvementFindings, actionTaken });
      setMessage({ type: "success", text: "Observasi berhasil disimpan." });
      setPositiveFindings("");
      setImprovementFindings("");
      setActionTaken("");
      loadHistory();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Gagal menyimpan observasi." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">PTO — Planned Task Observation</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Observasi tugas terencana berdasarkan prosedur departemen.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Departemen</label>
            <input value={department} onChange={(e) => setDepartment(e.target.value)} required placeholder="mis. Maintenance" className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Tugas / Prosedur yang Diobservasi</label>
            <input value={procedureRef} onChange={(e) => setProcedureRef(e.target.value)} required placeholder="mis. SOP Pengangkatan Beban" className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Temuan Positif</label>
            <textarea value={positiveFindings} onChange={(e) => setPositiveFindings(e.target.value)} rows={2} className="input" placeholder="Hal-hal yang sudah sesuai prosedur" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Temuan Perbaikan</label>
            <textarea value={improvementFindings} onChange={(e) => setImprovementFindings(e.target.value)} rows={2} className="input" placeholder="Hal yang perlu diperbaiki" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Tindakan yang Diambil</label>
            <textarea value={actionTaken} onChange={(e) => setActionTaken(e.target.value)} rows={2} className="input" />
          </div>

          {message && <p className={`text-sm ${message.type === "success" ? "text-emerald-500" : "text-red-500"}`}>{message.text}</p>}

          <button type="submit" disabled={submitting} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2 text-sm disabled:opacity-50">
            {submitting ? "Menyimpan..." : "Simpan Observasi"}
          </button>
        </form>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Riwayat Observasi</h3>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada observasi.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {entries.map((e) => (
                <div key={e.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3">
                  <p className="text-sm font-medium">{e.procedureRef}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {e.department} · {new Date(e.observationDate).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
