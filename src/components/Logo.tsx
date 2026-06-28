import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 48 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-transform duration-300 hover:scale-105`}
    >
      <defs>
        {/* Dynamic gradient for the location pin */}
        <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" /> {/* Emerald 500 */}
          <stop offset="50%" stopColor="#059669" /> {/* Emerald 600 */}
          <stop offset="100%" stopColor="#064e3b" /> {/* Emerald 900 */}
        </linearGradient>
        {/* Dynamic gradient for the paper plane shadow */}
        <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>

      {/* Main Location Pin Body */}
      <path
        d="M50 8C29 8 12 25 12 46C12 73 50 92 50 92C50 92 88 73 88 46C88 25 71 8 50 8ZM50 63C40.6 63 33 55.4 33 46C33 36.6 40.6 29 50 29C59.4 29 67 36.6 67 46C67 55.4 59.4 63 50 63Z"
        fill="url(#pinGradient)"
        className="drop-shadow-md"
      />

      {/* Outer Glow / Outline */}
      <path
        d="M50 5C27.4 5 9 23.4 9 46C9 75.8 50 95 50 95C50 95 91 75.8 91 46C91 23.4 72.6 5 50 5Z"
        stroke="#047857"
        strokeWidth="1.5"
        strokeOpacity="0.2"
        fill="none"
      />

      {/* Origami Paper Plane Enclosed */}
      <g transform="translate(1, 0)">
        {/* Main top triangle wings */}
        <path
          d="M66.5 33.5L33.5 48.5L46.5 53.5L66.5 33.5Z"
          fill="url(#planeGradient)"
          stroke="#064e3b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right side wing details */}
        <path
          d="M66.5 33.5L46.5 53.5L51.5 66.5L66.5 33.5Z"
          fill="#f8fafc"
          stroke="#064e3b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Fold crease shadow */}
        <path
          d="M46.5 53.5L43.5 61.5L51.5 53.5"
          fill="#cbd5e1"
          stroke="#064e3b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export default Logo;
