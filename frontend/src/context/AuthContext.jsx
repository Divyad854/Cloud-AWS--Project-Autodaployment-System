// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  signIn, signOut, signUp, confirmSignUp,
  getCurrentUser, fetchUserAttributes,
  resetPassword, confirmResetPassword, updatePassword,
  updateUserAttributes,
} from 'aws-amplify/auth';

const AuthContext = createContext(null);

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
      setUser(currentUser);
      setUserAttributes(attrs);
    } catch {
      setUser(null);
      setUserAttributes(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      await checkUser();
    }
    return result;
  }

  async function logout() {
    await signOut();
    setUser(null);
    setUserAttributes(null);
  }

  async function register(email, password, name) {
    return await signUp({
      username: email,
      password,
      options: { userAttributes: { email, name } },
    });
  }

  async function confirmRegistration(email, code) {
    return await confirmSignUp({ username: email, confirmationCode: code });
  }

  async function forgotPassword(email) {
    return await resetPassword({ username: email });
  }

  async function confirmForgotPassword(email, code, newPassword) {
    return await confirmResetPassword({ username: email, confirmationCode: code, newPassword });
  }

  async function changePassword(oldPassword, newPassword) {
    return await updatePassword({ oldPassword, newPassword });
  }

  async function updateProfile(attributes) {
    await updateUserAttributes({ userAttributes: attributes });
    await checkUser();
  }

  const isAdmin = userAttributes?.['custom:role'] === 'admin';

  return (
    <AuthContext.Provider value={{
      user, userAttributes, loading, isAdmin,
      login, logout, register, confirmRegistration,
      forgotPassword, confirmForgotPassword, changePassword, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
