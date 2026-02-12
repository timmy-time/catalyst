import type { PrismaClient } from "@prisma/client";

/**
 * Validates that an API key is active and assigned to the given node.
 */
export async function verifyAgentApiKey(
  prisma: PrismaClient,
  nodeId: string,
  apiKey: string,
): Promise<boolean> {
  if (!nodeId || !apiKey) {
    return false;
  }

  try {
    const apiKeyRecord = await prisma.apikey.findUnique({
      where: { key: apiKey },
    });

    if (!apiKeyRecord || !apiKeyRecord.enabled) {
      return false;
    }

    if (apiKeyRecord.expiresAt && new Date(apiKeyRecord.expiresAt) < new Date()) {
      return false;
    }

    const rawMetadata = apiKeyRecord.metadata as unknown;
    let metadata: Record<string, unknown> | null = null;

    if (rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)) {
      metadata = rawMetadata as Record<string, unknown>;
    } else if (typeof rawMetadata === "string") {
      try {
        const parsed = JSON.parse(rawMetadata) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          metadata = parsed as Record<string, unknown>;
        }
      } catch {
        metadata = null;
      }
    }

    if (!metadata) {
      return false;
    }

    return typeof metadata.nodeId === "string" && metadata.nodeId === nodeId;
  } catch {
    return false;
  }
}
