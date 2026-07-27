const express = require("express");
const prisma = require("../prismaClient");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

// GET /api/users - daftar ringkas karyawan (untuk dropdown PIC, dsb.)
router.get("/", authRequired, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, department: true, position: true, role: true },
    orderBy: { name: "asc" },
  });
  return res.json({ users });
});

module.exports = router;
