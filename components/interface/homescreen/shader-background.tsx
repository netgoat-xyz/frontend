import type React from "react";

interface ShaderBackgroundProps {
  children: React.ReactNode;
}

export default function ShaderBackground({ children }: ShaderBackgroundProps) {
  return (
    <div className="bg-black relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] bg-size-[20px_20px]" />
        <div className="absolute -top-20 -left-20 w-150 h-150 bg-violet-600/20 rounded-full blur-[128px] overflow-x-hidden " />
        <div className="absolute top-1/4 -right-32 w-150 h-150 bg-indigo-600/15 rounded-full blur-[128px] overflow-x-hidden " />
        <div className="absolute -bottom-32 left-1/3 w-200 h-200 bg-purple-900/20 rounded-full blur-[140px] overflow-x-hidden " />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[96px]" />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-fuchsia-600/10 rounded-full blur-[96px]" />
        <div className="absolute top-20 right-[20%] w-64 h-64 bg-cyan-900/15 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-225 h-225 bg-slate-900/50 rounded-full blur-[160px] mix-blend-overlay" />
      </div>

      <svg className="absolute inset-0 w-0 h-0 pointer-events-none">
        <defs>
          <filter
            id="glass-effect"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feTurbulence baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.3" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0.02
                      0 1 0 0 0.02
                      0 0 1 0 0.05
                      0 0 0 0.9 0"
              result="tint"
            />
          </filter>
          <filter
            id="gooey-filter"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  
                      0 1 0 0 0  
                      0 0 1 0 0  
                      0 0 0 19 -9"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}