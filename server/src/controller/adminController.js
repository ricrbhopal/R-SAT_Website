import AuthModel from "../models/authModel.js";
import Referred from "../models/refferedModel.js";


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

export const getUserById = async (req, res, next) => {
    try {
        const userId = req.params.id;
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
    const referredUsers = await Referred.find().populate("referrerId", "student_ID fullName mail_ID phoneNo");
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
    const updatedReferred = await Referred.findByIdAndUpdate(referredId, updateData, {
      new: true,
    }).populate("referrerId", "student_ID fullName mail_ID phoneNo");
    if (!updatedReferred) {
      return res.status(404).json({ message: "Referred user not found" });
    }
    res
      .status(200)
      .json({ message: "Referred user updated successfully", referred: updatedReferred });
  } catch (error) {
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


