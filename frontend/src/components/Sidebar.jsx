import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠", ready: true },
  { to: "/fit-to-work", label: "Fit To Work", icon: "🛌", ready: true },
  { to: "/take-5", label: "Take 5 (Pre-Task)", icon: "✋", ready: true },
  { to: "/hazard-report", label: "Hazard Report", icon: "⚠️", ready: true },
  { to: "/tasklist", label: "Tasklist & Monitoring", icon: "📋", ready: true },
  { to: "/pto", label: "PTO Observation", icon: "🧭", ready: true },
  { to: "/inspection", label: "Modul Inspeksi", icon: "🔍", ready: true },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="px-5 py-5 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-lg font-bold text-brand-600 dark:text-brand-400">HSE & Fatigue</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">Management System</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.ready ? item.to : "#"}
            onClick={(e) => !item.ready && e.preventDefault()}
            className={({ isActive }) =>
              `flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition
               ${item.ready ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
               ${isActive && item.ready
                 ? "bg-brand-500 text-white"
                 : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"}`
            }
          >
            <span className="flex items-center gap-2">
              <span>{item.icon}</span>
              {item.label}
            </span>
            {!item.ready && (
              <span className="text-[10px] uppercase bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                soon
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold">{user?.name}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {user?.position} · {user?.department}
        </p>
        <button
          onClick={logout}
          className="mt-3 w-full text-xs font-medium text-red-500 hover:text-red-600 border border-red-500/40 rounded-lg py-1.5"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
