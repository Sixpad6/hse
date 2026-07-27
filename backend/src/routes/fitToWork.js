const express = require("express");
const prisma = require("../prismaClient");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// ---- Helper: hitung durasi tidur (jam) dari sleepTime -> wakeTime ----
// Menangani kasus tidur malam & bangun keesokan harinya (durasi tetap positif).
function calcSleepDuration(sleepTime, wakeTime) {
  const sleep = new Date(sleepTime);
  let wake = new Date(wakeTime);

  if (wake <= sleep) {
    // wake dianggap hari berikutnya
    wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
  }

  const diffMs = wake - sleep;
  const hours = diffMs / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100; // 2 desimal
}

// ---- Helper: tentukan status Fit To Work ----
// Logika kondisional sederhana, bisa disesuaikan dengan SOP HSE perusahaan.
function determineFitStatus(sleepDurationHours, questionnaire) {
  const q = questionnaire || {};

  // Kondisi langsung NOT FIT
  if (q.consumedAlcohol === true || q.underInfluence === true) {
    return "NOT_FIT";
  }
  if (sleepDurationHours < 5) {
    return "NOT_FIT";
  }

  // Kondisi CONDITIONAL (perlu perhatian/validasi supervisor)
  if (sleepDurationHours < 6 || q.feelingWell === false || q.stressLevel === "high") {
    return "CONDITIONAL";
  }

  return "FIT";
}

// POST /api/fit-to-work - submit laporan harian
router.post("/", authRequired, async (req, res) => {
  try {
    const { date, sleepTime, wakeTime, healthQuestionnaire, notes } = req.body;

    if (!date || !sleepTime || !wakeTime) {
      return res.status(400).json({ message: "Tanggal, jam tidur, dan jam bangun wajib diisi." });
    }

    const sleepDurationHours = calcSleepDuration(sleepTime, wakeTime);
    const fitStatus = determineFitStatus(sleepDurationHours, healthQuestionnaire);

    const entry = await prisma.fitToWork.create({
      data: {
        userId: req.user.id,
        date: new Date(date),
        sleepTime: new Date(sleepTime),
        wakeTime: new Date(wakeTime),
        sleepDurationHours,
        healthQuestionnaire: JSON.stringify(healthQuestionnaire || {}),
        fitStatus,
        notes: notes || null,
      },
    });

    return res.status(201).json({ message: "Laporan Fit To Work berhasil disimpan.", entry: formatEntry(entry) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// GET /api/fit-to-work/me - riwayat laporan milik user login
router.get("/me", authRequired, async (req, res) => {
  const entries = await prisma.fitToWork.findMany({
    where: { userId: req.user.id },
    orderBy: { date: "desc" },
  });
  return res.json({ entries: entries.map(formatEntry) });
});

// GET /api/fit-to-work - semua laporan (khusus HSE Officer / Admin / Supervisor) untuk validasi
router.get("/", authRequired, requireRole("HSE_OFFICER", "ADMIN", "SUPERVISOR"), async (req, res) => {
  const entries = await prisma.fitToWork.findMany({
    include: { user: { select: { name: true, department: true, position: true } } },
    orderBy: { date: "desc" },
  });
  return res.json({ entries: entries.map(formatEntry) });
});

// PATCH /api/fit-to-work/:id/validate - validasi oleh supervisor/HSE
router.patch("/:id/validate", authRequired, requireRole("HSE_OFFICER", "ADMIN", "SUPERVISOR"), async (req, res) => {
  const id = Number(req.params.id);
  const entry = await prisma.fitToWork.update({
    where: { id },
    data: { validatedById: req.user.id, validatedAt: new Date() },
  });
  return res.json({ message: "Laporan berhasil divalidasi.", entry: formatEntry(entry) });
});

function formatEntry(entry) {
  return {
    ...entry,
    healthQuestionnaire: safeParse(entry.healthQuestionnaire),
  };
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

module.exports = router;
