import { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { authApi } from '../lib/api';
import tokenService from '../lib/services/tokenService';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component that wraps the app and makes auth object available
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First check if we have a valid token
        if (tokenService.isTokenValid()) {
          // Get user info from token
          const tokenUser = tokenService.getUserFromToken();
          if (tokenUser) {
            try {
              // Fetch user profile for complete data
              const profileResponse = await authApi.getProfile();
              setUser(profileResponse.user);
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              // If we can't fetch the profile but have token user info,
              // use that as a fallback
              setUser({ ...tokenUser, authenticated: true });
            }
            return;
          }
        }
        
        // If no valid token, check if user is authenticated via cookies
        try {
          const isAuthenticated = await authApi.checkAuth();
          
          if (isAuthenticated) {
            try {
              // Fetch user profile
              const profileResponse = await authApi.getProfile();
              setUser(profileResponse.user);
            } catch (profileError) {
              console.error('Error fetching user profile:', profileError);
              // If we can't fetch the profile but we're authenticated,
              // set a minimal user object
              setUser({ authenticated: true });
            }
          } else {
            setUser(null);
            tokenService.clearTokens(); // Clear any invalid tokens
          }
        } catch (error) {
          console.error('Auth check error:', error);
          setError('Failed to check authentication status');
          setUser(null);
          tokenService.clearTokens(); // Clear any invalid tokens
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (emailOrUsername, password, remember = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the auth API to login
      const response = await authApi.login(emailOrUsername, password, remember);
      
      if (response.success) {
        // Store tokens if provided
        if (response.access_token) {
          tokenService.setTokens(
            response.access_token,
            response.refresh_token || null
          );
        }
        
        setUser(response.user);
        return true;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email, username, password, confirmPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the auth API to register
      const response = await authApi.register(email, username, password, confirmPassword);
      
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Clear tokens first
      tokenService.clearTokens();
      
      // Use the auth API to logout (server-side)
      try {
        await authApi.logout();
      } catch (logoutError) {
        console.error('Server logout error:', logoutError);
        // Continue with client-side logout even if server logout fails
      }
      
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed');
      
      // Ensure user is logged out client-side even if there's an error
      tokenService.clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the auth API to update profile
      const response = await authApi.updateProfile(profileData);
      
      if (response.success) {
        setUser(response.user);
        return true;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error.message || 'Profile update failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the auth API to change password
      const response = await authApi.changePassword(currentPassword, newPassword, confirmPassword);
      
      if (response.success) {
        return true;
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.message || 'Password change failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
