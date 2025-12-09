import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to calculate scholarship
const calculateScholarship = (percentage) => {
  if (percentage >= 95) return 100;
  if (percentage >= 85) return 50;
  if (percentage >= 75) return 25;
  if (percentage >= 60) return 10;
  return 0;
};

// Create a new result
export const createResult = async (req, res, next) => {
  try {
    const { studentId, A, B, C, D } = req.body;

    if (!studentId || A === undefined || B === undefined || C === undefined || D === undefined) {
      return res.status(400).json({ message: "Missing required fields: studentId, A, B, C, D" });
    }

    const total = A + B + C + D;
    const percentage = (total / 400) * 100;
    const scholarShip = calculateScholarship(percentage);

    const result = await prisma.result.create({
      data: {
        studentId,
        A,
        B,
        C,
        D,
        total,
        percentage,
        scholarShip,
      },
      include: { student: { select: { fullName: true, mail_ID: true, student_ID: true } } },
    });

    res.status(201).json({ message: "Result created successfully", result });
  } catch (error) {
    console.error("Create result error:", error);
    next(error);
  }
};

// Get all results
export const getAllResults = async (req, res, next) => {
  try {
    const results = await prisma.result.findMany({
      include: { student: { select: { fullName: true, mail_ID: true, student_ID: true } } },
    });
    res.status(200).json(results);
  } catch (error) {
    console.error("Get all results error:", error);
    next(error);
  }
};

// Get result by student ID
export const getResultByStudentId = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const result = await prisma.result.findFirst({
      where: { studentId },
      include: { student: { select: { fullName: true, mail_ID: true, student_ID: true } } },
    });

    if (!result) {
      return res.status(404).json({ message: "Result not found for this student" });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("Get result by student error:", error);
    next(error);
  }
};

// Update result by ID
export const updateResult = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { A, B, C, D } = req.body;

    if (!id || A === undefined || B === undefined || C === undefined || D === undefined) {
      return res.status(400).json({ message: "Missing required fields: id, A, B, C, D" });
    }

    const total = A + B + C + D;
    const percentage = (total / 400) * 100;
    const scholarShip = calculateScholarship(percentage);

    const updatedResult = await prisma.result.update({
      where: { id },
      data: { A, B, C, D, total, percentage, scholarShip },
      include: { student: { select: { fullName: true, mail_ID: true, student_ID: true } } },
    });

    res.status(200).json({ message: "Result updated successfully", updatedResult });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Result not found" });
    }
    console.error("Update result error:", error);
    next(error);
  }
};

// Delete result by ID
export const deleteResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    await prisma.result.delete({ where: { id } });
    res.status(200).json({ message: "Result deleted successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Result not found" });
    }
    console.error("Delete result error:", error);
    next(error);
  }
};

// GET ALL RESULTS WITH STUDENT DETAILS
export const getAllResultsWithStudentDetails = async (req, res, next) => {
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
            year: true,
          },
        },
      },
    });

    res.status(200).json(results);
  } catch (error) {
    console.error("Get all results with student details error:", error);
    next(error);
  }
};
