const prisma = require('./src/prismaClient');
async function run() {
  try {
    const categories = await prisma.category.findMany({
      take: 1
    });
    console.log("Success:", categories);
  } catch (e) {
    console.error("Prisma Error:", e);
  }
}
run();
