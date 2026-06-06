// frontend/lib/api.js

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Lấy token từ localStorage
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ptit_token');
}

// Lấy refresh token
function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ptit_refresh_token');
}

// Xóa toàn bộ auth data và redirect login
function clearAuthAndRedirect() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ptit_token');
  localStorage.removeItem('ptit_refresh_token');
  localStorage.removeItem('ptit_user');
  window.location.href = '/';
}

// Refresh access token
async function doRefreshToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(API_BASE_URL + '/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const data = await response.json();

    if (data.data && (data.data.accessToken || data.data.token)) {
      const newToken = data.data.accessToken || data.data.token;
      localStorage.setItem('ptit_token', newToken);
      if (data.data.refreshToken) {
        localStorage.setItem('ptit_refresh_token', data.data.refreshToken);
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Build headers
function buildHeaders(isFormData) {
  const headers = {};

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  return headers;
}

// Xử lý response
async function handleResponse(response) {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Phản hồi từ server không hợp lệ');
  }

  if (!response.ok) {
    const error = new Error(data.message || 'Đã xảy ra lỗi');
    error.status = response.status;
    error.data = data;
    error.errors = data.errors || null;
    throw error;
  }

  return data;
}

// Hàm request chính
async function request(endpoint, options) {
  var opts = options || {};
  var isFormData = opts.isFormData || false;
  var isRetry = opts._isRetry || false;

  var url = API_BASE_URL + endpoint;

  var config = {
    method: opts.method || 'GET',
    headers: buildHeaders(isFormData),
    credentials: 'include',
  };

  if (opts.body !== undefined) {
    if (isFormData) {
      config.body = opts.body;
    } else {
      config.body = JSON.stringify(opts.body);
    }
  }

  try {
    var response = await fetch(url, config);

    // Token hết hạn - thử refresh
    if (response.status === 401 && !isRetry) {
      var refreshed = await doRefreshToken();

      if (refreshed) {
        // Retry với token mới
        var retryConfig = {
          method: config.method,
          headers: buildHeaders(isFormData),
          credentials: 'include',
        };
        if (opts.body !== undefined) {
          if (isFormData) {
            retryConfig.body = opts.body;
          } else {
            retryConfig.body = JSON.stringify(opts.body);
          }
        }
        var retryResponse = await fetch(url, retryConfig);
        return handleResponse(retryResponse);
      } else {
        clearAuthAndRedirect();
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    }

    return handleResponse(response);
  } catch (error) {
    if (error.message === 'Failed to fetch') {
      throw new Error(
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.'
      );
    }
    throw error;
  }
}

// ============ API CLIENT OBJECT ============
var apiClient = {
  // GET với query params
  get: function (endpoint, params) {
    var queryString = '';
    if (params && Object.keys(params).length > 0) {
      var filtered = {};
      Object.keys(params).forEach(function (key) {
        var val = params[key];
        if (val !== undefined && val !== null && val !== '') {
          filtered[key] = val;
        }
      });
      queryString = new URLSearchParams(filtered).toString();
    }
    var url = queryString ? endpoint + '?' + queryString : endpoint;
    return request(url, { method: 'GET' });
  },

  // POST với JSON body
  post: function (endpoint, body) {
    return request(endpoint, { method: 'POST', body: body || {} });
  },

  // PUT với JSON body
  put: function (endpoint, body) {
    return request(endpoint, { method: 'PUT', body: body || {} });
  },

  // PATCH với JSON body
  patch: function (endpoint, body) {
    return request(endpoint, { method: 'PATCH', body: body || {} });
  },

  // DELETE
  delete: function (endpoint) {
    return request(endpoint, { method: 'DELETE' });
  },

  // POST với FormData (upload file)
  postFormData: function (endpoint, formData) {
    return request(endpoint, {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  },

  // PUT với FormData (upload file)
  putFormData: function (endpoint, formData) {
    return request(endpoint, {
      method: 'PUT',
      body: formData,
      isFormData: true,
    });
  },
};

export default apiClient;