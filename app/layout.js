import { ToastContainer } from "react-toastify";
import "./globals.css";
import { AuthProvider } from "./_lib/AuthContext";

export const metadata = {
  title: "PortalX",
  description: "School management portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
        {children}
         <ToastContainer position="top-right" autoClose={3000} />
         </AuthProvider>
      </body>
    </html>
  );
}