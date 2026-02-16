import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 1. Set all existing users to ADMIN
  const users = await prisma.user.findMany()
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ADMIN" },
    })
    console.log(`User ${user.name} (${user.email}) -> ADMIN`)
  }

  // 2. Add missing users to all projects as MEMBER
  const projects = await prisma.project.findMany({
    include: { members: true },
  })

  for (const project of projects) {
    const existingUserIds = new Set(project.members.map((m) => m.userId))

    for (const user of users) {
      if (!existingUserIds.has(user.id)) {
        await prisma.projectMember.create({
          data: {
            projectId: project.id,
            userId: user.id,
            role: "MEMBER",
          },
        })
        console.log(`Added ${user.name} to project "${project.name}" as MEMBER`)
      }
    }
  }

  console.log("\nFix completed!")
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
