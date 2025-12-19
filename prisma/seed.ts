import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Starting seed...");

  // Create Firm
  const firm = await prisma.firm.upsert({
    where: { id: "firm-1" },
    update: {},
    create: {
      id: "firm-1",
      name: "Demo Law Firm LLP",
      address: "123 Legal Street, Suite 100, New York, NY 10001",
      phone: "(555) 123-4567",
      website: "https://demolawfirm.com",
    },
  });
  console.log("Created firm:", firm.name);

  // Create Admin User
  const adminPassword = await hashPassword("Admin123!");
  const admin = await prisma.user.upsert({
    where: { email: "admin@dealpilot.com" },
    update: {},
    create: {
      email: "admin@dealpilot.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      firmId: firm.id,
      title: "System Administrator",
    },
  });
  console.log("Created admin user:", admin.email);

  // Create Attorney Users
  const attorneyPassword = await hashPassword("Attorney123!");
  const attorney1 = await prisma.user.upsert({
    where: { email: "john.smith@dealpilot.com" },
    update: {},
    create: {
      email: "john.smith@dealpilot.com",
      name: "John Smith",
      passwordHash: attorneyPassword,
      role: "ATTORNEY",
      status: "ACTIVE",
      firmId: firm.id,
      title: "Senior Partner",
      phone: "(555) 234-5678",
    },
  });
  console.log("Created attorney:", attorney1.email);

  const attorney2 = await prisma.user.upsert({
    where: { email: "jane.doe@dealpilot.com" },
    update: {},
    create: {
      email: "jane.doe@dealpilot.com",
      name: "Jane Doe",
      passwordHash: attorneyPassword,
      role: "ATTORNEY",
      status: "ACTIVE",
      firmId: firm.id,
      title: "Associate",
      phone: "(555) 345-6789",
    },
  });
  console.log("Created attorney:", attorney2.email);

  // Create Clients (Organizations)
  const client1 = await prisma.client.upsert({
    where: { id: "client-1" },
    update: {},
    create: {
      id: "client-1",
      name: "Acme Corporation",
      type: "Corporation",
      address: "456 Business Ave, Chicago, IL 60601",
      phone: "(555) 456-7890",
      email: "contact@acmecorp.com",
      website: "https://acmecorp.com",
      firmId: firm.id,
    },
  });
  console.log("Created client:", client1.name);

  const client2 = await prisma.client.upsert({
    where: { id: "client-2" },
    update: {},
    create: {
      id: "client-2",
      name: "Global Investments LLC",
      type: "LLC",
      address: "789 Investment Blvd, Los Angeles, CA 90001",
      phone: "(555) 567-8901",
      email: "info@globalinvestments.com",
      website: "https://globalinvestments.com",
      firmId: firm.id,
    },
  });
  console.log("Created client:", client2.name);

  // Create Client Users
  const clientPassword = await hashPassword("Client123!");
  const clientUser1 = await prisma.user.upsert({
    where: { email: "mike.johnson@acmecorp.com" },
    update: {},
    create: {
      email: "mike.johnson@acmecorp.com",
      name: "Mike Johnson",
      passwordHash: clientPassword,
      role: "CLIENT",
      status: "ACTIVE",
      clientId: client1.id,
      title: "CFO",
      phone: "(555) 678-9012",
    },
  });
  console.log("Created client user:", clientUser1.email);

  const clientUser2 = await prisma.user.upsert({
    where: { email: "sarah.wilson@globalinvestments.com" },
    update: {},
    create: {
      email: "sarah.wilson@globalinvestments.com",
      name: "Sarah Wilson",
      passwordHash: clientPassword,
      role: "CLIENT",
      status: "ACTIVE",
      clientId: client2.id,
      title: "Managing Director",
      phone: "(555) 789-0123",
    },
  });
  console.log("Created client user:", clientUser2.email);

  // Assign attorneys to clients
  await prisma.clientUser.upsert({
    where: {
      attorneyId_clientId: {
        attorneyId: attorney1.id,
        clientId: client1.id,
      },
    },
    update: {},
    create: {
      attorneyId: attorney1.id,
      clientId: client1.id,
      isPrimary: true,
    },
  });

  await prisma.clientUser.upsert({
    where: {
      attorneyId_clientId: {
        attorneyId: attorney1.id,
        clientId: client2.id,
      },
    },
    update: {},
    create: {
      attorneyId: attorney1.id,
      clientId: client2.id,
      isPrimary: true,
    },
  });

  await prisma.clientUser.upsert({
    where: {
      attorneyId_clientId: {
        attorneyId: attorney2.id,
        clientId: client1.id,
      },
    },
    update: {},
    create: {
      attorneyId: attorney2.id,
      clientId: client1.id,
      isPrimary: false,
    },
  });

  console.log("Assigned attorneys to clients");

  // Create sample deals
  const deal1 = await prisma.deal.upsert({
    where: { id: "deal-1" },
    update: {},
    create: {
      id: "deal-1",
      name: "Downtown Office Building Acquisition",
      description: "Acquisition of a 20-story Class A office building in downtown Chicago",
      status: "ACTIVE",
      value: 45000000,
      clientId: client1.id,
      createdById: attorney1.id,
      closingDate: new Date("2024-03-15"),
    },
  });
  console.log("Created deal:", deal1.name);

  const deal2 = await prisma.deal.upsert({
    where: { id: "deal-2" },
    update: {},
    create: {
      id: "deal-2",
      name: "Industrial Park Development",
      description: "Development of a 500,000 sq ft industrial park in the suburbs",
      status: "PENDING",
      value: 28000000,
      clientId: client2.id,
      createdById: attorney1.id,
      closingDate: new Date("2024-06-01"),
    },
  });
  console.log("Created deal:", deal2.name);

  // Create sample tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Review Purchase Agreement",
        description: "Complete review of the purchase agreement and provide comments",
        status: "IN_PROGRESS",
        priority: "HIGH",
        dealId: deal1.id,
        assignedToId: attorney2.id,
        createdById: attorney1.id,
        dueDate: new Date("2024-02-01"),
      },
      {
        title: "Title Search",
        description: "Order and review title search report",
        status: "TODO",
        priority: "HIGH",
        dealId: deal1.id,
        assignedToId: attorney2.id,
        createdById: attorney1.id,
        dueDate: new Date("2024-02-05"),
      },
      {
        title: "Environmental Due Diligence",
        description: "Review Phase I environmental report",
        status: "TODO",
        priority: "MEDIUM",
        dealId: deal1.id,
        createdById: attorney1.id,
        dueDate: new Date("2024-02-10"),
      },
      {
        title: "Zoning Verification",
        description: "Verify current zoning and permitted uses",
        status: "TODO",
        priority: "MEDIUM",
        dealId: deal2.id,
        assignedToId: attorney1.id,
        createdById: attorney1.id,
        dueDate: new Date("2024-03-01"),
      },
    ],
    skipDuplicates: true,
  });
  console.log("Created sample tasks");

  console.log("\n========================================");
  console.log("Seed completed successfully!");
  console.log("========================================\n");
  console.log("Test Credentials:");
  console.log("----------------------------------------");
  console.log("Admin:    admin@dealpilot.com / Admin123!");
  console.log("Attorney: john.smith@dealpilot.com / Attorney123!");
  console.log("Attorney: jane.doe@dealpilot.com / Attorney123!");
  console.log("Client:   mike.johnson@acmecorp.com / Client123!");
  console.log("Client:   sarah.wilson@globalinvestments.com / Client123!");
  console.log("----------------------------------------\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
