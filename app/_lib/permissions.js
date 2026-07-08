export const roleRoutes = {
  principal: ["/dashboard", "/students", "/classes", "/results", "/fees", "/staff", "/audit", "/school-profile"],
  vice_principal: ["/dashboard", "/students", "/classes", "/results", "/fees", "/staff"], // read-only inside these
  form_teacher: ["/my-class", "/results"],
  bursar: ["/fees"],
  student: ["/my-results", "/my-fees"],
};

// First route in each role's list = where they land after login
// and where ProtectedRoute sends them if they hit a route they can't access.
export const getDefaultRoute = (role) => roleRoutes[role]?.[0] ?? "/login";