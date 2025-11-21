import AuthModel from "../models/authModel.js";
import Referred from "../models/refferedModel.js";
import DemoClass from "../models/demoModel.js";
import SupportQuery from "../models/supportQueriesModel.js"; // आपका schema file
import {sendConfirmationEmail } from "../utils/emailService.js";
import mongoose from "mongoose";

// Example: Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await AuthModel.find().select("-password"); // Exclude passwords
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// admin edit user details can be added here in future
// admin delete user can be added here in future

export const putUserDetails = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const updatedUser = await AuthModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Enhanced validation for ObjectId
export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing User ID" });
    }

    const user = await AuthModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deletedUser = await AuthModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// get All referred users

export const getRefferedUsers = async (req, res, next) => {
  try {
    const referredUsers = await Referred.find().populate(
      "referrerId",
      "student_ID fullName mail_ID phoneNo"
    );
    res.status(200).json(referredUsers);
  } catch (error) {
    next(error);
  }
};

// edit referred user details can be added here in future

export const putRefferedUserDetails = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const updateData = req.body;

    // Map incoming fields to schema fields
    const mappedData = {
      referredName: updateData.fullName,
      referredEmail: updateData.mail_ID,
      referredPhone: updateData.phoneNo,
      collegeName: updateData.collegeName,
      year: updateData.year,
      refCode: updateData.refCode,
    };

    const updatedReferred = await Referred.findByIdAndUpdate(
      referredId,
      mappedData,
      {
        new: true,
        runValidators: true, // Ensure validation is applied
      }
    ).populate("referrerId", "student_ID fullName mail_ID phoneNo");

    if (!updatedReferred) {
      return res.status(404).json({ message: "Referred user not found" });
    }

    res
      .status(200)
      .json({
        message: "Referred user updated successfully",
        referred: updatedReferred,
      });
  } catch (error) {
    console.error("[putRefferedUserDetails] Error:", error);
    next(error);
  }
};

// delete referred user can be added here in future

export const deleteRefferedUser = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const deletedReferred = await Referred.findByIdAndDelete(referredId);
    if (!deletedReferred) {
      return res.status(404).json({ message: "Referred user not found" });
    }

    res.status(200).json({ message: "Referred user deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// get by id referred user can be added here in fut
export const getRefferedUserById = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const referredUser = await Referred.findById(referredId).populate(
      "referrerId",
      "student_ID fullName mail_ID phoneNo"
    );
    if (!referredUser) {
      return res.status(404).json({ message: "Referred user not found" });
    }
    res.status(200).json(referredUser);
  } catch (error) {
    next(error);
  }
};



export const getAllDemoClasses = async (req, res, next) => {
  try {
    const demoClasses = await DemoClass.find({});
    res.status(200).json(demoClasses);
  } catch (error) {
    next(error);
  }
};

export const getDemoClassById = async (req, res, next) => {
  try {
    const demoClassId = req.params.id;
    const demoClass = await DemoClass.findById(demoClassId);
    if (!demoClass) {
      return res.status(404).json({ message: "Demo class not found" });
    }
    res.status(200).json(demoClass);
  } catch (error) {
    next(error);
  }
};

// DELETE Demo Class
export const deleteDemoClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const deleted = await DemoClass.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Demo class not found" });
    }

    return res.status(200).json({ message: "Demo class deleted successfully" });
  } catch (error) {
    console.error("Error deleting demo class:", error);
    return res.status(500).json({ message: "Server error" });
  }
};



export const putDemoClassDetails = async (req, res, next) => {
  try {
    const demoClassId = req.params.id;
    const updateData = req.body;
    const updatedDemoClass = await DemoClass.findByIdAndUpdate(demoClassId, updateData, {
      new: true,
    });
    if (!updatedDemoClass) {
      return res.status(404).json({ message: "Demo class not found" });
    }

    // Send confirmation email to the user
    if (updatedDemoClass.email) {
      try {
        await sendConfirmationEmail({
          to: updatedDemoClass.email,
          subject: "Demo Class Update Confirmation",
          studentName: updatedDemoClass.studentName,
          demoSlot: updatedDemoClass.demoSlot,
          type: updatedDemoClass.type,
          collegeName: updatedDemoClass.collegeName,
          year: updatedDemoClass.year,
        });
        console.log("Confirmation email sent successfully to:", updatedDemoClass.email);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    res
      .status(200)
      .json({ message: "Demo class updated successfully", demoClass: updatedDemoClass });
  } catch (error) {
    next(error);
  }
};







/**
 * Get all support queries (admin)
 * GET /support/all-queries
 * Optional query params: ?status=open
 */
export const GetAllSupportQueries = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      const allowed = ["open", "in_progress", "resolved"];
      if (!allowed.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = req.query.status;
    }

    // Fetch queries with populated student details
    const queries = await SupportQuery.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "studentId", select: "fullName mail_ID phoneNo" })
      .lean();

    console.log("Fetched Queries:", queries); // Debugging log

    return res.status(200).json(queries);
  } catch (error) {
    next(error);
  }
};

/**
 * Get support queries for the logged-in student
 * GET /support/student-queries
 */
export const GetStudentSupportQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const studentId = req.user._id;

    const queries = await SupportQuery.find({ studentId })
      .sort({ createdAt: -1 })
      .populate({ path: "studentId", select: "fullName mail_ID phoneNo" })
      .lean();

    return res.status(200).json(queries);
  } catch (error) {
    next(error);
  }
};

/**
 * Update support query status (admin)
 * PUT /support/update-status/:queryId
 * body: { status: "open" | "in_progress" | "resolved" }
 */
export const UpdateSupportQueryStatus = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res.status(400).json({ message: "Invalid queryId" });
    }
    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const query = await SupportQuery.findByIdAndUpdate(
      queryId,
      { status },
      { new: true }
    ).populate({ path: "studentId", select: "fullName mail_ID phoneNo" });

    if (!query) {
      return res.status(404).json({ message: "Support query not found" });
    }

    return res.status(200).json({ message: "Support query status updated", query });
  } catch (error) {
    next(error);
  }
};

/**
 * Add response to support query (admin or support agent)
 * POST /support/:queryId/respond
 * body: { message }
 * responder will be taken from req.user.name if exists, otherwise require responder in body
 */
export const AddSupportQueryResponse = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { message, responder } = req.body;

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res.status(400).json({ message: "Invalid queryId" });
    }
    if (!message) {
      return res.status(400).json({ message: "Response message is required" });
    }

    const responderName = (req.user && (req.user.name || req.user.fullName)) || responder;
    if (!responderName) {
      return res.status(400).json({ message: "Responder name required (authenticate or send responder in body)" });
    }

    const query = await SupportQuery.findByIdAndUpdate(
      queryId,
      {
        $push: {
          responses: { responder: responderName, message, date: new Date() },
        },
        status: "in_progress",
      },
      { new: true }
    ).populate({ path: "studentId", select: "fullName mail_ID phoneNo" });

    if (!query) {
      return res.status(404).json({ message: "Support query not found" });
    }

    return res.status(200).json({ message: "Response added to support query", query });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete support query (admin)
 * DELETE /support/delete/:queryId
 */
export const DeleteSupportQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res.status(400).json({ message: "Invalid queryId" });
    }

    const deletedQuery = await SupportQuery.findByIdAndDelete(queryId);

    if (!deletedQuery) {
      return res.status(404).json({ message: "Support query not found" });
    }

    return res.status(200).json({ message: "Support query deleted successfully" });
  } catch (error) {
    next(error);
  }
};
