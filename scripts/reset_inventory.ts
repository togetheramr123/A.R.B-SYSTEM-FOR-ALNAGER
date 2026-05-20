import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Resetting product costs...')
  await prisma.product.updateMany({
    data: { costPrice: 0 }
  })

  console.log('Resetting stock quantities...')
  await prisma.stockQuant.deleteMany({})

  console.log('Resetting valuation layers...')
  await prisma.stockValuationLayer.deleteMany({})

  console.log('Resetting stock moves (optional, doing to ensure clean state)...')
  await prisma.stockMove.deleteMany({})

  console.log('Done!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
