import { useEffect, useMemo, useState } from "react";
import api from "../api";

const todayStr = () => new Date().toISOString().slice(0, 10);

const statusStyle = {
  FIT: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  CONDITIONAL: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  NOT_FIT: "bg-red-500/15 text-red-500 border-red-500/30",
};

const statusLabel = { FIT: "Fit", CONDITIONAL: "Kondisional", NOT_FIT: "Tidak Fit" };

export default function FitToWork() {
  const [date, setDate] = useState(todayStr());
  const [sleepTime, setSleepTime] = useState("22:00");
  const [wakeTime, setWakeTime] = useState("05:00");
  const [feelingWell, setFeelingWell] = useState(true);
  const [consumedAlcohol, setConsumedAlcohol] = useState(false);
  const [onMedication, setOnMedication] = useState(false);
  const [stressLevel, setStressLevel] = useState("low");
  const [notes, setNotes] = useState("");

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Kalkulasi durasi tidur otomatis (live preview di frontend)
  const durationPreview = useMemo(() => {
    if (!sleepTime || !wakeTime) return null;
    const [sh, sm] = sleepTime.split(":").map(Number);
    const [wh, wm] = wakeTime.split(":").map(Number);
    let start = sh * 60 + sm;
    let end = wh * 60 + wm;
    if (end <= start) end += 24 * 60; // lintas hari
    const minutes = end - start;
    return Math.round((minutes / 60) * 100) / 100;
  }, [sleepTime, wakeTime]);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api.get("/fit-to-work/me");
      setEntries(res.data.entries);
    } catch (err) {
      console.error(err);
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
      const sleepDateTime = new Date(`${date}T${sleepTime}:00`);
      const wakeDateTime = new Date(`${date}T${wakeTime}:00`);
      if (wakeDateTime <= sleepDateTime) {
        wakeDateTime.setDate(wakeDateTime.getDate() + 1);
      }

      await api.post("/fit-to-work", {
        date,
        sleepTime: sleepDateTime.toISOString(),
        wakeTime: wakeDateTime.toISOString(),
        healthQuestionnaire: { feelingWell, consumedAlcohol, onMedication, stressLevel },
        notes,
      });

      setMessage({ type: "success", text: "Laporan berhasil dikirim." });
      setNotes("");
      loadHistory();
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Gagal mengirim laporan." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Fit To Work</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        Isi kondisi tidur & kesehatan harian sebelum memulai pekerjaan.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- FORM ---- */}
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4"
        >
          <div>
            <label className="text-sm font-medium block mb-1">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium block mb-1">Jam Tidur</label>
              <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} required className="input" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Jam Bangun</label>
              <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} required className="input" />
            </div>
          </div>

          {durationPreview !== null && (
            <div className="text-sm rounded-lg bg-brand-500/10 text-brand-500 px-3 py-2">
              Estimasi durasi tidur: <strong>{durationPreview} jam</strong>
            </div>
          )}

          <div className="space-y-2 pt-1">
            <p className="text-sm font-medium">Kuesioner Kesehatan</p>

            <Checkbox label="Saya merasa sehat & siap bekerja" checked={feelingWell} onChange={setFeelingWell} />
            <Checkbox label="Mengonsumsi alkohol dalam 8 jam terakhir" checked={consumedAlcohol} onChange={setConsumedAlcohol} />
            <Checkbox label="Sedang menjalani pengobatan/obat tertentu" checked={onMedication} onChange={setOnMedication} />

            <div>
              <label className="text-sm font-medium block mb-1">Tingkat stres</label>
              <select value={stressLevel} onChange={(e) => setStressLevel(e.target.value)} className="input">
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">Catatan (opsional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="input" />
          </div>

          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-emerald-500" : "text-red-500"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg py-2 text-sm disabled:opacity-50"
          >
            {submitting ? "Mengirim..." : "Kirim Laporan"}
          </button>
        </form>

        {/* ---- HISTORY ---- */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <h3 className="font-semibold mb-3">Riwayat Laporan</h3>

          {loading ? (
            <p className="text-sm text-slate-400">Memuat...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-slate-400">Belum ada laporan.</p>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(entry.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tidur {entry.sleepDurationHours} jam
                      {entry.validatedAt ? " · Tervalidasi" : " · Menunggu validasi"}
                    </p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusStyle[entry.fitStatus]}`}>
                    {statusLabel[entry.fitStatus]}
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
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="rounded" />
      {label}
    </label>
  );
}
