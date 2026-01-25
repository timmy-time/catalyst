import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { summarizePool } from '../utils/ipam';

export async function adminRoutes(app: FastifyInstance) {
  const prisma = (app as any).prisma || new PrismaClient();
  const authenticate = (app as any).authenticate;
  const isAdminUser = async (userId: string) => {
    const userRoles = await prisma.role.findMany({
      where: {
        users: {
          some: { id: userId },
        },
      },
    });

    const permissions = userRoles.flatMap((role) => role.permissions);
    if (permissions.includes('*') || permissions.includes('admin.read')) {
      return true;
    }

    return userRoles.some((role) => role.name.toLowerCase() === 'administrator');
  };

  // Get system-wide stats
  app.get(
    '/stats',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      // Check if user has admin permissions (wildcard or admin.read)
      const userRoles = await prisma.role.findMany({
        where: {
          users: {
            some: { id: user.userId },
          },
        },
      });

      const permissions = userRoles.flatMap((role) => role.permissions);
      const isAdmin = permissions.includes('*') || permissions.includes('admin.read');

      if (!isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      // Get system statistics
      const [userCount, serverCount, nodeCount, activeServers] = await Promise.all([
        prisma.user.count(),
        prisma.server.count(),
        prisma.node.count(),
        prisma.server.count({ where: { status: 'running' } }),
      ]);

      reply.send({
        users: userCount,
        servers: serverCount,
        nodes: nodeCount,
        activeServers,
      });
    }
  );

  // Get all users (admin only)
  app.get(
    '/users',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      // Check admin permissions
      const userRoles = await prisma.role.findMany({
        where: {
          users: {
            some: { id: user.userId },
          },
        },
      });

      const permissions = userRoles.flatMap((role) => role.permissions);
      const isAdmin = permissions.includes('*') || permissions.includes('admin.read');

      if (!isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { page = 1, limit = 20 } = request.query as {
        page?: number;
        limit?: number;
      };

      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: Number(limit),
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            updatedAt: true,
            roles: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.user.count(),
      ]);

      reply.send({
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    }
  );

  // Get all nodes with details (admin only)
  app.get(
    '/nodes',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      // Check admin permissions
      const userRoles = await prisma.role.findMany({
        where: {
          users: {
            some: { id: user.userId },
          },
        },
      });

      const permissions = userRoles.flatMap((role) => role.permissions);
      const isAdmin = permissions.includes('*') || permissions.includes('admin.read');

      if (!isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const nodes = await prisma.node.findMany({
        include: {
          location: true,
          servers: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              servers: true,
            },
          },
        },
      });

      reply.send({ nodes });
    }
  );

  // Get all servers across nodes (admin only)
  app.get(
    '/servers',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      // Check admin permissions
      const userRoles = await prisma.role.findMany({
        where: {
          users: {
            some: { id: user.userId },
          },
        },
      });

      const permissions = userRoles.flatMap((role) => role.permissions);
      const isAdmin = permissions.includes('*') || permissions.includes('admin.read');

      if (!isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { page = 1, limit = 20, status } = request.query as {
        page?: number;
        limit?: number;
        status?: string;
      };

      const skip = (Number(page) - 1) * Number(limit);

      const where = status ? { status } : {};

      const [servers, total] = await Promise.all([
        prisma.server.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            node: {
              select: {
                id: true,
                name: true,
                hostname: true,
              },
            },
            template: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        }),
        prisma.server.count({ where }),
      ]);

      reply.send({
        servers,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    }
  );

  // Get audit logs (admin only)
  app.get(
    '/audit-logs',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      // Check admin permissions
      const userRoles = await prisma.role.findMany({
        where: {
          users: {
            some: { id: user.userId },
          },
        },
      });

      const permissions = userRoles.flatMap((role) => role.permissions);
      const isAdmin = permissions.includes('*') || permissions.includes('admin.read');

      if (!isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const {
        page = 1,
        limit = 50,
        userId,
        action,
        resource,
      } = request.query as {
        page?: number;
        limit?: number;
        userId?: string;
        action?: string;
        resource?: string;
      };

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (userId) where.userId = userId;
      if (action) where.action = { contains: action };
      if (resource) where.resource = resource;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: Number(limit),
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
          orderBy: {
            timestamp: 'desc',
          },
        }),
        prisma.auditLog.count({ where }),
      ]);

      reply.send({
        logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    }
  );

  // System health check (admin only)
  app.get(
    '/health',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      // Check admin permissions
      const userRoles = await prisma.role.findMany({
        where: {
          users: {
            some: { id: user.userId },
          },
        },
      });

      const permissions = userRoles.flatMap((role) => role.permissions);
      const isAdmin = permissions.includes('*') || permissions.includes('admin.read');

      if (!isAdmin) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      // Check database connectivity
      const dbHealthy = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);

      // Check node connectivity
      const nodes = await prisma.node.findMany({
        select: {
          id: true,
          name: true,
          isOnline: true,
          lastHeartbeat: true,
        },
      });

      const onlineNodes = nodes.filter((n) => n.isOnline).length;
      const offlineNodes = nodes.length - onlineNodes;

      // Check for stale nodes (no heartbeat in 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const staleNodes = nodes.filter(
        (n) => n.lastHeartbeat && n.lastHeartbeat < fiveMinutesAgo
      );

      reply.send({
        status: dbHealthy && offlineNodes === 0 ? 'healthy' : 'degraded',
        database: dbHealthy ? 'connected' : 'disconnected',
        nodes: {
          total: nodes.length,
          online: onlineNodes,
          offline: offlineNodes,
          stale: staleNodes.length,
        },
        timestamp: new Date().toISOString(),
      });
    }
  );

  // IPAM: list pools
  app.get(
    '/ip-pools',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      if (!(await isAdminUser(user.userId))) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const pools = await prisma.ipPool.findMany({
        include: {
          node: true,
          allocations: {
            where: { releasedAt: null },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const data = pools.map((pool) => {
        const summary = summarizePool(pool);
        const usedCount = pool.allocations.length;
        const availableCount = Math.max(
          0,
          summary.total - summary.reservedCount - usedCount
        );
        return {
          id: pool.id,
          nodeId: pool.nodeId,
          nodeName: pool.node.name,
          networkName: pool.networkName,
          cidr: pool.cidr,
          gateway: pool.gateway,
          startIp: pool.startIp,
          endIp: pool.endIp,
          reserved: pool.reserved,
          rangeStart: summary.rangeStart,
          rangeEnd: summary.rangeEnd,
          total: summary.total,
          reservedCount: summary.reservedCount,
          usedCount,
          availableCount,
          createdAt: pool.createdAt,
          updatedAt: pool.updatedAt,
        };
      });

      reply.send({ success: true, data });
    }
  );

  // IPAM: create pool
  app.post(
    '/ip-pools',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      if (!(await isAdminUser(user.userId))) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const {
        nodeId,
        networkName,
        cidr,
        gateway,
        startIp,
        endIp,
        reserved,
      } = request.body as {
        nodeId: string;
        networkName: string;
        cidr: string;
        gateway?: string;
        startIp?: string;
        endIp?: string;
        reserved?: string[];
      };

      if (!nodeId || !networkName || !cidr) {
        return reply.status(400).send({ error: 'nodeId, networkName, and cidr are required' });
      }

      const node = await prisma.node.findUnique({ where: { id: nodeId } });
      if (!node) {
        return reply.status(404).send({ error: 'Node not found' });
      }

      try {
        summarizePool({
          cidr,
          startIp: startIp || null,
          endIp: endIp || null,
          gateway: gateway || null,
          reserved: reserved || [],
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }

      const pool = await prisma.ipPool.create({
        data: {
          nodeId,
          networkName,
          cidr,
          gateway: gateway || null,
          startIp: startIp || null,
          endIp: endIp || null,
          reserved: reserved || [],
        },
      });

      reply.status(201).send({ success: true, data: pool });
    }
  );

  // IPAM: update pool
  app.put(
    '/ip-pools/:poolId',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      if (!(await isAdminUser(user.userId))) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { poolId } = request.params as { poolId: string };

      const pool = await prisma.ipPool.findUnique({
        where: { id: poolId },
      });

      if (!pool) {
        return reply.status(404).send({ error: 'IP pool not found' });
      }

      const {
        cidr,
        gateway,
        startIp,
        endIp,
        reserved,
      } = request.body as {
        cidr?: string;
        gateway?: string | null;
        startIp?: string | null;
        endIp?: string | null;
        reserved?: string[];
      };

      try {
        summarizePool({
          cidr: cidr ?? pool.cidr,
          startIp: startIp ?? pool.startIp,
          endIp: endIp ?? pool.endIp,
          gateway: gateway ?? pool.gateway,
          reserved: reserved ?? pool.reserved,
        });
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }

      const updated = await prisma.ipPool.update({
        where: { id: poolId },
        data: {
          cidr: cidr ?? pool.cidr,
          gateway: gateway ?? pool.gateway,
          startIp: startIp ?? pool.startIp,
          endIp: endIp ?? pool.endIp,
          reserved: reserved ?? pool.reserved,
        },
      });

      reply.send({ success: true, data: updated });
    }
  );

  // IPAM: delete pool
  app.delete(
    '/ip-pools/:poolId',
    { preHandler: authenticate },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;

      if (!(await isAdminUser(user.userId))) {
        return reply.status(403).send({ error: 'Admin access required' });
      }

      const { poolId } = request.params as { poolId: string };

      const activeAllocations = await prisma.ipAllocation.count({
        where: { poolId, releasedAt: null },
      });

      if (activeAllocations > 0) {
        return reply.status(409).send({
          error: 'Pool has active allocations',
        });
      }

      await prisma.ipPool.delete({ where: { id: poolId } });

      reply.send({ success: true });
    }
  );
}
