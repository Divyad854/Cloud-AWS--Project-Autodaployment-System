import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import logo from "../assets/logo/Autodeployment.png";

export default function ForgotPassword() {

  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;

    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);

  }, [timer]);

  /* SEND CODE */
  const handleSendCode = async (e) => {

    e.preventDefault();
    setLoading(true);

    try {

      await forgotPassword(email);

      toast.success("Verification code sent to your email");

      setStep(2);
      setTimer(30);

    } catch (err) {

      toast.error(err.message || "Failed to send code");

    } finally {

      setLoading(false);

    }

  };

  /* RESEND */
  const handleResend = async () => {

    try {

      await forgotPassword(email);
      toast.success("New verification code sent");
      setTimer(30);

    } catch {

      toast.error("Failed to resend code");

    }

  };

  /* VERIFY CODE */
  const handleVerifyCode = (e) => {

    e.preventDefault();

    if (timer === 0) {
      toast.error("Code expired. Please resend.");
      return;
    }

    if (code.length < 6) {
      toast.error("Enter valid 6 digit code");
      return;
    }

    toast.success("Code verified");

    setStep(3);

  };

  /* RESET PASSWORD */
  const handleResetPassword = async (e) => {

    e.preventDefault();

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {

      await confirmForgotPassword(email, code, password);

      toast.success("Password reset successfully");

      navigate("/login");

    } catch (err) {

      toast.error(err.message || "Password reset failed");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div style={styles.page}>

      <div style={styles.card}>

        {/* HEADER */}
        <div style={styles.header}>

          <img src={logo} alt="logo" style={styles.logo} />

          <h2 style={styles.projectTitle}>
            Project Deployment System
          </h2>

        </div>

        <h2 style={styles.title}>Reset Password</h2>

        <p style={styles.subtitle}>
          Recover access to your account
        </p>

        {/* STEP 1 */}
        {step === 1 && (

          <form onSubmit={handleSendCode}>

            <label>Email</label>

            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button style={styles.button} disabled={loading}>
              {loading ? "Sending..." : "Send Code"}
            </button>

          </form>

        )}

        {/* STEP 2 */}
        {step === 2 && (

          <>
            <p style={styles.subtitle}>
              Enter code sent to <b>{email}</b>
            </p>

            <form onSubmit={handleVerifyCode}>

              <label>Verification Code</label>

              <input
                style={styles.input}
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />

             <button
              style={timer === 0 ? styles.buttonDisabled : styles.button}
              disabled={timer === 0}
            >
              Verify Code
            </button>
            </form>

            <p style={styles.subtitle}>
              {timer > 0 ? (
                <>Code expires in <b>{timer}s</b></>
              ) : (
                <>
                  Code expired{" "}
                  <button style={styles.linkBtn} onClick={handleResend}>
                    Resend
                  </button>
                </>
              )}
            </p>
          </>

        )}

        {/* STEP 3 */}
        {step === 3 && (

          <form onSubmit={handleResetPassword}>

            <label>New Password</label>

            <input
              style={styles.input}
              type="password"
              placeholder="Minimum 8 characters"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label>Confirm Password</label>

            <input
              style={styles.input}
              type="password"
              placeholder="Repeat password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <button style={styles.button} disabled={loading}>
              {loading ? "Resetting..." : "Change Password"}
            </button>

          </form>

        )}

        <p style={{ marginTop: 20 }}>
          <Link to="/login" style={styles.link}>
            ← Back to login
          </Link>
        </p>

      </div>

    </div>

  );
}

/* STYLES */
const styles = {

 page: {
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#020b1c",
  padding: "20px",
},

  card: {
    width: "420px",
   
    padding: "45px 40px",
    borderRadius: "16px",
    background: "#0b1730",
    color: "white",
    boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "20px",
  },

  logo: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
  },

  projectTitle: {
    fontSize: "20px",
    fontWeight: "600",
  },

  title: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#6c7cff",
    marginTop: "15px",
  },

  subtitle: {
    fontSize: "14px",
    color: "#9aa4c3",
    marginBottom: "28px",
  },

  input: {
    width: "100%",
    padding: "12px",
    marginTop: "6px",
    marginBottom: "18px",
    borderRadius: "10px",
    border: "1px solid #3a4a7a",
    background: "#111f3c",
    color: "white",
    fontSize: "14px",
  },

  button: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(90deg,#6c7cff,#7d87ff)",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "5px",
  },

  buttonDisabled: {
    width: "100%",
    padding: "14px",
    borderRadius: "10px",
    border: "none",
    background: "#4a4f75",
    color: "#b0b4d6",
    fontWeight: "600",
    cursor: "not-allowed",
    opacity: 0.6,
    marginTop: "5px",
  },

  link: {
    color: "#6c7cff",
    textDecoration: "none",
    fontSize: "14px",
  },

  linkBtn: {
    background: "none",
    border: "none",
    color: "#6c7cff",
    cursor: "pointer",
    fontSize: "14px",
  }

};