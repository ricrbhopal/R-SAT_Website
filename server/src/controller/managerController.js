import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();




// Support Queries
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





// get user by id controller
export const getAllUsers = async (req, res, next) => {
  try {
    const [users, allDemos] = await Promise.all([
      prisma.student.findMany({
        select: {
          id: true,
          fullName: true,
          mail_ID: true,
          phoneNo: true,
          student_ID: true,
          college: true,
          branch: true,
          year: true,
          dob: true,
          createdAt: true,
          admitCards: true,
          results: true,
          supportQueries: {
            select: {
              id: true,
              subject: true,
              description: true,
              status: true,
              createdAt: true,
              responses: true,
            },
          },
          referrals: {
            select: {
              id: true,
              referrerStudentID: true,
              referredStudentId: true,
              referredName: true,
              referredEmail: true,
              referredPhone: true,
              collegeName: true,
              year: true,
              refCode: true,
              referredDate: true,
            },
          },
        },
      }),
      prisma.demo.findMany(),
    ]);

    // Match demos to students by email or phone
    const usersWithDemos = users.map((user) => {
      const demos = allDemos.filter(
        (demo) =>
          demo.email === user.mail_ID || demo.phone === user.phoneNo
      );
      return { ...user, demos };
    });

    return res.status(200).json(usersWithDemos);
  } catch (err) {
    next(err);
  }
};
export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "Invalid or missing User ID" });

    // Ensure the correct model is used
    const user = await prisma.student.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        mail_ID: true,
        phoneNo: true,
        student_ID: true,
        college: true,
        branch: true,
        year: true,
        dob: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (err) {
    console.error("Error in getUserById:", err);
    next(err);
  }
};






// student referral controllers 
export const getRefferedUsers = async (req, res, next) => {
  try {
    // optional query params: page, limit
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit || "200", 10)));
    const skip = (page - 1) * limit;

    const referredUsers = await prisma.referred.findMany({
      include: {
        // matches your model: student = the student who referred
        student: {
          select: {
            id: true,
            student_ID: true,
            fullName: true,
            mail_ID: true,
            phoneNo: true,
          },
        },
        // caller = Admin / caller who referred
        caller: {
          select: {
            id: true,
            username: true,
            role: true,
            phone: true,
          },
        },
        // referredStudent = the user who actually registered (if any)
        referredStudent: {
          select: {
            id: true,
            student_ID: true,
            fullName: true,
            mail_ID: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });



    // Optionally return total count for pagination
    const total = await prisma.referred.count();

    return res.status(200).json({ data: referredUsers, total });
  } catch (err) {
    console.error("[getRefferedUsers] ERROR:", err);
    next(err);
  }
};
export const getRefferedUserById = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const referredUser = await prisma.referred.findUnique({
      where: { id: referredId },
      include: {
        referrerUser: { select: { student_ID: true, fullName: true, mail_ID: true, phoneNo: true } },
        referrerCaller: { select: { username: true, role: true, phone: true } },
        referredStudent: { select: { student_ID: true, fullName: true, mail_ID: true } },
      },
    });

    if (!referredUser) return res.status(404).json({ message: "Referred user not found" });
    return res.status(200).json(referredUser);
  } catch (err) {
    console.error("[getRefferedUserById] Error:", err);
    next(err);
  }
};




// Demo Controller
export const getAllDemoClasses = async (req, res, next) => {
  try {
    const demoClasses = await prisma.demo.findMany();
    return res.status(200).json(demoClasses);
  } catch (err) {
    next(err);
  }
};
export const getDemoClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoClass = await prisma.demo.findUnique({ where: { id } });
    if (!demoClass) return res.status(404).json({ message: "Demo class not found" });
    return res.status(200).json(demoClass);
  } catch (err) {
    next(err);
  }
};


// Admit card controllers
export const getAllAdmitCards = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { ApplicantName: { contains: search, mode: "insensitive" } },
        { RSAT: { contains: search, mode: "insensitive" } },
        { college: { contains: search, mode: "insensitive" } },
        { contact: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      prisma.admitCard.count({ where }),
      prisma.admitCard.findMany({
        where,
        orderBy: [{ examDate: "asc" }, { createdAt: "desc" }],
        skip,
        take: Number(limit),
        include: { student: { select: { fullName: true, mail_ID: true } } },
      }),
    ]);

    return res.status(200).json({ total, page: Number(page), limit: Number(limit), data });
  } catch (err) {
    next(err);
  }
};

export const getAdmitCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admitCard = await prisma.admitCard.findUnique({ where: { id }, include: { student: { select: { fullName: true, mail_ID: true } } } });
    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });
    res.status(200).json(admitCard);
  } catch (err) {
    next(err);
  }
};



// Result Controllers 
export const getAllResults = async (req, res, next) => {
  try {
    const results = await prisma.result.findMany({
      include: { 
        student: { 
          select: { 
            id: true,
            student_ID: true,
            fullName: true, 
            mail_ID: true,
            phoneNo: true,
            college: true,
            branch: true,
            year: true 
          } 
        } 
      },
    });
    return res.status(200).json(results);
  } catch (err) {
    console.error("getAllResults error:", err);
    next(err);
  }
};

export const getResultByStudentId = async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const result = await prisma.result.findFirst({ 
      where: { studentId },
      include: { 
        student: { 
          select: { 
            id: true,
            student_ID: true,
            fullName: true, 
            mail_ID: true,
            phoneNo: true,
            college: true,
            branch: true,
            year: true 
          } 
        } 
      } 
    });
    if (!result) return res.status(404).json({ message: "Result not found for this student" });
    return res.status(200).json(result);
  } catch (err) {
    console.error("getResultByStudentId error:", err);
    next(err);
  }
};






