-- CreateTable
CREATE TABLE "IpPool" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "networkName" TEXT NOT NULL,
    "cidr" TEXT NOT NULL,
    "gateway" TEXT,
    "startIp" TEXT,
    "endIp" TEXT,
    "reserved" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpAllocation" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "serverId" TEXT,
    "ip" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "IpAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IpPool_nodeId_networkName_key" ON "IpPool"("nodeId", "networkName");

-- CreateIndex
CREATE UNIQUE INDEX "IpAllocation_serverId_key" ON "IpAllocation"("serverId");

-- CreateIndex
CREATE INDEX "IpAllocation_serverId_idx" ON "IpAllocation"("serverId");

-- CreateIndex
CREATE UNIQUE INDEX "IpAllocation_poolId_ip_key" ON "IpAllocation"("poolId", "ip");

-- AddForeignKey
ALTER TABLE "IpPool" ADD CONSTRAINT "IpPool_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpAllocation" ADD CONSTRAINT "IpAllocation_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "IpPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IpAllocation" ADD CONSTRAINT "IpAllocation_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Server"("id") ON DELETE CASCADE ON UPDATE CASCADE;

