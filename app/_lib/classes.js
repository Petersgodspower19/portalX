import axios from "axios";
const backendUrl = process.env.NEXT_PUBLIC_BACKENDURL;

export const listClasses = async (level) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${backendUrl}/api/v1/classes`, {
        params: {
            level
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

export const createClass = async (name, arm, level, form_teacher_id) => {
    // principal and vice principal only
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.post(`${backendUrl}/api/v1/classes`, {name , arm, level, form_teacher_id}, {
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

export const updateClass = async (class_id, form_teacher_id) => {
    // assign form teacher
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.patch(`${backendUrl}/api/v1/classes/${class_id}`, {form_teacher_id}, {
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

export const listSubjects = async (level) => {
    try {
        const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${backendUrl}/api/v1/subjects`, {
        params: {
            level
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

export const createSubject = async (name, code, level) => {
    // principal or vp only
    try {
        const token = localStorage.getItem("token");
      if (!token) return; 
      const res = await axios.post(`${backendUrl}/api/v1/subjects`, {name, code, level}, {
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

export const deleteSubject = async (subject_id) => {
    // principal only
    try {
         const token = localStorage.getItem("token");
      if (!token) return; 
      const res = await axios.delete(`${backendUrl}/api/v1/subjects/${subject_id}`, {
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

export const getAssignedSubjects = async (class_id, term_id) => {
    try {
        const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${backendUrl}/api/v1/classes/${class_id}/subjects`, {
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

export const assignSubject = async (class_id, subject_id, teacher_id, term_id) => {
  // principal and vp only
    try {
        const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.post(`${backendUrl}/api/v1/class-subjects`, {class_id, subject_id, teacher_id, term_id}, {
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
