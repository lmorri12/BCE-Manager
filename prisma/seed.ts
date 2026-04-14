import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_USER" },
  });

  if (existingAdmin) {
    console.log("Super user already exists:", existingAdmin.email);
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.create({
    data: {
      email: "admin",
      passwordHash,
      name: "BCE Admin",
      role: "SUPER_USER",
      mustChangePassword: false,
    },
  });

  console.log("Created super user:", admin.email);
  console.log("Default password: admin123 (must be changed on first login)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
