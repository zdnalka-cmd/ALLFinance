const prisma = require('./src/prismaClient');
async function run() {
  try {
    const incomes = await prisma.income.findMany({
      include: { category: true, customer: true },
      take: 1
    });
    console.log("Success:", incomes);
  } catch (e) {
    console.error("Prisma Error:", e);
  }
}
run();
