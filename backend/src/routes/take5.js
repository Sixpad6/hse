const express = require("express");
const prisma = require("../prismaClient");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// ---- Helper: tentukan rekomendasi PROCEED / STOP dari jawaban risiko ----
// Aturan sederhana: kalau ada kondisi risiko tinggi (kerja di ketinggian,
// ruang terbatas, sumber energi berbahaya, cuaca buruk) TANPA PPE lengkap
// atau kondisi tidak fit -> STOP. Silakan sesuaikan dengan SOP HSE perusahaan.
function determineRecommendation(riskAnswers) {
  const r = riskAnswers || {};
  const highRiskConditions = [
    r.workingAtHeight,
    r.confinedSpace,
    r.hasEnergySource,
    r.hasMovingParts,
    r.weatherHazard,
  ].some(Boolean);

  if (!r.feelingFit) return "STOP";
  if (highRiskConditions && !r.properPPE) return "STOP";

  return "PROCEED";
}

// POST /api/take5
router.post("/", authRequired, async (req, res) => {
  try {
    const { location, jobType, date, riskAnswers, notes } = req.body;

    if (!location || !jobType) {
      return res.status(400).json({ message: "Lokasi dan jenis pekerjaan wajib diisi." });
    }

    const recommendation = determineRecommendation(riskAnswers);

    const entry = await prisma.take5.create({
      data: {
        userId: req.user.id,
        location,
        jobType,
        date: date ? new Date(date) : new Date(),
        riskAnswers: JSON.stringify(riskAnswers || {}),
        recommendation,
        notes: notes || null,
      },
    });

    return res.status(201).json({ message: "Asesmen Take 5 berhasil disimpan.", entry: formatEntry(entry) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// GET /api/take5/me - riwayat milik user login
router.get("/me", authRequired, async (req, res) => {
  const entries = await prisma.take5.findMany({
    where: { userId: req.user.id },
    orderBy: { date: "desc" },
  });
  return res.json({ entries: entries.map(formatEntry) });
});

// GET /api/take5 - semua entri (HSE/Supervisor/Admin)
router.get("/", authRequired, requireRole("HSE_OFFICER", "ADMIN", "SUPERVISOR"), async (req, res) => {
  const entries = await prisma.take5.findMany({
    include: { user: { select: { name: true, department: true } } },
    orderBy: { date: "desc" },
  });
  return res.json({ entries: entries.map(formatEntry) });
});

function formatEntry(entry) {
  return { ...entry, riskAnswers: safeParse(entry.riskAnswers) };
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

module.exports = router;
