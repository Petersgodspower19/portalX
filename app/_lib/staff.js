import axios from "axios";


const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

export const listAllStaff = async (role, active_only) => {
    // principal and vp only 
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/users`, {
            params: {
                role, active_only
            }, headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data
    } catch (error) {
        throw new Error(
            error.response?.data?.detail || "Something went wrong"
        );
    }
}


export const createStaffAccount = async (first_name, last_name, email, phone, role) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/users`, {first_name, last_name, email, phone, role}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(res.data);
        return res.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.detail || "Something went wrong"
        );
    }
}

export const getStaff = async (user_id) => {
    // principal and vp only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/users/${user_id}`, {
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

export const updateStaffDetails = async (user_id, first_name, last_name, phone) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.patch(`${backendUrl}/api/v1/users/${user_id}`, {first_name, last_name, phone}, {
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

export const deactivateStaff = async (user_id, reason) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/users/${user_id}/deactivate`, {reason}, {
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

export const reactivateStaff = async (user_id) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/users/${user_id}/reactivate`, {}, {
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