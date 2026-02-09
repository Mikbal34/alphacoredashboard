import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Cleaning all tables...")

  // Delete in FK dependency order (children first)
  await prisma.taskLabel.deleteMany()
  await prisma.taskComment.deleteMany()
  await prisma.task.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.category.deleteMany()
  await prisma.label.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.reportSchedule.deleteMany()
  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  console.log("All tables cleaned.")

  // Create users
  const ikbal = await prisma.user.create({
    data: {
      name: "Muhammet İkbal Köç",
      email: "ikbal80koc@gmail.com",
      hashedPassword: await bcrypt.hash("admin123", 12),
    },
  })

  const eymen = await prisma.user.create({
    data: {
      name: "Abdulmelik Eymen Alpat",
      email: "eymenalpat0@gmail.com",
      hashedPassword: await bcrypt.hash("admin123", 12),
    },
  })

  // Create categories
  const incomeCategories = [
    { name: "Müşteri Ödemesi", type: "INCOME" as const, color: "#22c55e", icon: "banknote" },
    { name: "Danışmanlık", type: "INCOME" as const, color: "#3b82f6", icon: "briefcase" },
    { name: "Abonelik Geliri", type: "INCOME" as const, color: "#8b5cf6", icon: "repeat" },
    { name: "Diğer Gelir", type: "INCOME" as const, color: "#06b6d4", icon: "plus-circle" },
  ]

  const expenseCategories = [
    { name: "Kira", type: "EXPENSE" as const, color: "#ef4444", icon: "home" },
    { name: "Maaş", type: "EXPENSE" as const, color: "#f97316", icon: "users" },
    { name: "Yazılım Lisansları", type: "EXPENSE" as const, color: "#eab308", icon: "code" },
    { name: "Ofis Giderleri", type: "EXPENSE" as const, color: "#ec4899", icon: "building" },
    { name: "Pazarlama", type: "EXPENSE" as const, color: "#14b8a6", icon: "megaphone" },
    { name: "Diğer Gider", type: "EXPENSE" as const, color: "#6b7280", icon: "minus-circle" },
  ]

  const createdCategories = []
  for (const cat of [...incomeCategories, ...expenseCategories]) {
    const created = await prisma.category.create({ data: cat })
    createdCategories.push(created)
  }

  // Create labels
  const labels = [
    { name: "Acil", color: "#ef4444" },
    { name: "Hata", color: "#f97316" },
    { name: "Geliştirme", color: "#3b82f6" },
    { name: "Tasarım", color: "#8b5cf6" },
    { name: "Dokümantasyon", color: "#06b6d4" },
    { name: "İyileştirme", color: "#22c55e" },
  ]

  for (const label of labels) {
    await prisma.label.create({ data: label })
  }

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: "Web Sitesi Yenileme",
      description: "Şirket web sitesinin yeniden tasarlanması ve geliştirilmesi",
      status: "ACTIVE",
      color: "#3b82f6",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      members: {
        create: [
          { userId: ikbal.id, role: "OWNER" },
          { userId: eymen.id, role: "MEMBER" },
        ],
      },
    },
  })

  // Create sample tasks
  const tasks = [
    { title: "Tasarım prototipi hazırla", status: "DONE" as const, priority: "HIGH" as const, order: 0 },
    { title: "Ana sayfa geliştirmesi", status: "IN_PROGRESS" as const, priority: "HIGH" as const, order: 1 },
    { title: "API entegrasyonu", status: "TODO" as const, priority: "MEDIUM" as const, order: 2 },
    { title: "Mobil uyumluluk testleri", status: "BACKLOG" as const, priority: "LOW" as const, order: 3 },
    { title: "SEO optimizasyonu", status: "BACKLOG" as const, priority: "MEDIUM" as const, order: 4 },
  ]

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        ...task,
        projectId: project.id,
        creatorId: ikbal.id,
        assigneeId: eymen.id,
      },
    })
  }

  // Create sample transactions
  const now = new Date()

  const sampleTransactions = [
    { type: "INCOME" as const, amount: 50000, description: "Proje A - İlk ödeme", daysAgo: 2, catName: "Müşteri Ödemesi" },
    { type: "INCOME" as const, amount: 25000, description: "Danışmanlık hizmeti", daysAgo: 5, catName: "Danışmanlık" },
    { type: "EXPENSE" as const, amount: 15000, description: "Ofis kirası - Ocak", daysAgo: 1, catName: "Kira" },
    { type: "EXPENSE" as const, amount: 35000, description: "Maaş ödemeleri", daysAgo: 3, catName: "Maaş" },
    { type: "INCOME" as const, amount: 10000, description: "Abonelik yenileme", daysAgo: 7, catName: "Abonelik Geliri" },
    { type: "EXPENSE" as const, amount: 5000, description: "Yazılım lisansları", daysAgo: 4, catName: "Yazılım Lisansları" },
  ]

  for (const tx of sampleTransactions) {
    const cat = createdCategories.find((c) => c.name === tx.catName)
    if (cat) {
      await prisma.transaction.create({
        data: {
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          date: new Date(now.getTime() - tx.daysAgo * 24 * 60 * 60 * 1000),
          categoryId: cat.id,
          userId: ikbal.id,
        },
      })
    }
  }

  console.log("Seed completed successfully!")
  console.log(`User 1: ikbal80koc@gmail.com / admin123`)
  console.log(`User 2: eymenalpat0@gmail.com / admin123`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
