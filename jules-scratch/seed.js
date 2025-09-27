const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log(`Start seeding ...`)
  const tournament = await prisma.tournament.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      name: 'Test Tournament',
    },
  })
  console.log(`Created tournament with id: ${tournament.id}`)
  console.log(`Seeding finished.`)
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