import { Router } from "express"
import { asyncHandler } from "../utils/async-handler.js";
import { createConversation, deleteConversation, listConversationMessages, listConversations, streamChat } from "../controllers/chat.controller.js";

export const conversationRoutes = Router({ mergeParams: true });

conversationRoutes.get("/", asyncHandler(listConversations));
conversationRoutes.post("/", asyncHandler(createConversation));
conversationRoutes.get(
    "/:conversationId/messages",
    asyncHandler(listConversationMessages),
);
conversationRoutes.delete(
    "/:conversationId",
    asyncHandler(deleteConversation),
);


export const chatRoutes = Router({ mergeParams: true });

chatRoutes.post("/", asyncHandler(streamChat));