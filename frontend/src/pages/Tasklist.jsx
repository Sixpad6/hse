import { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const tabs = [
  { key: "TO_DO", label: "To Do" },
  { key: "MONITORING", label: "Monitoring" },
  { key: "DONE", label: "Riwayat" },
];

const severityStyle = {
  LOW: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  HIGH: "bg-red-500/15 text-red-500 border-red-500/30",
};

export default function Tasklist() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("TO_DO");
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get("/hazard-report", { params: { status: activeTab } });
      setReports(res.data.reports);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.patch(`/hazard-report/${id}`, { status });
      load();
    } finally {
      setUpdatingId(null);
    }
  }

  const canAct = (r) =>
    ["HSE_OFFICER", "ADMIN", "SUPERVISOR"].includes(user?.role) || r.pic?.id === user?.id || r.reporter?.id === user?.id;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Tasklist & Monitoring</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        Pantau tindak lanjut laporan bahaya — dari pelapor, PIC, hingga status penyelesaian.
      </p>

      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
              activeTab === t.key
                ? "bg-brand-500 text-white border-brand-500"
                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-sm text-slate-400 p-5">Memuat...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-slate-400 p-5">Tidak ada data pada status ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-left text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Lokasi / Temuan</th>
                  <th className="px-4 py-2 font-medium">Pelapor</th>
                  <th className="px-4 py-2 font-medium">PIC</th>
                  <th className="px-4 py-2 font-medium">Target</th>
                  <th className="px-4 py-2 font-medium">Severity</th>
                  <th className="px-4 py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="font-medium">{r.location}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2">{r.description}</p>
                    </td>
                    <td className="px-4 py-3">{r.reporter?.name}</td>
                    <td className="px-4 py-3">{r.pic?.name || "—"}</td>
                    <td className="px-4 py-3">{r.dueDate ? new Date(r.dueDate).toLocaleDateString("id-ID") : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${severityStyle[r.severity]}`}>{r.severity}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canAct(r) ? (
                        <div className="flex gap-1">
                          {activeTab !== "TO_DO" && (
                            <ActionBtn onClick={() => updateStatus(r.id, "TO_DO")} disabled={updatingId === r.id} label="To Do" />
                          )}
                          {activeTab !== "MONITORING" && (
                            <ActionBtn onClick={() => updateStatus(r.id, "MONITORING")} disabled={updatingId === r.id} label="Monitoring" />
                          )}
                          {activeTab !== "DONE" && (
                            <ActionBtn onClick={() => updateStatus(r.id, "DONE")} disabled={updatingId === r.id} label="Selesai" primary />
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionBtn({ onClick, disabled, label, primary }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-xs px-2 py-1 rounded-md border disabled:opacity-50 ${
        primary
          ? "bg-brand-500 text-white border-brand-500"
          : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
