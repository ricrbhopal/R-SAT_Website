export const GetStudentSupportQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      console.error("Unauthorized access: req.user is", req.user);
      return res.status(401).json({ message: "Authentication required" });
    }

    const studentId = req.user._id;
    const userRole = req.user.role;

    console.log("Fetching queries for studentId:", studentId);
    console.log("User role:", userRole);

    // Role-based access control (if applicable)
    if (userRole !== "Leader" && userRole !== "Student") {
      console.warn("Access denied: role is", userRole);
      return res.status(403).json({ message: "Access denied" });
    }

    const queries = await SupportQuery.find({ studentId })
      .sort({ createdAt: -1 })
      .populate({ path: "studentId", select: "fullName mail_ID phoneNo" })
      .lean();

    console.log("Query results:", queries);

    if (!queries || queries.length === 0) {
      console.warn("No queries found for studentId:", studentId);
      return res.status(404).json({ message: "No support queries found" });
    }

    return res.status(200).json(queries);
  } catch (error) {
    console.error("Error in GetStudentSupportQueries:", error);
    next(error);
  }
};