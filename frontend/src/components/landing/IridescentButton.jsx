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
  style = {},
  className = '',
  target,
  rel,
}) {
  const content = (
    <>
      <span className="iridescent-disc" aria-hidden="true">
        <span className="iridescent-ring" />
        <Icon size={14} className="iridescent-icon" strokeWidth={2.2} />
      </span>
      <span className="iridescent-label">{children}</span>
    </>
  );

  const sharedProps = {
    className: `iridescent-pill ${className}`,
    style,
    onClick,
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
