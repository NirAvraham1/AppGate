import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import { User, Project, Directive } from './models/index.js';
import { hashApiKey } from './middleware/auth.js';

const DEMO_KEY = 'ag_live_demo_key_12345';

export async function seedIfEmpty() {
  if (await User.countDocuments() > 0) return;
  const user = await User.create({
    email: 'admin@appgate.dev',
    passwordHash: await bcrypt.hash('admin123', 10),
    name: 'ניר אברהם',
  });
  const project = await Project.create({
    name: 'MyShopApp',
    apiKeyHash: hashApiKey(DEMO_KEY),
    apiKeyPrefix: DEMO_KEY.slice(0, 12) + '…',
    storeUrl: 'https://play.google.com/store/apps/details?id=dev.appgate.demo',
    ownerUserId: user._id,
  });
  await Directive.create({
    projectId: project._id,
    versionPolicy: { min: 0, soft: 0, url: 'https://play.google.com/store/apps/details?id=dev.appgate.demo' },
    features: { payments: { enabled: true, msg: 'התשלומים יחזרו בקרוב — אנחנו על זה' }, chat: { enabled: true, msg: 'הצ׳אט בתחזוקה קצרה' } },
  });
  console.log('--------------------------------------------------');
  console.log('Seed complete:');
  console.log('  Portal login : admin@appgate.dev / admin123');
  console.log('  Demo API key :', DEMO_KEY);
  console.log('--------------------------------------------------');
}

// run directly: `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  connectDB().then(seedIfEmpty).then(() => mongoose.disconnect());
}
