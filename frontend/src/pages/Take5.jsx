import { useEffect, useState } from "react";
import api from "../api";

const riskQuestions = [
  { key: "workingAtHeight", label: "Bekerja di ketinggian" },
  { key: "confinedSpace", label: "Bekerja di ruang terbatas (confined space)" },
  { key: "hasEnergySource", label: "Ada sumber energi berbahaya (listrik/tekanan/panas)" },
  { key: "hasMovingParts", label: "Ada bagian mesin yang bergerak" },
  { key: "weatherHazard", label: "Kondisi cuaca berpotensi bahaya" },
];

export default function Take5() {
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState("");
  const [answers, setAnswers] = useState({
    workingAtHeight: false,
    confinedSpace: false,
    hasEnergySource: false,
    hasMovingParts: false,
    weatherHazard: false,
    properPPE: true,
    feelingFit: true,
  });
  const [notes, setNotes] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function toggle(key) {
    setAnswers((a) => ({ ...a, [key]: !a[key] }));
  }

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api.get("/take5/me");
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
    if (!location || !jobType) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await api.post("/take5", { location, jobType, riskAnswers: answers, notes });
      setResult(res.data.entry.recommendation);
      setNotes("");
      loadHistory();
    } catch (err) {
      setResult("ERROR");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Take 5 — Pre-Task Assessment</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        Luangkan 5 menit menilai risiko sebelum memulai pekerjaan.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1">Lokasi Kerja</label>
            <input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="mis. Area Workshop A" className="input" />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Jenis Pekerjaan</label>
            <input value={jobType} onChange={(e) => setJobType(e.target.value)} required placeholder="mis. Perawatan alat berat" className="input" />
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-sm font-medium">Faktor Risiko di Lokasi</p>
            {riskQuestions.map((q) => (
              <Checkbox key={q.key} label={q.label} checked={answers[q.key]} onChange={() => toggle(q.key)} />
            ))}
          </div>

          <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
            <Checkbox label="APD lengkap & sesuai" checked={answers.properPPE} onChange={() => toggle("properPPE")} />
            <Checkbox label="Saya merasa fit untuk bekerja" checked={answers.feelingFit} onChange={() => toggle("feelingFit")} />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Catatan (opsional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
          </div>

          {result && result !== "ERROR" && (
            <div className={`text-sm font-semibold rounded-lg px-3 py-2 ${result === "PROCEED" ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}`}>
              Rekomendasi: {result === "PROCEED" ? "LANJUTKAN ✅" : "STOP — hentikan & lapor ke supervisor ⛔"}
            </div>
          )}
          {result === "ERROR" && <p className="text-sm text-red-500">Gagal mengirim asesmen.</p>}

          <button type="submit" disabled={submitting} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2 text-sm disabled:opacity-50">
            {submitting ? "Memproses..." : "Nilai Risiko"}
          </button>
        </form>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Riwayat Asesmen</h3>
          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada asesmen.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {entries.map((e) => (
                <div key={e.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{e.location} · {e.jobType}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(e.date).toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${e.recommendation === "PROCEED" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : "bg-red-500/15 text-red-500 border-red-500/30"}`}>
                    {e.recommendation === "PROCEED" ? "Lanjut" : "Stop"}
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

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded" />
      {label}
    </label>
  );
}
