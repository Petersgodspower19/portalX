import axios from "axios";
const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

export const listFeeTypes = async () => {
    try {
       const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${backendUrl}/api/v1/fees/types`, {
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

export const createFeeType = async (name, category, amount, is_mandatory) => {
    // principal and bursar only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/fees/types`, 
            {name, category, amount, is_mandatory}, {
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


export const updateFeeType = async (fee_type_id, name, amount, is_mandatory, is_active) => {
    // principal and bursar only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.patch(`${backendUrl}/api/v1/fees/types/${fee_type_id}`, 
            {name, amount, is_mandatory, is_active}, {
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


export const createInvoices = async (term_id, class_id) => {
    // principal or bursar only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/fees/invoices/generate`, 
            {term_id, class_id}, {
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

export const getInvoices = async (term_id, class_id, status) => {
    // principal, vp or bursar only
    try {
       const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/fees/invoices`, {
            params: {
                term_id, class_id, status
            }, headers: {
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


export const studentInvoice = async (term_id) => {
    // student sees thier own invoice
    try {
       const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/fees/invoices/me`, {
            params: {
                term_id
            }, headers: {
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

export const markInvoiceAsPaid = async (invoice_id, payment_note) => {
    // principal or bursar only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const body = payment_note?.trim() ? { payment_note } : {};
        const res = await axios.post(`${backendUrl}/api/v1/fees/invoices/${invoice_id}/pay`, body, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    } catch (error) {
         const detail = error.response?.data?.detail;

    let message = "Something went wrong";

    if (Array.isArray(detail)) {
        message = detail.map(err => err.msg).join(", ");
    } else if (typeof detail === "string") {
        message = detail;
    }

    throw new Error(message);
       
    }
}

export const markInvoiceAsUnPaid = async (invoice_id, reversal_reason) => {
    // principal or bursar only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/fees/invoices/${invoice_id}/unpay`,
             {reversal_reason}, {
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

export const grantFeeOverride = async (student_id, reason) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.post(`${backendUrl}/api/v1/fees/override`, {student_id, reason}, 
            {
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

export const removeFeeOverride = async (student_id) => {
    // principal only
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.delete(`${backendUrl}/api/v1/fees/override/${student_id}`, {}, 
            {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    } catch (error) {
        
    }
}

export const getStudentFeesStatusForTerm = async (student_id, term_id) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${backendUrl}/api/v1/fees/status/${student_id}`, {
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

