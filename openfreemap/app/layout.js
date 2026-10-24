import "./globals.css";

export const metadata = {
  title: "Mangalore Street Assets",
  description: "Place CCTV cameras and traffic lights on a 3D OpenFreeMap view.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
