import axios from "axios";

export const getProfile = () =>
  axios.get("/api/users/profile");

export const updateProfile = (data) =>
  axios.put("/api/users/profile", data);