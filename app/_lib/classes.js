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

export const getMyClass = async () => {
  // for logged in class teacher to get thier class details 
   try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${backendUrl}/api/v1/classes/my-class`, {
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

export const generateClassCode = async (class_id) => {
        //  form teacher only
        try {
            const token = localStorage.getItem("token");
            if (!token) throw new Error("Please sign in again to create a class code.");
            const res = await axios.post(`${backendUrl}/api/v1/classes/${class_id}/registration-code`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return res.data;
        }
        catch (error) {
            throw new Error(
                error.response?.data?.detail || error.message || "Could not create the class code."
            );
        }
}

export const viewClassCode = async (class_id) => {
    //  form teacher only
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Please sign in again to view the class code.");
        const res = await axios.get(`${backendUrl}/api/v1/classes/${class_id}/registration-code`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        
        return res.data;
    }
    catch (error) {
        if (error.response?.status === 404) return null;
        throw new Error(
            error.response?.data?.detail || error.message || "Could not load the class code."
        );
    }
}


export const revokeClassCode = async (class_id) => {
    //  form teacher only
    try {  
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.delete(`${backendUrl}/api/v1/classes/${class_id}/registration-code`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }
    catch (error) {
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
            class_id,
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


export const getPendingStudentForClassn = async (class_id) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const res = await axios.get(`${backendUrl}/api/v1/classes/my-class/pending-students`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            // query required for principal and vp
            params: {
                class_id
            }
        });
        return res.data;
    }
    catch (error) {
        throw new Error(
            Array.isArray(error.response?.data?.detail)
              ? error.response.data.detail.map((item) => item.msg).join(", ")
              : error.response?.data?.detail || error.message || "Could not update student registration."
        );
    }
}

export const approveStudentForClass = async (class_id, student_id) => {
    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const res = await axios.post(`${backendUrl}/api/v1/classes/my-class/students/${student_id}/approve`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
       
        return res.data;
    }
    catch (error) {
        throw new Error(
            Array.isArray(error.response?.data?.detail)
              ? error.response.data.detail.map((item) => item.msg).join(", ")
              : error.response?.data?.detail || error.message || "Could not update student registration."
        );
    }
}


export const rejectStudentForClass = async (class_id, student_id, reason) => {

    try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Your session has expired. Please sign in again.");
        const res = await axios.post(`${backendUrl}/api/v1/classes/my-class/students/${student_id}/reject`, {reason}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return res.data;
    }
    catch (error) {
        throw new Error(
            Array.isArray(error.response?.data?.detail)
              ? error.response.data.detail.map((item) => item.msg).join(", ")
              : error.response?.data?.detail || error.message || "Could not update student registration."
        );
    }
}
