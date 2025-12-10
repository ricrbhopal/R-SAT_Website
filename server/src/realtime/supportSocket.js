import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SUPPORT_ROOM = (queryId) => `support:${queryId}`;

export const registerSupportSockets = (io) => {
  io.on("connection", (socket) => {

    socket.on("join_support", ({ queryId }) => {
      if (!queryId) return;
      socket.join(SUPPORT_ROOM(queryId));
      socket.emit("support_joined", { queryId });
    });

    socket.on("support_message", async (payload = {}) => {
      const { queryId, message, senderType = "ADMIN", senderId, responder, clientMessageId } = payload;
      const trimmed = String(message || "").trim();

      if (!queryId || !trimmed) {
        socket.emit("support_error", { queryId, clientMessageId, message: "Missing queryId or message" });
        return;
      }

      try {
        const existing = await prisma.supportQuery.findUnique({
          where: { id: queryId },
          include: {
            student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
          },
        });

        if (!existing) {
          socket.emit("support_error", { queryId, clientMessageId, message: "Support query not found" });
          return;
        }

        const newResponse = await prisma.supportResponse.create({
          data: {
            queryId,
            senderType,
            senderId: senderId || null,
            responder: responder || (senderType === "ADMIN" ? "Support Team" : existing.student?.fullName || "Student"),
            message: trimmed,
          },
        });

        const updated = await prisma.supportQuery.update({
          where: { id: queryId },
          data: {
            status: senderType === "ADMIN" ? "in_progress" : existing.status || "open",
          },
          include: {
            student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
            responses: { orderBy: { createdAt: "asc" } },
          },
        });

        io.to(SUPPORT_ROOM(queryId)).emit("support_message", {
          queryId,
          clientMessageId,
          message: newResponse,
          responses: updated.responses,
          query: updated,
        });
      } catch (err) {
        console.error("[socket] support_message error", err);
        socket.emit("support_error", { queryId, clientMessageId, message: "Failed to send message" });
      }
    });

    socket.on("disconnect", () => {
      console.log("[socket] disconnected", socket.id);
    });
  });
};
