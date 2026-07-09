import { useQuery } from "@tanstack/react-query";
import { getCurrentTerm, getCurrentAcademicSession } from "./school";
import { listStudents, getStudent, getCurrentLoggedInStudent } from "./students";
import { getMyClass, getAssignedSubjects, listClasses } from "./classes";
import { listFeeTypes, getInvoices, studentInvoice, getStudentFeesStatusForTerm } from "./fees";
import { listAllStaff } from "./staff";
import { getAllPendingResults, getResultsForClass, getStudentResults } from "./results";

export const useGetSession = () => {
    return useQuery({
        queryKey: ["session"],
        queryFn: getCurrentAcademicSession,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });
};

export const useGetTerm = () => {
    return useQuery({
        queryKey: ["term"],
        queryFn: getCurrentTerm,
        retry: false,
        staleTime: 1000 * 60 * 5,
    });
};

export const useStudents = (filters) => {
    return useQuery({
        queryKey: ["students", filters],
        queryFn: () => listStudents(
            filters.class_id || undefined,
            filters.active_only || undefined,
            filters.search || undefined,
            filters.sort_by || undefined,
            filters.sort_order || undefined,
        ),
        staleTime: 1000 * 60 * 5,
        retry: false,
        select: (data) => data?.students ?? data ?? [],
    });
};


export const useLoggedInStudent = () => {
    return useQuery({
        queryKey: ["student"],
        queryFn: () => getCurrentLoggedInStudent(),
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
}

export const useStudent = (student_id) => {
    return useQuery({
        queryKey: ["student", student_id],
        queryFn: () => getStudent(student_id),
        staleTime: 1000 * 60 * 5,
        retry: false,
        enabled: !!student_id,
    });
};

export const useClasses = (level) => {
    return useQuery({
        queryKey: ["classes", level],
        queryFn: () => listClasses(level),
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
};


export const useGetTeachersClass = () => {
    return useQuery({
        queryKey: ["class"],
        queryFn: () => getMyClass(),
        staleTime: 1000 * 60 * 5,
        retry: false,
    });
};

export const useAssignedSubjects = (class_id, term_id) => {
    return useQuery({
        queryKey: ["assigned-subjects", class_id, term_id],
        queryFn: () => getAssignedSubjects(class_id, term_id),
        staleTime: 1000 * 60 * 5,
        retry: false,
        enabled: !!class_id && !!term_id,
        select: (data) => data?.subjects ?? data ?? [],
    });
};

export const useFeeTypes = () => {
    return useQuery({
        queryKey: ["fee-types"],
        queryFn: () => listFeeTypes(),
        staleTime: 1000 * 60 * 5,
        retry: false,
        select: (data) => data?.fee_types ?? data ?? [],
    });
};

// Invoices for principal/bursar — filters: term_id, class_id, status
export const useInvoices = (filters) => {
    return useQuery({
        queryKey: ["invoices", filters],
        queryFn: () => getInvoices(filters.term_id, filters.class_id, filters.status),
        staleTime: 1000 * 60 * 2, // 2 min — payment status changes frequently
        retry: false,
        enabled: !!filters.term_id,
        select: (data) => data?.invoices ?? data ?? [],
    });
};

// All staff — for dashboard count and staff page
export const useStaff = () => {
    return useQuery({
        queryKey: ["staff"],
        queryFn: () => listAllStaff(),
        staleTime: 1000 * 60 * 5,
        retry: false,
        select: (data) => data?.users ?? data ?? [],
    });
};

// Student's own invoice for a term
export const useStudentInvoice = (term_id) => {
    return useQuery({
        queryKey: ["my-invoice", term_id],
        queryFn: () => studentInvoice(term_id),
        staleTime: 1000 * 60 * 2,
        retry: false,
        enabled: !!term_id,
    });
};

// Student fee status for a specific term (used in student detail / overrides)
export const useStudentFeeStatus = (student_id, term_id) => {
    return useQuery({
        queryKey: ["student-fee-status", student_id, term_id],
        queryFn: () => getStudentFeesStatusForTerm(student_id, term_id),
        staleTime: 1000 * 60 * 2,
        retry: false,
        enabled: !!student_id && !!term_id,
    });
};


export const usePendingResults = () => {
    return useQuery({
        queryKey: ["pending-results"],
        queryFn: getAllPendingResults,
        staleTime: 1000 * 60 * 2,
        retry: false,
        select : (data) => data?.results ?? data ?? [],
    });
};

export const useClassResults = (class_id, term_id) => {
    return useQuery({
        queryKey: ["class-results", class_id, term_id],
        queryFn: () => getResultsForClass(class_id, term_id),
        staleTime: 1000 * 60 * 2,
        retry: false,
        enabled: !!class_id && !!term_id,
        select: (data) => data?.results ?? data ?? [],
    });
};


export const useStudentResults = (term_id) => {
    return useQuery({
        queryKey: ["my-results", term_id],
        queryFn: () => getStudentResults(term_id),
        staleTime: 1000 * 60 * 2,
        retry: false,
        enabled: !!term_id,
    });
};