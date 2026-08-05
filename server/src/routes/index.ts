import type { Express } from "express";
import { workspaceRoutes } from "./workspace.routes.js";
import { sourceRoutes } from "./source.routes.js";

export function registerRoutes(app: Express) {
    workspaceRoutes.use("/:workspaceId/sources", sourceRoutes)
    app.use("/api/v1/workspace", workspaceRoutes)
}