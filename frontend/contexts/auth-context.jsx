
// frontend/contexts/auth-context.jsx
"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function apiLogin(username, password, rememberMe) {
  const response = await fetch(API_BASE_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password, rememberMe }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Đăng nhập thất bại');
  }

  return data;
}

async function apiGetMe(token) {
  const response = await fetch(API_BASE_URL + '/auth/me', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Không thể xác thực');
  }

  return data;
}

async function apiLogout(token) {
  try {
    await fetch(API_BASE_URL + '/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      credentials: 'include',
    });
  } catch {
    // Bỏ qua lỗi logout
  }
}

async function apiRefreshToken(refreshToken) {
  const response = await fetch(API_BASE_URL + '/auth/refresh-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Refresh token thất bại');
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  // Khởi tạo: kiểm tra session đã lưu
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem('ptit_token');

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Khôi phục từ cache trước để UX nhanh hơn
      const savedUser = localStorage.getItem('ptit_user');

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          localStorage.removeItem('ptit_user');
        }
      }

      // Xác thực token với server
      try {
        const response = await apiGetMe(token);

        if (response.success && response.data) {
          const userData = buildUserData(response.data);

          setUser(userData);

          localStorage.setItem(
            'ptit_user',
            JSON.stringify(userData)
          );
        }
      } catch (error) {
        // Token hết hạn, thử refresh
        const refreshToken = localStorage.getItem(
          'ptit_refresh_token'
        );

        if (refreshToken) {
          try {
            const refreshResponse =
              await apiRefreshToken(refreshToken);

            const newToken = refreshResponse.data.token || refreshResponse.data.accessToken;

            if (
              refreshResponse.data &&
              newToken
            ) {
              localStorage.setItem(
                'ptit_token',
                newToken
              );

              if (refreshResponse.data.refreshToken) {
                localStorage.setItem(
                  'ptit_refresh_token',
                  refreshResponse.data.refreshToken
                );
              }

              // Thử getMe lại với token mới
              const retryResponse = await apiGetMe(
                newToken
              );

              if (
                retryResponse.success &&
                retryResponse.data
              ) {
                const userData = buildUserData(
                  retryResponse.data
                );

                setUser(userData);

                localStorage.setItem(
                  'ptit_user',
                  JSON.stringify(userData)
                );
              }
            }
          } catch {
            // Refresh thất bại, xóa tất cả
            clearStorage();
            setUser(null);
          }
        } else {
          clearStorage();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (username, password, rememberMe) => {
    try {
      const response = await apiLogin(username, password, rememberMe);

      if (response.success && response.data) {
        if (response.data.requirePasswordChange) {
          return {
            success: true,
            requirePasswordChange: true,
            tempToken: response.data.tempToken,
            user: response.data.user,
          };
        }

        const {
          user: userData,
          token,
          accessToken,
          refreshToken,
        } = response.data;

        const finalToken = token || accessToken;

        // Lưu tokens
        if (finalToken) {
          localStorage.setItem('ptit_token', finalToken);
        }

        if (refreshToken) {
          localStorage.setItem(
            'ptit_refresh_token',
            refreshToken
          );
        }

        const userInfo = buildUserData(userData);

        setUser(userInfo);

        localStorage.setItem(
          'ptit_user',
          JSON.stringify(userInfo)
        );

        // Redirect theo role
        if (userData.role === 'admin') {
          router.push('/admin');
        } else if (userData.role === 'instructor') {
          router.push('/instructor');
        } else {
          router.push('/student');
        }

        return {
          success: true,
          message: 'Đăng nhập thành công!',
        };
      }

      return {
        success: false,
        message:
          response.message || 'Đăng nhập thất bại',
      };
    } catch (error) {
      return {
        success: false,
        message:
          error.message ||
          'Tên đăng nhập hoặc mật khẩu không đúng!',
      };
    }
  }, [router]);

  const logout = useCallback(async () => {
    const token = localStorage.getItem('ptit_token');

    await apiLogout(token);

    clearStorage();

    setUser(null);

    router.push('/');
  }, [router]);

  const updateUser = useCallback((newData) => {
    setUser(function (prev) {
      const updated = Object.assign({}, prev, newData);

      localStorage.setItem(
        'ptit_user',
        JSON.stringify(updated)
      );

      return updated;
    });
  }, []);

  const value = {
    user,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper: build user object từ API response
function buildUserData(userData) {
  return {
    id: userData.id,
    username: userData.username,
    name: userData.name || userData.username,
    role: userData.role,
    studentId: userData.student
      ? userData.student.student_code
      : null,
    email: userData.student
      ? userData.student.email
      : userData.username + '@ptit.edu.vn',
    student: userData.student || null,
  };
}

// Helper: xóa storage
function clearStorage() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('ptit_token');
  localStorage.removeItem('ptit_refresh_token');
  localStorage.removeItem('ptit_user');
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}

