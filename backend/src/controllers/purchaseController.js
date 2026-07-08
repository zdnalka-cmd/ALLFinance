const prisma = require('../prismaClient');

// Get all purchases
exports.getPurchases = async (req, res) => {
  try {
    const purchases = await prisma.purchase.findMany({
      where: { user_id: req.user.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(purchases);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving purchases' });
  }
};

// Create a new purchase
exports.createPurchase = async (req, res) => {
  const { po_number, date, supplier_id, total_amount, status, items } = req.body;
  
  try {
    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create the purchase
      const purchase = await prisma.purchase.create({
        data: {
          user_id: req.user.id,
          po_number,
          date: new Date(date),
          supplier_id,
          total_amount: parseFloat(total_amount),
          status,
          items: {
            create: items.map(item => ({
              product_id: item.product_id,
              qty: parseInt(item.qty),
              cost_price: parseFloat(item.cost_price),
              subtotal: parseFloat(item.subtotal)
            }))
          }
        },
        include: {
          supplier: true,
          items: true
        }
      });

      // 2. Update stock for each product if status is Completed
      if (status === 'Completed') {
        for (const item of items) {
          await prisma.product.update({
            where: { id: item.product_id },
            data: {
              stock: {
                increment: parseInt(item.qty)
              }
            }
          });
        }
      }

      return purchase;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating purchase' });
  }
};
