import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FitToWork from "./pages/FitToWork";
import Take5 from "./pages/Take5";
import HazardReport from "./pages/HazardReport";
import Tasklist from "./pages/Tasklist";
import PTO from "./pages/PTO";
import Inspection from "./pages/Inspection";
import ProtectedLayout from "./components/ProtectedLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/fit-to-work" element={<FitToWork />} />
        <Route path="/take-5" element={<Take5 />} />
        <Route path="/hazard-report" element={<HazardReport />} />
        <Route path="/tasklist" element={<Tasklist />} />
        <Route path="/pto" element={<PTO />} />
        <Route path="/inspection" element={<Inspection />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
