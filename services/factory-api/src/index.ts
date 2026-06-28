import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  IntakeRequestSchema,
  createAuditEvent,
  type AuditEvent,
  type AutomationRequest
} from "@agent-factory/shared-contracts";

const requests = new Map<string, AutomationRequest>();
const auditEvents: AuditEvent[] = [];

export interface FactoryRequestInput {
  method: string;
  pathname: string;
  body?: unknown;
}

export interface FactoryResponseOutput {
  statusCode: number;
  body: unknown;
}

export function createFactoryApiServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://localhost");
      const body = request.method === "POST" ? await readJson(request) : undefined;
      const result = await handleFactoryRequest({
        method: request.method ?? "GET",
        pathname: url.pathname,
        body
      });
      writeJson(response, result.statusCode, result.body);
    } catch (error) {
      writeJson(response, 500, {
        error: "internal_error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}

export async function handleFactoryRequest(input: FactoryRequestInput): Promise<FactoryResponseOutput> {
  if (input.method === "GET" && input.pathname === "/health") {
    return {
      statusCode: 200,
      body: {
      ok: true,
      service: "factory-api",
      requests: requests.size
      }
    };
  }

  if (input.method === "GET" && input.pathname === "/api/requests") {
    return {
      statusCode: 200,
      body: {
        data: [...requests.values()],
        audit: auditEvents
      }
    };
  }

  if (input.method === "POST" && input.pathname === "/api/intake") {
    const intake = IntakeRequestSchema.parse(input.body ?? {});
    const now = new Date().toISOString();
    const id = `req_${randomUUID()}`;

    const automationRequest: AutomationRequest = {
      id,
      intake,
      status: "needs_clarification",
      createdAt: now,
      updatedAt: now
    };

    requests.set(id, automationRequest);
    auditEvents.push(
      createAuditEvent({
        requestId: id,
        actor: "factory-api",
        action: "intake_created",
        summary: `Created intake request: ${intake.title}`
      })
    );

    return {
      statusCode: 201,
      body: {
        data: automationRequest
      }
    };
  }

  return {
    statusCode: 404,
    body: {
      error: "not_found"
    }
  };
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody.length > 0 ? JSON.parse(rawBody) : {};
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*"
  });
  response.end(JSON.stringify(body));
}
