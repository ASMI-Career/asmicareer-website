import localFont from "next/font/local";
import "./globals.css";
import "./medical/medical.css";
import "./engineering/engineering.css";
import "./medical/inquiry/inquiry.css";
import AttributionCapture from "./components/AttributionCapture";

// Fonts are bundled in app/fonts (not downloaded from Google at build time), so a deploy never depends on Google being reachable.
const montserrat = localFont({
  src: "./fonts/montserrat-latin-wght-normal.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-montserrat",
});

const openSans = localFont({
  src: "./fonts/open-sans-latin-wght-normal.woff2",
  weight: "300 800",
  display: "swap",
  variable: "--font-opensans",
});

export const metadata = {
  title: "ASMI Career — Medical & Engineering Admissions",
  description: "India's most trusted NEET & JEE counselling. MBBS, BDS, AYUSH, and Engineering admissions across India.",
  icons: {
    icon: "/asmi-logo.png",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${openSans.variable}`}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap" rel="stylesheet" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,600,500,400&display=swap" rel="stylesheet" />
        <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" async></script>
      </head>
      <body>
        <AttributionCapture />
        {children}
      </body>
    </html>
  );
}
