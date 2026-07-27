const express = require("express");
const prisma = require("../prismaClient");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/hazard-report - laporan bahaya multi-step (lokasi, detail, PIC)
router.post("/", authRequired, async (req, res) => {
  try {
    const { location, category, description, severity, picId, dueDate } = req.body;

    if (!location || !category || !description) {
      return res.status(400).json({ message: "Lokasi, kategori, dan detail temuan wajib diisi." });
    }

    const report = await prisma.hazardReport.create({
      data: {
        reporterId: req.user.id,
        location,
        category,
        description,
        severity: severity || "LOW",
        picId: picId ? Number(picId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: "TO_DO",
      },
    });

    return res.status(201).json({ message: "Laporan bahaya berhasil dikirim.", report: await withRelations(report.id) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// GET /api/hazard-report - semua laporan, dipakai juga oleh Tasklist & Monitoring
// query opsional: ?status=TO_DO|MONITORING|DONE
router.get("/", authRequired, async (req, res) => {
  const { status } = req.query;
  const reports = await prisma.hazardReport.findMany({
    where: status ? { status } : undefined,
    include: {
      reporter: { select: { id: true, name: true, department: true } },
      pic: { select: { id: true, name: true, department: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ reports });
});

// GET /api/hazard-report/me - laporan milik user login
router.get("/me", authRequired, async (req, res) => {
  const reports = await prisma.hazardReport.findMany({
    where: { reporterId: req.user.id },
    include: { pic: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return res.json({ reports });
});

// PATCH /api/hazard-report/:id - update status / PIC / due date (dipakai Tasklist & Monitoring)
router.patch("/:id", authRequired, async (req, res) => {
  const id = Number(req.params.id);
  const { status, picId, dueDate } = req.body;

  const existing = await prisma.hazardReport.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: "Laporan tidak ditemukan." });

  // Yang boleh update: pelapor, PIC yang ditunjuk, atau HSE/Supervisor/Admin
  const isPrivileged = ["HSE_OFFICER", "ADMIN", "SUPERVISOR"].includes(req.user.role);
  const isOwnerOrPic = existing.reporterId === req.user.id || existing.picId === req.user.id;
  if (!isPrivileged && !isOwnerOrPic) {
    return res.status(403).json({ message: "Anda tidak memiliki akses untuk memperbarui laporan ini." });
  }

  const updated = await prisma.hazardReport.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(picId !== undefined ? { picId: picId ? Number(picId) : null } : {}),
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
  });

  return res.json({ message: "Laporan berhasil diperbarui.", report: await withRelations(updated.id) });
});

async function withRelations(id) {
  return prisma.hazardReport.findUnique({
    where: { id },
    include: {
      reporter: { select: { id: true, name: true, department: true } },
      pic: { select: { id: true, name: true, department: true } },
    },
  });
}

module.exports = router;
