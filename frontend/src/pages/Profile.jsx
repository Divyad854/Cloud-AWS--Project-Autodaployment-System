import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchAuthSession } from "aws-amplify/auth";
import { User, Mail, Save } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/profile.css";

export default function Profile() {

  const { userAttributes } = useAuth();
  const role = userAttributes?.["custom:role"] || "user";

  const [form, setForm] = useState({
    name: userAttributes?.name || "",
    email: userAttributes?.email || "",
    mobileNo: "",
    gender: "",
    birthDate: "",
    profilePhotoUrl: "",
    country: "",
    state: "",
    city: "",
    userType: "",
    collegeName: "",
    companyName: "",
    bio: "",
    github: ""
  });

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function getToken() {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();

    if (!token) {
      toast.error("Login expired");
      throw new Error("JWT token missing");
    }

    return token;
  }

  const loadProfile = async () => {
    try {

      const token = await getToken();

      const res = await axios.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.profile) {

        setForm((prev) => ({
          ...prev,
          ...res.data.profile
        }));

        setPreview(res.data.profile.profilePhotoUrl || "");

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

  /* IMAGE UPLOAD */

  const handleImageUpload = async (e) => {

    const file = e.target.files[0];
    if (!file) return;

    try {

      const token = await getToken();

      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.put(
        "/api/users/profile-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      setPreview(res.data.imageUrl);

      setForm((prev) => ({
        ...prev,
        profilePhotoUrl: res.data.imageUrl
      }));

    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    }
  };

  /* SUBMIT */

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (form.birthDate) {

      const birth = new Date(form.birthDate);
      const today = new Date();

      let age = today.getFullYear() - birth.getFullYear();

      const m = today.getMonth() - birth.getMonth();

      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      if (age < 18) {
        toast.error("User must be at least 18 years old");
        return;
      }

    }

    setLoading(true);

    try {

      const token = await getToken();

      await axios.put("/api/users/profile", form, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Profile saved successfully");

    } catch (err) {
      console.error(err);
      toast.error("Failed to save profile");
    }
    finally {
      setLoading(false);
    }

  };

  return (

    <div className="profile-page">

      <div className="profile-card">

        <div className="profile-avatar-section">

          <div className="profile-avatar">

            {preview ? (
              <img
                src={preview}
                alt="profile"
                onError={(e) => {
                  e.target.src = "/default-avatar.png";
                }}
              />
            ) : (
              (userAttributes?.name || "U")[0].toUpperCase()
            )}

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
            <input name="name" value={form.name || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label><Mail size={14}/> Email</label>
            <input
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              disabled={role !== "admin"}
            />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input name="mobileNo" value={form.mobileNo || ""} onChange={handleChange}/>
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={form.gender || ""} onChange={handleChange}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Birth Date</label>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate || ""}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Upload Profile Photo</label>
            <input type="file" accept="image/*" onChange={handleImageUpload}/>
          </div>

          {role !== "admin" && (
            <>
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
                <label>Github</label>
                <input name="github" value={form.github || ""} onChange={handleChange}/>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea name="bio" value={form.bio || ""} onChange={handleChange}/>
              </div>
            </>
          )}

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

          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={16}/>
            {loading ? "Saving..." : "Save Profile"}
          </button>

        </form>

      </div>

    </div>

  );
}