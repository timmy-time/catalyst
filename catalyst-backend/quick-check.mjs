import { prisma } from './src/db.js';

const nodes = await prisma.node.count();
const servers = await prisma.server.count();
const users = await prisma.user.count();

console.log('Database contents:');
console.log('- Nodes:', nodes);
console.log('- Servers:', servers);  
console.log('- Users:', users);

await prisma.$disconnect();
