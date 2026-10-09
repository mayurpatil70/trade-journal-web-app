import { useTheme } from "./theme-provider";

export default function BrandLogo({ className = "", ...rest }) {
  const { theme } = useTheme();
  const src = theme === "dark" ? "/logo-256.webp" : "/logo-256-light.webp";
  return <img src={src} alt="Forex Notes" className={className} {...rest} />;
}
