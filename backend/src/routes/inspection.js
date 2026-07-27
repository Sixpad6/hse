const express = require("express");
const prisma = require("../prismaClient");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// Template checklist per jenis inspeksi. Dikirim ke frontend supaya konsisten
// dan mudah ditambah/diubah tanpa mengubah kode frontend.
const CHECKLIST_TEMPLATES = {
  FIVE_R: [
    "Barang/alat tertata rapi sesuai tempatnya (Ringkas)",
    "Area kerja bersih dari sampah & tumpahan (Resik)",
    "Label/identitas area & alat jelas (Rawat)",
    "Jalur evakuasi tidak terhalang",
    "APAR tersedia & mudah diakses",
  ],
  POWER_TOOLS: [
    "Kabel/selang tidak ada yang terkelupas/rusak",
    "Pelindung (guard) terpasang dengan baik",
    "Tidak ada kebocoran oli/udara",
    "Stiker inspeksi/kalibrasi masih berlaku",
    "Tersedia APD sesuai jenis alat",
  ],
  LIFTING_GEAR: [
    "Tidak ada keretakan/deformasi pada sling/rantai",
    "Beban maksimum (SWL) tertera jelas",
    "Sertifikat/tag inspeksi masih berlaku",
    "Hook dilengkapi safety latch berfungsi baik",
    "Tidak ada karat berlebih pada komponen",
  ],
  PARKING_AREA: [
    "Marka parkir jelas & terlihat",
    "Rambu/petunjuk arah tersedia",
    "Tidak ada tumpahan oli/BBM",
    "Pencahayaan area memadai",
    "Jalur pejalan kaki terpisah dari jalur kendaraan",
  ],
  OPERATIONAL_VEHICLE: [
    "Rem berfungsi normal",
    "Lampu & sein menyala semua",
    "Ban dalam kondisi layak (tidak gundul)",
    "APAR & kotak P3K tersedia di kendaraan",
    "Kaca spion & wiper berfungsi baik",
  ],
};

// GET /api/inspection/templates - daftar template checklist
router.get("/templates", authRequired, (req, res) => {
  res.json({ templates: CHECKLIST_TEMPLATES });
});

// POST /api/inspection
router.post("/", authRequired, async (req, res) => {
  try {
    const { type, area, date, checklistItems, notes } = req.body;

    if (!type || !area || !Array.isArray(checklistItems) || checklistItems.length === 0) {
      return res.status(400).json({ message: "Jenis inspeksi, area, dan checklist wajib diisi." });
    }

    const overallResult = checklistItems.some((i) => i.result === "NOT_OK") ? "FAIL" : "PASS";

    const inspection = await prisma.inspection.create({
      data: {
        inspectorId: req.user.id,
        type,
        area,
        date: date ? new Date(date) : new Date(),
        checklistItems: JSON.stringify(checklistItems),
        overallResult,
        notes: notes || null,
      },
    });

    return res.status(201).json({ message: "Inspeksi berhasil disimpan.", inspection: formatEntry(inspection) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// GET /api/inspection/me
router.get("/me", authRequired, async (req, res) => {
  const inspections = await prisma.inspection.findMany({
    where: { inspectorId: req.user.id },
    orderBy: { date: "desc" },
  });
  return res.json({ inspections: inspections.map(formatEntry) });
});

// GET /api/inspection - semua (HSE/Supervisor/Admin)
router.get("/", authRequired, requireRole("HSE_OFFICER", "ADMIN", "SUPERVISOR"), async (req, res) => {
  const inspections = await prisma.inspection.findMany({
    include: { inspector: { select: { name: true, department: true } } },
    orderBy: { date: "desc" },
  });
  return res.json({ inspections: inspections.map(formatEntry) });
});

function formatEntry(inspection) {
  return { ...inspection, checklistItems: safeParse(inspection.checklistItems) };
}

function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

module.exports = router;
