import "./globals.css";

export const metadata = {
  title: "PortalX",
  description: "School management portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}