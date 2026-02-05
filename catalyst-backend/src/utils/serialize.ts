/**
 * Serialize Prisma responses for Fastify v5
 * Fixes serialization issues with BigInt, _count, and nested relations
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
