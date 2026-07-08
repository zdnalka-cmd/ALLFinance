const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  try {
    // Get the first user
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.log('No user found in the database. Nothing to migrate.');
      return;
    }

    const userId = firstUser.id;
    console.log(`Migrating data to User ID: ${userId} (${firstUser.name})`);

    // Assign user_id to all tables
    const results = await Promise.all([
      prisma.customer.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.supplier.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.category.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.income.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.expense.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.invoice.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.receivable.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.payable.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.product.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
      prisma.purchase.updateMany({ where: { user_id: null }, data: { user_id: userId } }),
    ]);

    console.log('Migration complete. Rows updated:', results.map(r => r.count));
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateData();
