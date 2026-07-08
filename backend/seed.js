const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default categories...');
  
  const categories = [
    { name: 'Product Sales', type: 'income' },
    { name: 'Service Retainer', type: 'income' },
    { name: 'Consulting Fees', type: 'income' },
    { name: 'Software License', type: 'income' },
    { name: 'Equipment', type: 'expense' },
    { name: 'Rent', type: 'expense' },
    { name: 'Marketing', type: 'expense' },
    { name: 'Supplies', type: 'expense' },
    { name: 'Software', type: 'expense' },
    { name: 'Utilities', type: 'expense' },
  ];

  for (const cat of categories) {
    const exists = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type }
    });
    
    if (!exists) {
      await prisma.category.create({
        data: cat
      });
      console.log(`Created category: ${cat.name} (${cat.type})`);
    }
  }
  
  console.log('Seeding completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
