import express from 'express';
import { createServer as createViteServer } from 'vite';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import axios from 'axios';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure we use an absolute path for the SQLite database to prevent corruption and resolution issues
const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
if (!process.env.PRISMA_DATABASE_URL || process.env.PRISMA_DATABASE_URL.includes('./')) {
  process.env.PRISMA_DATABASE_URL = `file:${dbPath}`;
}

console.log(`Using database at: ${process.env.PRISMA_DATABASE_URL}`);

const prisma = new PrismaClient();
const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// --- Middleware ---

// Mock Auth Middleware (In a real app, use JWT or Session)
const authenticate = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('Auth failed: No authorization header');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // For demo, we'll assume the header is the user ID
    const user = await prisma.user.findUnique({ where: { id: authHeader } });
    if (!user) {
      console.log(`Auth failed: User not found for ID ${authHeader}`);
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

// API Key Middleware for Resellers
const authenticateApiKey = async (req: any, res: any, next: any) => {
  const apiKey = req.query.key || req.headers['x-api-key'];
  if (!apiKey) return res.status(401).json({ error: 'API Key required' });

  const user = await prisma.user.findUnique({ where: { apiKey: String(apiKey) } });
  if (!user) return res.status(401).json({ error: 'Invalid API Key' });

  req.user = user;
  next();
};

// --- API Routes ---

// Auth Sync
app.post('/api/auth/sync', async (req: any, res: any) => {
  const { id, email, displayName, role } = req.body;
  console.log(`Syncing user: ${email} (${id})`);
  try {
    const user = await prisma.user.upsert({
      where: { id },
      update: { email, displayName, role },
      create: { id, email, displayName, role, password: 'firebase-auth' }
    });
    console.log(`User synced successfully: ${email}`);
    res.json(user);
  } catch (error) {
    console.error('Failed to sync user:', error);
    res.status(500).json({ error: 'Failed to sync user' });
  }
});

app.get('/api/services', async (req: any, res: any) => {
  try {
    const services = await prisma.service.findMany({
      where: { active: true },
      include: { category: true }
    });
    res.json(services.map(s => ({
      ...s,
      category: s.category.name,
      rate: s.rate / 100
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Providers
app.get('/api/admin/providers', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const providers = await prisma.provider.findMany();
  res.json(providers);
});

app.post('/api/admin/providers', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const provider = await prisma.provider.create({ data: req.body });
  res.json(provider);
});

app.put('/api/admin/providers/:id', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const provider = await prisma.provider.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(provider);
});

app.delete('/api/admin/providers/:id', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await prisma.provider.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Services
app.get('/api/admin/services', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const services = await prisma.service.findMany({ 
    include: { 
      provider: true,
      category: true
    } 
  });
  res.json(services.map(s => ({
    ...s,
    category: s.category.name,
    rate: s.rate / 100
  })));
});

// Admin Data
app.get('/api/admin/transactions', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const transactions = await prisma.transaction.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(transactions);
});

app.post('/api/admin/transactions/:id/approve', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: req.params.id }
      });

      if (!transaction || transaction.status !== 'pending') {
        throw new Error('Transaction not found or already processed');
      }

      // Update transaction status
      const updatedTx = await tx.transaction.update({
        where: { id: req.params.id },
        data: { status: 'completed' }
      });

      // Credit user balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: { balance: { increment: transaction.amount } }
      });

      return updatedTx;
    });

    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/admin/seed', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  try {
    const categories = ['Instagram', 'YouTube', 'TikTok', 'Facebook'];
    const createdCategories = [];

    for (const name of categories) {
      const cat = await prisma.category.upsert({
        where: { name },
        update: {},
        create: { name }
      });
      createdCategories.push(cat);
    }

    const services = [
      { name: 'Instagram Followers [Real]', categoryName: 'Instagram', rate: 150, min: 100, max: 10000, description: 'High quality real followers' },
      { name: 'Instagram Likes [Fast]', categoryName: 'Instagram', rate: 50, min: 50, max: 5000, description: 'Instant delivery' },
      { name: 'YouTube Views [Non-Drop]', categoryName: 'YouTube', rate: 320, min: 500, max: 50000, description: 'Lifetime guarantee' },
      { name: 'TikTok Followers', categoryName: 'TikTok', rate: 80, min: 100, max: 20000, description: 'Global followers' },
    ];

    for (const s of services) {
      const cat = createdCategories.find(c => c.name === s.categoryName);
      if (cat) {
        await prisma.service.create({
          data: {
            name: s.name,
            categoryId: cat.id,
            rate: s.rate,
            min: s.min,
            max: s.max,
            description: s.description,
            active: true
          }
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin/orders', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const orders = await prisma.order.findMany({
    include: { user: true, service: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

app.put('/api/admin/orders/:id', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status: req.body.status }
  });
  res.json(order);
});

// User Data
app.get('/api/user/orders', authenticate, async (req: any, res: any) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(orders);
});

app.get('/api/user/profile', authenticate, async (req: any, res: any) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json(user);
});

app.get('/api/user/transactions', authenticate, async (req: any, res: any) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' }
  });
  res.json(transactions);
});

app.post('/api/user/transactions', authenticate, async (req: any, res: any) => {
  const { amount, type, method, utr } = req.body;
  const transaction = await prisma.transaction.create({
    data: {
      userId: req.user.id,
      amount: Math.round(amount * 100),
      type,
      method,
      utr,
      status: 'pending'
    }
  });
  res.json(transaction);
});

app.post('/api/admin/services', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { categoryId, ...rest } = req.body;
  
  // categoryId in req.body is actually the category name from the frontend
  const category = await prisma.category.upsert({
    where: { name: categoryId },
    update: {},
    create: { name: categoryId }
  });

  const service = await prisma.service.create({ 
    data: {
      ...rest,
      categoryId: category.id
    } 
  });
  res.json(service);
});

app.put('/api/admin/services/:id', authenticate, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { categoryId, ...rest } = req.body;

  let updateData = { ...rest };
  if (categoryId) {
    const category = await prisma.category.upsert({
      where: { name: categoryId },
      update: {},
      create: { name: categoryId }
    });
    updateData.categoryId = category.id;
  }

  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: updateData
  });
  res.json(service);
});

// 1. Upstream API Fulfillment Engine
app.post('/api/orders', authenticate, async (req: any, res: any) => {
  const { serviceId, link, quantity, isDripFeed, runs, interval } = req.body;
  const user = req.user;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get Service
      const service = await tx.service.findUnique({ 
        where: { id: serviceId },
        include: { provider: true }
      });
      if (!service) throw new Error('Service not found');

      // 2. Calculate Charge (Rate is per 1000)
      const totalQuantity = isDripFeed ? (quantity * runs) : quantity;
      const charge = Math.ceil((totalQuantity / 1000) * service.rate);

      // 3. Check Balance
      if (user.balance < charge) throw new Error('Insufficient balance');

      // 4. Deduct Balance & Create Order
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { decrement: charge } }
      });

      const order = await tx.order.create({
        data: {
          userId: user.id,
          serviceId: service.id,
          link,
          quantity,
          charge,
          isDripFeed: !!isDripFeed,
          runs: isDripFeed ? runs : null,
          interval: isDripFeed ? interval : null,
          status: 'pending'
        }
      });

      // 5. Create Transaction Record
      await tx.transaction.create({
        data: {
          userId: user.id,
          amount: charge,
          type: 'charge',
          method: 'Wallet',
          status: 'completed'
        }
      });

      return { order, service };
    });

    // 6. Forward to Upstream Provider (Async)
    const { order, service } = result;
    if (service.provider && service.upstreamServiceId) {
      try {
        const response = await axios.post(service.provider.apiUrl, {
          key: service.provider.apiKey,
          action: 'add',
          service: service.upstreamServiceId,
          link: order.link,
          quantity: order.quantity,
          runs: order.runs,
          interval: order.interval
        });

        if (response.data && response.data.order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              upstreamOrderId: String(response.data.order),
              status: 'processing'
            }
          });
        }
      } catch (apiError) {
        console.error('Upstream API Error:', apiError);
        // In a real app, you might flag this for admin review
      }
    }

    res.json({ success: true, orderId: order.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 2. Mass Orders
app.post('/api/mass-orders', authenticate, async (req: any, res: any) => {
  const { orders } = req.body; // Array of { serviceId, link, quantity }
  const user = req.user;

  // Process concurrently but with a limit or in a queue
  // For demo, we'll process them sequentially to ensure balance integrity
  const results = [];
  for (const orderData of orders) {
    try {
      // Reuse logic or call internal function
      // (Simplified for brevity)
      results.push({ link: orderData.link, status: 'queued' });
    } catch (e) {
      results.push({ link: orderData.link, status: 'failed' });
    }
  }
  res.json({ results });
});

// 3. Reseller API (Standard SMM Structure)
app.get('/api/v2', authenticateApiKey, async (req: any, res: any) => {
  const { action } = req.query;
  const user = req.user;

  switch (action) {
    case 'balance':
      return res.json({ balance: (user.balance / 100).toFixed(2), currency: 'INR' });
    
    case 'services':
      const services = await prisma.service.findMany({ where: { active: true } });
      return res.json(services.map(s => ({
        service: s.id,
        name: s.name,
        type: 'Default',
        category: s.categoryId,
        rate: (s.rate / 100).toFixed(2),
        min: s.min,
        max: s.max
      })));

    case 'add':
      // Similar logic to /api/orders
      return res.json({ order: '12345' });

    case 'status':
      // Simulate progress: 30% chance of being completed, 60% processing, 10% pending
      const statuses = ['pending', 'processing', 'processing', 'processing', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      return res.json({ 
        status: randomStatus,
        charge: '0.10',
        start_count: '100',
        remains: randomStatus === 'completed' ? '0' : '50'
      });

    default:
      res.status(400).json({ error: 'Invalid action' });
  }
});

// --- Background Jobs ---

// Order Status Polling (Every minute for demo)
cron.schedule('* * * * *', async () => {
  console.log('Running Order Status Sync...');
  
  const activeOrders = await prisma.order.findMany({
    where: {
      status: { in: ['pending', 'processing', 'in_progress'] },
      upstreamOrderId: { not: null }
    },
    include: { service: { include: { provider: true } } }
  });

  for (const order of activeOrders) {
    if (!order.service.provider) continue;

    try {
      const response = await axios.get(order.service.provider.apiUrl, {
        params: {
          key: order.service.provider.apiKey,
          action: 'status',
          order: order.upstreamOrderId
        }
      });

      const newStatus = response.data.status?.toLowerCase();
      if (newStatus && newStatus !== order.status) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: order.id },
            data: { status: newStatus }
          });

          // Refund Logic
          if (newStatus === 'canceled' || newStatus === 'partial') {
            const remains = response.data.remains || 0;
            const refundAmount = Math.floor((remains / 1000) * order.service.rate);
            
            if (refundAmount > 0) {
              await tx.user.update({
                where: { id: order.userId },
                data: { balance: { increment: refundAmount } }
              });

              await tx.transaction.create({
                data: {
                  userId: order.userId,
                  amount: refundAmount,
                  type: 'refund',
                  method: 'System',
                  status: 'completed'
                }
              });
            }
          }
        });
      }
    } catch (err) {
      console.error(`Failed to sync order ${order.id}:`, err);
    }
  }
});

// --- Vite & Static Assets ---

async function startServer() {
  try {
    await prisma.$connect();
    await prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL;');
    await prisma.$executeRawUnsafe('PRAGMA synchronous=NORMAL;');
    const integrity: any = await prisma.$queryRawUnsafe('PRAGMA integrity_check');
    console.log('Database integrity check:', integrity);
    if (integrity[0]?.integrity_check !== 'ok') {
      console.error('Database integrity check failed:', integrity);
    }
  } catch (err) {
    console.error('Database connection or integrity check failed:', err);
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
