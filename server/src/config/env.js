// server/src/config/env.js
const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGO_URI: z.string().min(10).default('mongodb://localhost:27017/jira_lite'),
  REDIS_URL: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(32).default('super_secret_jwt_access_key_min_32_characters_long_12345'),
  JWT_REFRESH_SECRET: z.string().min(32).default('super_secret_jwt_refresh_key_min_32_characters_long_67890'),
  CLIENT_URL: z
    .string()
    .transform((val) => {
      if (!val) return 'http://localhost:5173';
      return val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`;
    })
    .default('http://localhost:5173'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

module.exports = parsed.data;
