
// src/context/AuthContext.jsx

import { createContext, useContext, useEffect, useState } from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  resetPassword,
  confirmResetPassword,
  updatePassword,
  updateUserAttributes,
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

// Helper function to decode JWT token
function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error('Token decode error:', err);
    return null;
  }
}

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAttributes, setUserAttributes] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {

      const currentUser = await getCurrentUser();
      const attrs = await fetchUserAttributes();
      
      // Get ID token to extract custom:role claim
      const session = await fetchAuthSession();
      const idToken = session?.tokens?.idToken;
      let roleFromToken = null;
      
      if (idToken) {
        const decoded = decodeToken(idToken.toString());
        roleFromToken = decoded?.['custom:role'];
      }

      const enrichedAttrs = {
        ...attrs,
        'custom:role': roleFromToken || attrs?.['custom:role'] || 'user',
      };

      console.log("USER 👉", currentUser);
      console.log("ATTRIBUTES 👉", enrichedAttrs);
      console.log("ROLE 👉", enrichedAttrs?.['custom:role']);

      setUser(currentUser);
      setUserAttributes(enrichedAttrs);

    } catch (error) {

      setUser(null);
      setUserAttributes(null);

    } finally {

      setLoading(false);

    }
  }

  /* LOGIN */
  /* LOGIN */
async function login(email, password) {
  try {
    // 🔥 FIX 1: logout existing session (prevents "already signed in")
    try {
      await signOut();
    } catch (e) {
      // ignore if no session
    }

    // 🔥 FIX 2: force stable auth flow
    const result = await signIn({
      username: email,
      password,
      options: {
        authFlowType: "USER_PASSWORD_AUTH",
      },
    });

    if (result.isSignedIn) {
      await checkUser();
    }

    return result;

  } catch (err) {
    console.error("LOGIN ERROR FULL:", err);
    throw err;
  }
}

  /* LOGOUT */
  async function logout() {
    await signOut();
    setUser(null);
    setUserAttributes(null);
  }

  /* REGISTER */
  async function register(email, password, name) {

    return await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });

  }

  /* CONFIRM EMAIL */
  async function confirmRegistration(email, code) {

    return await confirmSignUp({
      username: email,
      confirmationCode: code,
    });

  }

  /* 🔥 RESEND VERIFICATION CODE */
  async function resendConfirmationCode(email) {

    return await resendSignUpCode({
      username: email,
    });

  }

  /* FORGOT PASSWORD */
  async function forgotPassword(email) {

    return await resetPassword({
      username: email,
    });

  }

  /* CONFIRM RESET PASSWORD */
  async function confirmForgotPassword(email, code, newPassword) {

    return await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });

  }

  /* CHANGE PASSWORD */
  async function changePassword(oldPassword, newPassword) {

    return await updatePassword({
      oldPassword,
      newPassword,
    });

  }

  /* UPDATE PROFILE */
  async function updateProfile(attributes) {

    await updateUserAttributes({
      userAttributes: attributes,
    });

    await checkUser();
  }

  /* ADMIN CHECK */
  const isAdmin =
    userAttributes?.['custom:role'] === 'admin' ||
    userAttributes?.role === 'admin';

  return (

    <AuthContext.Provider
      value={{
        user,
        userAttributes,
        loading,
        isAdmin,
        login,
        logout,
        register,
        confirmRegistration,
        resendConfirmationCode,
        forgotPassword,
        confirmForgotPassword,
        changePassword,
        updateProfile,
      }}
    >

      {children}

    </AuthContext.Provider>

  );
}

export const useAuth = () => {

  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;

};

