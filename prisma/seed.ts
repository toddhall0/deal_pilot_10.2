import { PrismaClient, DealType, DealStatus, PropertyType, TaskStatus, TaskPriority, MilestoneStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function generateDealNumber(year: number, index: number): string {
  return `DP-${year}-${index.toString().padStart(4, "0")}`;
}

async function main() {
  console.log("Starting seed...");

  // ============================================
  // FIRM
  // ============================================
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

  // ============================================
  // USERS
  // ============================================
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

  // ============================================
  // CLIENTS
  // ============================================
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

  // ============================================
  // CLIENT USERS
  // ============================================
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

  // ============================================
  // ATTORNEY-CLIENT RELATIONSHIPS
  // ============================================
  await prisma.clientUser.upsert({
    where: { attorneyId_clientId: { attorneyId: attorney1.id, clientId: client1.id } },
    update: {},
    create: { attorneyId: attorney1.id, clientId: client1.id, isPrimary: true },
  });

  await prisma.clientUser.upsert({
    where: { attorneyId_clientId: { attorneyId: attorney1.id, clientId: client2.id } },
    update: {},
    create: { attorneyId: attorney1.id, clientId: client2.id, isPrimary: true },
  });

  await prisma.clientUser.upsert({
    where: { attorneyId_clientId: { attorneyId: attorney2.id, clientId: client1.id } },
    update: {},
    create: { attorneyId: attorney2.id, clientId: client1.id, isPrimary: false },
  });
  console.log("Created attorney-client relationships");

  // ============================================
  // DEALS
  // ============================================
  const currentYear = new Date().getFullYear();

  const deal1 = await prisma.deal.upsert({
    where: { dealNumber: generateDealNumber(currentYear, 1) },
    update: {},
    create: {
      name: "Downtown Office Building Acquisition",
      dealNumber: generateDealNumber(currentYear, 1),
      type: DealType.ACQUISITION,
      status: DealStatus.IN_DUE_DILIGENCE,
      propertyName: "One Main Plaza",
      propertyType: PropertyType.OFFICE,
      propertyAddress: "100 Main Street",
      propertyCity: "Chicago",
      propertyState: "IL",
      propertyZip: "60601",
      propertyCounty: "Cook",
      squareFootage: 250000,
      clientId: client1.id,
      createdById: attorney1.id,
    },
  });
  console.log("Created deal:", deal1.name);

  const deal2 = await prisma.deal.upsert({
    where: { dealNumber: generateDealNumber(currentYear, 2) },
    update: {},
    create: {
      name: "Industrial Park Development",
      dealNumber: generateDealNumber(currentYear, 2),
      type: DealType.ACQUISITION,
      status: DealStatus.ACTIVE,
      propertyName: "Westside Industrial Park",
      propertyType: PropertyType.INDUSTRIAL,
      propertyAddress: "500 Industrial Way",
      propertyCity: "Los Angeles",
      propertyState: "CA",
      propertyZip: "90001",
      propertyCounty: "Los Angeles",
      acreage: 50,
      squareFootage: 500000,
      clientId: client2.id,
      createdById: attorney1.id,
    },
  });
  console.log("Created deal:", deal2.name);

  const deal3 = await prisma.deal.upsert({
    where: { dealNumber: generateDealNumber(currentYear, 3) },
    update: {},
    create: {
      name: "Retail Center Disposition",
      dealNumber: generateDealNumber(currentYear, 3),
      type: DealType.DISPOSITION,
      status: DealStatus.PENDING_CLOSING,
      propertyName: "Sunrise Shopping Center",
      propertyType: PropertyType.RETAIL,
      propertyAddress: "200 Commerce Drive",
      propertyCity: "Phoenix",
      propertyState: "AZ",
      propertyZip: "85001",
      propertyCounty: "Maricopa",
      squareFootage: 150000,
      clientId: client1.id,
      createdById: attorney2.id,
    },
  });
  console.log("Created deal:", deal3.name);

  // ============================================
  // TIMELINES & MILESTONES
  // ============================================
  const timeline1 = await prisma.timeline.upsert({
    where: { dealId: deal1.id },
    update: {},
    create: {
      dealId: deal1.id,
    },
  });

  const now = new Date();
  const milestoneData = [
    { name: "Contract Execution", daysOffset: -30, status: MilestoneStatus.COMPLETED },
    { name: "Initial Deposit Due", daysOffset: -25, status: MilestoneStatus.COMPLETED },
    { name: "Due Diligence Period", daysOffset: 15, status: MilestoneStatus.IN_PROGRESS },
    { name: "Title Commitment Review", daysOffset: 7, status: MilestoneStatus.PENDING },
    { name: "Survey Review", daysOffset: 10, status: MilestoneStatus.PENDING },
    { name: "Environmental Review", daysOffset: 12, status: MilestoneStatus.PENDING },
    { name: "Closing", daysOffset: 45, status: MilestoneStatus.PENDING },
  ];

  for (let i = 0; i < milestoneData.length; i++) {
    const m = milestoneData[i];
    const dueDate = new Date(now.getTime() + m.daysOffset * 24 * 60 * 60 * 1000);
    await prisma.milestone.upsert({
      where: { id: `milestone-${deal1.id}-${i + 1}` },
      update: {},
      create: {
        id: `milestone-${deal1.id}-${i + 1}`,
        timelineId: timeline1.id,
        name: m.name,
        dueDate: dueDate,
        status: m.status,
        completedDate: m.status === MilestoneStatus.COMPLETED ? dueDate : null,
        sortOrder: i,
        isAutoGenerated: true,
        sourceType: "CONTRACT",
      },
    });
  }
  console.log("Created timeline and milestones for deal 1");

  // ============================================
  // TASKS
  // ============================================
  const taskData = [
    {
      title: "Review Purchase Agreement",
      description: "Complete review of the purchase agreement and provide comments",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dealId: deal1.id,
      assigneeId: attorney2.id,
      createdById: attorney1.id,
      daysOffset: 3,
    },
    {
      title: "Order Title Search",
      description: "Order and review title search report from title company",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dealId: deal1.id,
      assigneeId: attorney2.id,
      createdById: attorney1.id,
      daysOffset: 5,
    },
    {
      title: "Review Phase I Environmental",
      description: "Review Phase I environmental site assessment report",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dealId: deal1.id,
      assigneeId: null,
      createdById: attorney1.id,
      daysOffset: 10,
    },
    {
      title: "Survey Review",
      description: "Review ALTA survey and identify any encroachments or issues",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dealId: deal1.id,
      assigneeId: attorney1.id,
      createdById: attorney1.id,
      daysOffset: 8,
    },
    {
      title: "Zoning Verification",
      description: "Verify current zoning and permitted uses for the property",
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.MEDIUM,
      dealId: deal2.id,
      assigneeId: attorney1.id,
      createdById: attorney1.id,
      daysOffset: -2,
      completed: true,
    },
    {
      title: "Draft Closing Checklist",
      description: "Prepare comprehensive closing checklist for all parties",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dealId: deal3.id,
      assigneeId: attorney2.id,
      createdById: attorney2.id,
      daysOffset: 2,
    },
  ];

  for (let i = 0; i < taskData.length; i++) {
    const t = taskData[i];
    const dueDate = new Date(now.getTime() + t.daysOffset * 24 * 60 * 60 * 1000);
    await prisma.task.upsert({
      where: { id: `task-${i + 1}` },
      update: {},
      create: {
        id: `task-${i + 1}`,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dealId: t.dealId,
        assigneeId: t.assigneeId,
        createdById: t.createdById,
        dueDate: dueDate,
        completedAt: t.completed ? new Date(now.getTime() + (t.daysOffset + 1) * 24 * 60 * 60 * 1000) : null,
      },
    });
  }
  console.log("Created sample tasks");

  // ============================================
  // DEAL FINANCIALS
  // ============================================
  const financials1 = await prisma.dealFinancials.upsert({
    where: { dealId: deal1.id },
    update: {},
    create: {
      dealId: deal1.id,
      contractPrice: 45000000,
      currentPrice: 45000000,
      dueDiligenceBudget: 150000,
      dueDiligenceSpent: 45000,
      estimatedClosingCosts: 500000,
    },
  });

  await prisma.deposit.upsert({
    where: { id: `deposit-${deal1.id}-1` },
    update: {},
    create: {
      id: `deposit-${deal1.id}-1`,
      financialsId: financials1.id,
      name: "Initial Earnest Money",
      amount: 500000,
      dueDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      status: "PAID",
      paidDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
      paidAmount: 500000,
    },
  });

  await prisma.deposit.upsert({
    where: { id: `deposit-${deal1.id}-2` },
    update: {},
    create: {
      id: `deposit-${deal1.id}-2`,
      financialsId: financials1.id,
      name: "Additional Deposit",
      amount: 1000000,
      dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      status: "SCHEDULED",
      condition: "Due upon expiration of due diligence period",
    },
  });
  console.log("Created deal financials and deposits");

  // ============================================
  // NOTES
  // ============================================
  await prisma.note.upsert({
    where: { id: `note-${deal1.id}-1` },
    update: {},
    create: {
      id: `note-${deal1.id}-1`,
      dealId: deal1.id,
      authorId: attorney1.id,
      title: "Initial Client Meeting Notes",
      content: "Met with client to discuss acquisition strategy. Key concerns include environmental liability and parking requirements. Client wants aggressive timeline for closing.",
      isPinned: true,
      category: "Meeting Notes",
      tags: ["client-meeting", "strategy"],
    },
  });

  await prisma.note.upsert({
    where: { id: `note-${deal1.id}-2` },
    update: {},
    create: {
      id: `note-${deal1.id}-2`,
      dealId: deal1.id,
      authorId: attorney2.id,
      title: "Title Review Findings",
      content: "Initial title review shows easement for utility access on east side of property. Need to verify this does not interfere with planned expansion. Also noted HOA restrictions that may require further review.",
      category: "Due Diligence",
      tags: ["title", "easement"],
    },
  });

  await prisma.note.upsert({
    where: { id: `note-${deal2.id}-1` },
    update: {},
    create: {
      id: `note-${deal2.id}-1`,
      dealId: deal2.id,
      authorId: attorney1.id,
      title: "Zoning Research",
      content: "Property is zoned M-2 Industrial. Permitted uses include manufacturing, warehousing, and distribution. No variances required for intended use.",
      category: "Due Diligence",
      tags: ["zoning", "research"],
    },
  });
  console.log("Created sample notes");

  // ============================================
  // USER PREFERENCES
  // ============================================
  await prisma.userPreferences.upsert({
    where: { userId: attorney1.id },
    update: {},
    create: {
      userId: attorney1.id,
      emailNotifications: true,
      taskReminders: true,
      deadlineAlerts: true,
      notificationFrequency: "DAILY",
      dailySummaryTime: "08:00",
      defaultDealView: "board",
      defaultTaskView: "list",
      timezone: "America/Chicago",
      dateFormat: "MM/dd/yyyy",
    },
  });
  console.log("Created user preferences");

  // ============================================
  // ACTIVITY LOG
  // ============================================
  await prisma.activityLog.create({
    data: {
      userId: attorney1.id,
      dealId: deal1.id,
      action: "CREATED",
      entityType: "DEAL",
      entityId: deal1.id,
      entityName: deal1.name,
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: attorney1.id,
      dealId: deal1.id,
      action: "UPDATED",
      entityType: "DEAL",
      entityId: deal1.id,
      entityName: deal1.name,
      changes: { status: { from: "DRAFT", to: "ACTIVE" } },
      createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: attorney2.id,
      dealId: deal1.id,
      action: "CREATED",
      entityType: "TASK",
      entityId: "task-1",
      entityName: "Review Purchase Agreement",
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });
  console.log("Created activity log entries");

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
