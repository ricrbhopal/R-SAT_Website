import React, { useEffect, useState } from "react";
import { AuthAPI } from "../../config/api";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await AuthAPI.getStudentProfile();
        setProfile(response.data);
      } catch (err) {
        setError("Failed to fetch profile. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">Student Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong>Student ID:</strong> {profile.student_ID}
        </div>
        <div>
          <strong>Full Name:</strong> {profile.fullName}
        </div>
        <div>
          <strong>Phone Number:</strong> {profile.phoneNo}
        </div>
        <div>
          <strong>Email:</strong> {profile.mail_ID}
        </div>
        <div>
          <strong>College:</strong> {profile.college}
        </div>
        <div>
          <strong>Branch:</strong> {profile.branch}
        </div>
        <div>
          <strong>Year:</strong> {profile.year}
        </div>
        <div>
          <strong>Date of Birth:</strong> {new Date(profile.dob).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;