import axios from "axios";


const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

export const getSchoolProfile = async () => {
    // for principal to access only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/school/config`, {
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

export const updateSchoolProfile = async (name, address, motto, phone, email) => {
    // for principal access only 
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.put(`${backendUrl}/api/v1/school/config`, {
            name, address, motto, phone, email
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

export const getScoreComponentMaximums = async (params) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/school/score-config`, {
            headers: {
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

export const updateScoreMaximums = async (ca1_max, ca2_max, exam_max) => {
    try {
        // principal only
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.put(`${backendUrl}/api/v1/school/score-config`, {
            ca1_max, ca2_max, exam_max
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

export const getGradingScheme = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/school/grading`, {
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

export const replaceFullGradingSystem = async (bands) => {
    // Principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await axios.put(
            `${backendUrl}/api/v1/school/grading`,
            {
                bands,
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return res.data;
    } catch (error) {
        throw new Error(
            error.response?.data?.detail || "Something went wrong"
        );
    }
};

export const listAllAcademicSessions = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/school/sessions`, {
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

export const createAcademicSession = async (name, year) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/school/sessions`, { name, year }, {
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

export const getCurrentAcademicSession = async () => {
    try {
       const token = localStorage.getItem("token");
        if (!token) return; 
        const res = await axios.get(`${backendUrl}/api/v1/school/sessions/current`, {
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

export const setSessionAsCurrent = async (session_id) => {
    try {
        // principal only
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/school/sessions/${session_id}/set-current`, {}, {
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

export const listTermsForSession = async (session_id) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/school/sessions/${session_id}/terms`, {
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

export const getCurrentTerm = async () => {
    try {
       const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/school/terms/current`, {
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

export const createTerm = async (session_id, term_number, name, start_date, end_date) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/school/terms`, { session_id, term_number, name, start_date, end_date }, {
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

export const setTermAsCurrent = async (term_id) => {
    try {
        // principal only
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.patch(`${backendUrl}/api/v1/school/terms/${term_id}/set-current`, {

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