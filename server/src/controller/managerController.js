import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();



// ------------------------------------------------------------------
// Support Queries
// ------------------------------------------------------------------

export const GetAllSupportQueries = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) {
      const allowed = ["open", "in_progress", "resolved"];
      if (!allowed.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      where.status = req.query.status;
    }
    const queries = await prisma.supportQuery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
        responses: { orderBy: { createdAt: "asc" } }
      },
    });

    return res.status(200).json(queries);
  } catch (err) {
    next(err);
  }
};

export const GetStudentSupportQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: "Authentication required" });

    const studentId = req.user.id;
    const queries = await prisma.supportQuery.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
        responses: { orderBy: { createdAt: "asc" } }
      },
    });
    return res.status(200).json(queries);
  } catch (err) {
    next(err);
  }
};

export const UpdateSupportQueryStatus = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;

    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status value" });

    const updated = await prisma.supportQuery.update({
      where: { id: queryId },
      data: { status },
      include: {
        student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
        responses: { orderBy: { createdAt: "asc" } }
      },
    });

    return res.status(200).json({ message: "Support query status updated", query: updated });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Support query not found" });
    next(err);
  }
};

export const AddSupportQueryResponse = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { message } = req.body;
    const adminId = req.user?.id; // Get admin ID from auth middleware

    if (!message || String(message).trim() === "") {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    // Check if query exists
    const existing = await prisma.supportQuery.findUnique({
      where: { id: queryId }
    });

    if (!existing) {
      return res.status(404).json({ message: "Support query not found" });
    }

    // Create response record in database
    const newResponse = await prisma.supportResponse.create({
      data: {
        queryId: queryId,
        senderType: "ADMIN",
        senderId: adminId,
        responder: "Support Team",
        message: String(message).trim()
      }
    });

    // Update query status to in_progress
    const updated = await prisma.supportQuery.update({
      where: { id: queryId },
      data: { 
        status: "in_progress"
      },
      include: {
        student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
        responses: { orderBy: { createdAt: "asc" } }
      }
    });

    return res.status(201).json({ 
      message: "Response sent successfully", 
      response: newResponse,
      query: updated 
    });
  } catch (err) {
    console.error("Error in AddSupportQueryResponse:", err);
    next(err);
  }
};

export const DeleteSupportQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    await prisma.supportQuery.delete({ where: { id: queryId } });
    return res.status(200).json({ message: "Support query deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Support query not found" });
    next(err);
  }
};
