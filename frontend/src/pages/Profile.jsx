
// src/pages/Profile.jsx

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAuthSession } from "aws-amplify/auth";
import { User, Mail, Save } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/profile.css";

export default function Profile() {

  const { userAttributes } = useAuth();

  const [form, setForm] = useState({
    name: userAttributes?.name || "",
    email: userAttributes?.email || "",
    userType: "",
    mobileNo: "",
    country: "",
    state: "",
    city: "",
    collegeName: "",
    companyName: "",
    bio: "",
    github: ""
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  // 🔹 Get JWT token from Amplify session
  async function getToken() {

    const session = await fetchAuthSession();

    const token = session?.tokens?.idToken?.toString();

    if (!token) {
      toast.error("Login expired");
      throw new Error("JWT token missing");
    }

    return token;

  }

  // 🔹 Load profile
  const loadProfile = async () => {

    try {

      const token = await getToken();

      const res = await axios.get("/api/users/profile", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data.profile) {

        setForm((prev) => ({
          ...prev,
          ...res.data.profile
        }));

      }

    } catch (err) {

      console.error("PROFILE LOAD ERROR:", err);

    }

  };

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value
    });

  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    try {

      const token = await getToken();

      await axios.put("/api/users/profile", form, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast.success("Profile saved successfully");

    } catch (err) {

      console.error(err);
      toast.error("Failed to save profile");

    } finally {

      setLoading(false);

    }

  };

  return (
    <div className="profile-page">

      <div className="profile-card">

        <div className="profile-avatar-section">

          <div className="profile-avatar">
            {(userAttributes?.name || "U")[0].toUpperCase()}
          </div>

          <div>
            <h2>{userAttributes?.name}</h2>
            <p className="muted">{userAttributes?.email}</p>
          </div>

        </div>

        <form onSubmit={handleSubmit} className="profile-form">

          <h3>Profile Information</h3>

          <div className="form-group">
            <label><User size={14}/> Name</label>
            <input name="name" value={form.name || ""} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label><Mail size={14}/> Email</label>
            <input value={form.email} disabled className="disabled-input" />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input name="mobileNo" value={form.mobileNo || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>User Type</label>
            <select name="userType" value={form.userType || ""} onChange={handleChange}>
              <option value="">Select</option>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
            </select>
          </div>

          <div className="form-group">
            <label>College Name</label>
            <input name="collegeName" value={form.collegeName || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>Company Name</label>
            <input name="companyName" value={form.companyName || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>Country</label>
            <input name="country" value={form.country || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>State</label>
            <input name="state" value={form.state || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>City</label>
            <input name="city" value={form.city || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>Github</label>
            <input name="github" value={form.github || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea name="bio" value={form.bio || ""} onChange={handleChange}/>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={16}/>
            {loading ? "Saving..." : "Save Profile"}
          </button>

        </form>

      </div>

    </div>
  );

}

