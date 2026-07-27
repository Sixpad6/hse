import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1">Selamat datang, {user?.name} 👋</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        {user?.position} · {user?.department} · Role: {user?.role}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card title="Fit To Work" desc="Isi laporan kondisi harian & lihat riwayat." to="/fit-to-work" />
        <Card title="Take 5" desc="Asesmen risiko cepat sebelum bekerja." to="/take-5" />
        <Card title="Hazard Report" desc="Laporkan potensi bahaya di lapangan." to="/hazard-report" />
        <Card title="Tasklist & Monitoring" desc="Pantau status tindak lanjut." to="/tasklist" />
        <Card title="PTO Observation" desc="Observasi tugas terencana." to="/pto" />
        <Card title="Modul Inspeksi" desc="Checklist 5R, alat, kendaraan." to="/inspection" />
      </div>
    </div>
  );
}

function Card({ title, desc, to }) {
  return (
    <Link
      to={to}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-brand-500 transition block"
    >
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
    </Link>
  );
}
