const prisma = require('../prismaClient');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { user_id: req.user.id },
          { is_global: true, stock: { gt: 0 } }
        ]
      },
      include: {
        user: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving products' });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, category, cost_price, retail_price, stock, description, image_url, is_digital, is_global } = req.body;
    
    const product = await prisma.product.create({
      data: {
        user_id: req.user.id,
        name,
        category: category || 'General',
        cost_price: parseFloat(cost_price || 0),
        retail_price: parseFloat(retail_price || 0),
        stock: parseInt(stock || 0),
        description: description || null,
        image_url: image_url || null,
        is_digital: is_digital !== undefined ? is_digital : true,
        is_global: is_global !== undefined ? is_global : true
      }
    });
    
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating product' });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, stock, retail_price } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ message: 'Akses ditolak' });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existing.name,
        description: description !== undefined ? description : existing.description,
        stock: stock !== undefined ? parseInt(stock) : existing.stock,
        retail_price: retail_price !== undefined ? parseFloat(retail_price) : existing.retail_price
      }
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ message: 'Akses ditolak' });

    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

// Buy a product (reduce stock and create purchase record)
exports.buyProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await prisma.$transaction(async (prisma) => {
      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) throw new Error('Produk tidak ditemukan');
      if (existing.stock <= 0) throw new Error('Stok produk sudah habis');

      const updated = await prisma.product.update({
        where: { id },
        data: {
          stock: { decrement: 1 }
        }
      });

      const purchase = await prisma.purchase.create({
        data: {
          user_id: req.user.id,
          po_number: `PO-DIG-${Date.now()}`,
          date: new Date(),
          supplier_id: null,
          total_amount: existing.retail_price,
          status: 'Completed',
          items: {
            create: [{
              product_id: existing.id,
              qty: 1,
              cost_price: existing.retail_price,
              subtotal: existing.retail_price
            }]
          }
        }
      });

      // Buat rekaman penjualan (Invoice) untuk penjual jika produk memiliki pemilik
      if (existing.user_id) {
        await prisma.invoice.create({
          data: {
            user_id: existing.user_id,
            invoice_number: `INV-DIG-${Date.now()}`,
            customer_id: null, // Pembeli dari katalog digital tidak selalu ada di CRM
            total: existing.retail_price,
            status: 'Paid',
            items: {
              create: [{
                product_id: existing.id,
                qty: 1,
                price: existing.retail_price,
                subtotal: existing.retail_price
              }]
            }
          }
        });
      }

      return updated;
    });

    res.json({ message: 'Berhasil membeli produk', product: result });
  } catch (err) {
    console.error(err);
    if (err.message === 'Produk tidak ditemukan' || err.message === 'Stok produk sudah habis') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error buying product' });
  }
};

// Get product stats for owner
exports.getProductStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        purchase_items: true
      }
    });

    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (product.user_id !== req.user.id) return res.status(403).json({ message: 'Akses ditolak' });

    const total_sold = product.purchase_items.reduce((sum, item) => sum + item.qty, 0);
    const total_revenue = product.purchase_items.reduce((sum, item) => sum + Number(item.subtotal), 0);

    res.json({
      product,
      stats: {
        total_sold,
        total_revenue
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving product stats' });
  }
};

// Adjust stock safely
exports.adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { qty } = req.body; 

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ message: 'Produk tidak ditemukan' });
    if (existing.user_id !== req.user.id) return res.status(403).json({ message: 'Akses ditolak' });

    // Validate that new stock doesn't go below zero
    if (existing.stock + parseInt(qty) < 0) {
      return res.status(400).json({ message: 'Stok tidak bisa kurang dari 0' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        stock: { increment: parseInt(qty) }
      }
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adjusting stock' });
  }
};
