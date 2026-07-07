import axios from "axios";
const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;


export const listStudents = async (class_id, active_only, search, sort_by, sort_order) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/students`, {
            params: {
                class_id,
                active_only,
                search,
                sort_by,
                sort_order
            },
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

export const enrollStudent = async (first_name, last_name, gender, date_of_birth, class_id, guardian_name, guardian_phone, guardian_email ) => {
    // principal and vp only

    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/students`, {
            first_name, 
            last_name, 
            gender, 
            date_of_birth, 
            class_id, 
            guardian_name, 
            guardian_phone, 
            guardian_email 
        }, {
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

export const bulkImport = async (file) => {
    // principal and vp only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/students/bulk-import`, {file}, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data"
            }
        });
        return res.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.detail || "Something went wrong"
        );
    }
}

export  const getStudent = async (student_id) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/students/${student_id}`, {
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

export const transferStudentToAnotherClass = async (new_class_id, transfer_reason, student_id) => {
    // principal or vp only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/students/${student_id}/transfer`, {new_class_id, transfer_reason}, {
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

export const deactivateStudent = async (student_id, reason) => {
    // principal and vp only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/students/${student_id}/deactivate`, {reason}, {
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