import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const nodes = await prisma.node.findMany();
  const servers = await prisma.server.findMany();
  console.log('Nodes:', nodes.length);
  console.log('Servers:', servers.length);
  await prisma.$disconnect();
}

main();
