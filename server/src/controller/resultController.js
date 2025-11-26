import Result from "../model/resultModel.js";
import Student from "../model/studentModel.js";

// Create a new result
export const createResult = async (req, res) => {
  try {
    const { student_ID, A, B, C, D } = req.body;
    const total = A + B + C + D;
    const percentage = (total / 400) * 100;
    let scholarShip = 0;
    // Scholarship logic based on percentage
    if (percentage >= 95) {
      scholarShip = 100;
    } else if (percentage >= 85) {
      scholarShip = 50;
    } else if (percentage >= 75) {
      scholarShip = 25;
    } else if (percentage >= 60) {
      scholarShip = 10;
    } else {
      scholarShip = 0;
    }

    const result = new Result({
      student_ID,
      A,
      B,
      C,
      D,
      total,
      percentage,
      scholarShip,
    });
    await result.save();
    res.status(201).json({ message: "Result created successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all results
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate(
      "student_ID",
      "fullName email"
    );
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get result by student ID
export const getResultByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await Result.findOne({ student_ID: studentId }).populate(
      "student_ID",
      "fullName email"
    );
    if (!result) {
      return res
        .status(404)
        .json({ message: "Result not found for this student" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update result by ID
export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { A, B, C, D } = req.body;
    const total = A + B + C + D;
    const percentage = (total / 400) * 100;
    let scholarShip = 0;
    // Scholarship logic based on percentage
    if (percentage >= 95) {
      scholarShip = 100;
    } else if (percentage >= 85) {
      scholarShip = 50;
    } else if (percentage >= 75) {
      scholarShip = 25;
    } else if (percentage >= 60) {
      scholarShip = 10;
    } else {
      scholarShip = 0;
    }
    const updatedResult = await Result.findByIdAndUpdate(
      id,
      { A, B, C, D, total, percentage, scholarShip },
      { new: true }
    );
    if (!updatedResult) {
      return res.status(404).json({ message: "Result not found" });
    }
    res
      .status(200)
      .json({ message: "Result updated successfully", updatedResult });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete result by ID
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResult = await Result.findByIdAndDelete(id);
    if (!deletedResult) {
      return res.status(404).json({ message: "Result not found" });
    }
    res.status(200).json({ message: "Result deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL RESULTS WITH STUDENT DETAILS
export const getAllResultsWithStudentDetails = async (req, res) => {
  try {
    const results = await Result.find().populate(
      "student_ID",
      "fullName email phoneNo collegeName year"
    );
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
