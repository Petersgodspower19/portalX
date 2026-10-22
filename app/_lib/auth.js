import axios from "axios";

const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

const api = axios.create({ baseURL: backendUrl });

function registrationError(error) {
  const detail = error.response?.data?.detail;
  return new Error(Array.isArray(detail)
    ? detail.map((item) => item.msg).join(", ")
    : typeof detail === "string" ? detail : "Could not complete student registration. Please try again.");
}

export const checkUsername = async (username, signal) => {
  try {
    const { data } = await axios.get(`${backendUrl}/api/v1/auth/check-username`, {
      params: { username }, signal,
    });
    if (typeof data === "boolean") return data;
    for (const key of ["available", "is_available", "username_available"]) {
      if (typeof data?.[key] === "boolean") return data[key];
    }
    for (const key of ["taken", "is_taken", "exists"]) {
      if (typeof data?.[key] === "boolean") return !data[key];
    }
    throw new Error("Could not read username availability. Please try again.");
  } catch (error) {
    if (!error.response) throw error;
    throw registrationError(error);
  }
};

export const registerStudent = async (payload) => {
  try {
    const { data } = await axios.post(`${backendUrl}/api/v1/auth/student-register`, payload);
    console.log("registerStudent response:", data);
    return data;
  } catch (error) {
    throw registrationError(error);
  }
};

// Attach the access token to every outgoing request automatically.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If a request comes back 401, try refreshing the access token once and
// replay the original request. If refresh itself fails, log the user out.
let isRefreshing = false;
let pendingQueue = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Wait for the in-flight refresh to finish, then retry with the new token.
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, originalRequest });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("No refresh token");

      const { access_token } = await refreshAccessToken(refreshToken);
      localStorage.setItem("token", access_token);

      pendingQueue.forEach(({ resolve, originalRequest: req }) => {
        req.headers.Authorization = `Bearer ${access_token}`;
        resolve(api(req));
      });
      pendingQueue = [];

      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      pendingQueue.forEach(({ reject }) => reject(refreshError));
      pendingQueue = [];

      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export const login = async (identifier, password) => {
  try {
    const response = await axios.post(`${backendUrl}/api/v1/auth/login`, {
      identifier,
      password,
    });
    return response.data;
  } catch (error) {
    console.log(error)
    console.log(error.response?.status);
    console.log(error.response?.data?.detail);
    throw new Error(error.response?.data?.detail || "Something went wrong");
  }
};

export const refreshAccessToken = async (refresh_token) => {
  try {
    const res = await axios.post(`${backendUrl}/api/v1/auth/refresh`, {
      refresh_token,
    });
    return res.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Something went wrong");
  }
};

// export const verify2faOtp = async () => {

// }

export const getCurrentUserProfile = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;
  const res = await api.get("/api/v1/auth/me");
  return res.data;
};

export const changePassword = async (current_password, new_password, confirm_password) => {
 try {
     const res = await api.post("/api/v1/auth/password/change", {
    current_password,
    new_password,
    confirm_password,
  });
  return res.data;
 } catch (error) {
    console.log(error.response?.status);
    console.log(error.response?.data);

    const detail = error.response?.data?.detail;

    if (Array.isArray(detail)) {
        throw new Error(detail.map(e => e.msg).join(", "));
    }

    throw new Error(detail || "Something went wrong");
 }
};

// console.log(error.response?.status);
//     console.log(error.response?.data);

//     const detail = error.response?.data?.detail;

//     if (Array.isArray(detail)) {
//         throw new Error(detail.map(e => e.msg).join(", "));
//     }

//     throw new Error(detail || "Something went wrong");

export const resetStaffMemberPassword = async (user_id) => {
  const res = await api.post("/api/v1/auth/password/reset/staff", { user_id });
  return res.data;
};

export const logout = async () => {
  const token = localStorage.getItem("token");
  if (!token) return;
  const res = await api.post("/api/v1/auth/logout", {});
  return res.data;
};
