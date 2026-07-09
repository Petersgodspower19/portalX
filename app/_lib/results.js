import axios from "axios";
const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

export const uploadResult = async (class_id, subject_id, term_id, file) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const formData = new FormData();
        formData.append("file", file);

        const res = await axios.post(`${backendUrl}/api/v1/results/upload`, formData, {
            params: {
                class_id, subject_id, term_id
            },
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            }
        });
        return res.data;
    } catch (error) {
        console.log(error);
        console.log(error.response?.data?.detail || "Something went wrong")
        throw new Error(
            error.response?.data?.detail || "Something went wrong"
        );
    }
}

export const confirmUpload = async (upload_id) => {
    // form teacher only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/results/confirm`, {upload_id}, {
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

export const getAllPendingResults = async () => {
    // principal and vp only to get all results with SUBMITTED status
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/results/pending`, {
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

export const getResultsForClass = async (class_id, term_id) => {
    // staff only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/results/class`, {
            params: {
                class_id, term_id
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

export const approveResultsForTerm = async (class_id, term_id) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/results/approve`, {class_id, term_id}, {
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

export const rejectResultsForTerm = async (class_id, term_id, rejection_reason) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/results/reject`, {class_id, term_id, rejection_reason}, {
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

export const lockTerm = async (term_id) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/results/terms/${term_id}/lock`, {}, {
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

export const unlockTerm = async (term_id) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/results/terms/${term_id}/unlock`, {}, {
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

export const getStudentResults = async (term_id) => {
    // student to access result but fee gate enforced
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/results/me`, {
            params: {
                term_id
            },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log(res.data);
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
}

export const downloadMyResultsAsPdf = async (term_id) => {
    // student downloads thier results as pdf
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/results/me/pdf`, {
            params: {
                term_id
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

export const verifyResultsAuthenticity = async (token) => {
    // public endpoint
    try {
        const res = await axios.get(`${backendUrl}/api/v1/results/verify/${token}`, {
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

