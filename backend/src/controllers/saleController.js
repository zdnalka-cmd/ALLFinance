const prisma = require('../prismaClient');

// Get all sales (Invoices)
exports.getSales = async (req, res) => {
  try {
    const sales = await prisma.invoice.findMany({
      where: { user_id: req.user.id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving sales' });
  }
};

// Create a new sale
exports.createSale = async (req, res) => {
  const { invoice_number, customer_id, total, status, due_date, items } = req.body;
  
  try {
    // Start a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // 1. Create the invoice
      const sale = await prisma.invoice.create({
        data: {
          user_id: req.user.id,
          invoice_number,
          customer_id,
          total: parseFloat(total),
          status,
          due_date: due_date ? new Date(due_date) : null,
          items: {
            create: items.map(item => ({
              product_id: item.product_id,
              qty: parseInt(item.qty),
              price: parseFloat(item.price),
              subtotal: parseFloat(item.subtotal)
            }))
          }
        },
        include: {
          customer: true,
          items: true
        }
      });

      // 2. Reduce stock for each product (only if status is Paid or maybe any status that means items are given)
      // Assuming any created sale reserves or reduces the stock. Let's say all statuses reduce stock for now.
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.product_id },
          data: {
            stock: {
              decrement: parseInt(item.qty)
            }
          }
        });
      }

      // 3. Create Notification
      await prisma.notification.create({
        data: {
          user_id: req.user.id,
          message: `Barang telah terjual! Invoice ${sale.invoice_number} senilai Rp ${sale.total.toLocaleString('id-ID')}`,
          type: 'sale'
        }
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating sale' });
  }
};
