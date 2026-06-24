import axios from "axios";

const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

export const login = async (identifier, password) => {
  try {
    const response = await axios.post(
      `${backendUrl}/api/v1/auth/login`,
      {
        identifier,
        password,
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.detail || "Something went wrong"
    );
  }
};


// export const verify2faOtp = async () => {
    
// }

export const getCurrentUserProfile = async () => {
    try {
        const token = localStorage.getItem("token");
        if(!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    } catch (error) {
        throw new Error(
      error.response?.data?.detail || "Something went wrong"
    );
    }
}

export const changePassword = async (current_password, new_password, confirm_password) => {
    try {
        const token = localStorage.getItem("token");
        if(!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/auth/password/change`, {
            current_password, new_password, confirm_password
        }, {
           headers: {
                Authorization: `Bearer ${token}`
            } 
        });
        return res.data;
    } catch (error) {
         throw new Error(
      error.response?.data?.detail || "Something went wrong"
         )
    }
}

export const resetStaffMemberPassword = async (user_id) => {
    try {
        const token = localStorage.getItem("token");
        if(!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/auth/password/reset/staff`, {user_id}, {
             headers: {
                Authorization: `Bearer ${token}`
            }
        })
    } catch (error) {
        throw new Error(
      error.response?.data?.detail || "Something went wrong"
         )
    }
}

export const logout = async () => {
    try {
        const token = localStorage.getItem("token");
        if(!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/auth/logout`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    } catch (error) {
        throw new Error(
      error.response?.data?.detail || "Something went wrong"
         )
    }
}