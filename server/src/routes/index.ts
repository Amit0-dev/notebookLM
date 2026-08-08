import type { Express } from "express";
import { workspaceRoutes } from "./workspace.routes.js";
import { sourceRoutes } from "./source.routes.js";
import { chatRoutes, conversationRoutes } from "./chat.routes.js";
import { artifactRoutes } from "./artifact.routes.js";
import { memoryRoutes } from "./memory.routes.js";

export function registerRoutes(app: Express) {
    workspaceRoutes.use("/:workspaceId/sources", sourceRoutes)
    workspaceRoutes.use("/:workspaceId/conversations", conversationRoutes);
    workspaceRoutes.use("/:workspaceId/chat", chatRoutes);
    workspaceRoutes.use("/:workspaceId/artifacts", artifactRoutes);
    app.use("/api/v1/workspace", workspaceRoutes)
    app.use("/api/memory", memoryRoutes);
}