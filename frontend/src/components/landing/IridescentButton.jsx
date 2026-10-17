// frontend/src/components/landing/IridescentButton.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function IridescentButton({
  to = '/login',
  href,
  onClick,
  children = 'CLAIM ACCESS',
  icon: Icon = ArrowRight,
  size = 'md',
  style = {},
  className = '',
  target,
  rel,
  ...rest
}) {
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  const sizeClass = size === 'sm' ? 'iridescent-pill-sm' : size === 'lg' ? 'iridescent-pill-lg' : '';

  const content = (
    <>
      <span className="iridescent-disc" aria-hidden="true">
        <span className="iridescent-ring" />
        <Icon size={iconSize} className="iridescent-icon" strokeWidth={2.4} />
      </span>
      <span className="iridescent-label">{children}</span>
    </>
  );

  const sharedProps = {
    className: `iridescent-pill ${sizeClass} ${className}`.trim(),
    style,
    onClick,
    ...rest,
  };

  if (href) {
    return (
      <a href={href} target={target} rel={rel} {...sharedProps}>
        {content}
      </a>
    );
  }

  if (to) {
    return (
      <Link to={to} {...sharedProps}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" {...sharedProps}>
      {content}
    </button>
  );
}
