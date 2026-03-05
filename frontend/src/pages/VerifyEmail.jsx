// src/pages/VerifyEmail.jsx

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/logo/Autodeployment.png";
import "../styles/auth.css";

export default function VerifyEmail() {

  const { confirmRegistration, resendConfirmationCode } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  /* TIMER */
  useEffect(() => {

    let interval;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);

  }, [timer]);

  /* VERIFY EMAIL */
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (timer === 0) {
      toast.error("Code expired. Please resend.");
      return;
    }

    setLoading(true);

    try {

      await confirmRegistration(email, code);

      toast.success("Email verified successfully");

      navigate("/login");

    } catch (err) {

      toast.error(err.message || "Verification failed");

    } finally {

      setLoading(false);

    }

  };

  /* RESEND CODE */
  const handleResend = async () => {

    try {

      await resendConfirmationCode(email);

      toast.success("New verification code sent");

      setTimer(30);

    } catch (err) {

      toast.error("Failed to resend code");

    }

  };

  return (

    <div className="auth-page">

      <div className="auth-card">

        {/* HEADER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "30px"
          }}
        >

          <img
            src={logo}
            alt="logo"
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "8px"
            }}
          />

          <h2
            style={{
              fontSize: "19px",
              fontWeight: "600",
              margin: 0
            }}
          >
            Project Deployment System
          </h2>

        </div>

        {/* ICON + TITLE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
            color: "#a9b4d0"
          }}
        >

          <Mail size={42} />

          <h2
            style={{
              margin: 0
            }}
          >
            Check your email
          </h2>

        </div>

        {/* SUBTITLE */}
        <p
          className="auth-subtitle"
          style={{ marginBottom: "28px" }}
        >
          We sent a verification code to <br />
          <strong>{email}</strong>
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="auth-form">

          <div className="form-group">

            <label>Verification Code</label>

            <input
              type="text"
              required
              placeholder="Enter 6-digit code"
              value={code}
              maxLength={6}
              className="code-input"
              onChange={(e) => setCode(e.target.value)}
            />

          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || timer === 0}
          >
            {loading ? "Verifying..." : "Verify Email"}
          </button>

        </form>

        {/* TIMER + RESEND */}
        <p
          style={{
            marginTop: "16px",
            fontSize: "14px",
            color: "#9aa4c3"
          }}
        >

          {timer > 0 ? (
            <>Code expires in <b>{timer}s</b></>
          ) : (
            <>
              Code expired{" "}
              <button
                onClick={handleResend}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6c7cff",
                  cursor: "pointer"
                }}
              >
                Resend
              </button>
            </>
          )}

        </p>

      </div>

    </div>

  );

}