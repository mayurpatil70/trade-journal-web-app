export default function BrandLogo({ className = "", ...rest }) {
  return (
    <img
      src="/logo-brand-384.webp"
      srcSet="/logo-brand-384.webp 384w, /logo-brand-768.webp 768w"
      sizes="(max-width: 640px) 80px, 120px"
      alt="Forex Notes"
      className={className}
      {...rest}
    />
  );
}
