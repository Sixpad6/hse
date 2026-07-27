const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  await prisma.user.upsert({
    where: { email: "employee@company.com" },
    update: {},
    create: {
      name: "Budi Santoso",
      email: "employee@company.com",
      password,
      position: "Operator Alat Berat",
      department: "Operasional",
      role: "EMPLOYEE",
    },
  });

  await prisma.user.upsert({
    where: { email: "hse@company.com" },
    update: {},
    create: {
      name: "Siti Rahma",
      email: "hse@company.com",
      password,
      position: "HSE Officer",
      department: "HSE",
      role: "HSE_OFFICER",
    },
  });

  await prisma.user.upsert({
    where: { email: "supervisor@company.com" },
    update: {},
    create: {
      name: "Andi Wijaya",
      email: "supervisor@company.com",
      password,
      position: "Supervisor Lapangan",
      department: "Operasional",
      role: "SUPERVISOR",
    },
  });

  console.log("Seed selesai. Login dengan:");
  console.log("  employee@company.com / password123");
  console.log("  hse@company.com / password123");
  console.log("  supervisor@company.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
