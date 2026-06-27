import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';
import { startAggregatorJob } from './services/aggregator.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/v1', publicRoutes);          // devices (API key)
app.use('/v1/admin', adminRoutes);     // portal (JWT)

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error' });
});

const PORT = process.env.PORT || 4000;
connectDB().then(async () => {
  if (process.env.MEMORY_DB === 'true') {
    const { seedIfEmpty } = await import('./seed.js');
    await seedIfEmpty();
  }
  startAggregatorJob();
  app.listen(PORT, () => console.log(`[server] AppGate listening on :${PORT}`));
});
