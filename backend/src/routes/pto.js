const express = require("express");
const prisma = require("../prismaClient");
const { authRequired, requireRole } = require("../middleware/auth");

const router = express.Router();

// POST /api/pto
router.post("/", authRequired, async (req, res) => {
  try {
    const { department, procedureRef, observationDate, positiveFindings, improvementFindings, actionTaken } = req.body;

    if (!department || !procedureRef) {
      return res.status(400).json({ message: "Departemen dan prosedur yang diobservasi wajib diisi." });
    }

    const entry = await prisma.pTO.create({
      data: {
        observerId: req.user.id,
        department,
        procedureRef,
        observationDate: observationDate ? new Date(observationDate) : new Date(),
        positiveFindings: positiveFindings || null,
        improvementFindings: improvementFindings || null,
        actionTaken: actionTaken || null,
      },
    });

    return res.status(201).json({ message: "Observasi PTO berhasil disimpan.", entry });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
});

// GET /api/pto/me
router.get("/me", authRequired, async (req, res) => {
  const entries = await prisma.pTO.findMany({
    where: { observerId: req.user.id },
    orderBy: { observationDate: "desc" },
  });
  return res.json({ entries });
});

// GET /api/pto - semua entri (HSE/Supervisor/Admin)
router.get("/", authRequired, requireRole("HSE_OFFICER", "ADMIN", "SUPERVISOR"), async (req, res) => {
  const entries = await prisma.pTO.findMany({
    include: { observer: { select: { name: true, department: true } } },
    orderBy: { observationDate: "desc" },
  });
  return res.json({ entries });
});

module.exports = router;
