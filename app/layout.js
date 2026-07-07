import { ToastContainer } from "react-toastify";
import "./globals.css";
import { AuthProvider } from "./_lib/AuthContext";
import ReactQueryProvider from "./_lib/ReactQueryProvider";

export const metadata = {
  title: "PortalX",
  description: "School management portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
        <AuthProvider>
        {children}
         <ToastContainer position="top-right" autoClose={3000} />
         </AuthProvider>
         </ReactQueryProvider>
      </body>
    </html>
  );
}