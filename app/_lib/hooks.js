import { useQuery } from "@tanstack/react-query";
import { getCurrentTerm, getCurrentAcademicSession } from "./school";
import { listStudents, getStudent } from "./students";
import { getMyClass, getAssignedSubjects} from "./classes";

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

export const useStudent = (student_id) => {
    return useQuery({
        queryKey: ["student", student_id],
        queryFn: () => getStudent(student_id),
        staleTime: 1000 * 60 * 5,
        retry: false,
        enabled: !!student_id,
    });
};

export const useGetTeachersClass = () => {
    return useQuery({
        queryKey: ["class"],
        queryFn: () => getMyClass(),
        staleTime: 1000 * 60 * 5,
        retry: false,
    })
}

export const useAssignedSubjects = (class_id, term_id) => {
    return useQuery({
        queryKey: ["assigned-subjects", class_id, term_id],
        queryFn: () => getAssignedSubjects(class_id, term_id),
        staleTime: 1000 * 60 * 5,
        retry: false,
        enabled: !!class_id && !!term_id,
        select: (data) => data?.subjects ?? data ?? [],
    })
}