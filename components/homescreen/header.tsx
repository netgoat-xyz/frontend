"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function Header() {
  const router = useRouter();
    const t = useTranslations('HomePage');

  return (
    <header className="relative z-20 flex items-center justify-between p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-2">
        <h1 className="text-2xl  tracking-normal text-white font-calsans">
          NetGoat
        </h1>
      </Link>
      {/* Navigation */}
<nav className="relative flex items-center  rounded-full before:absolute before:inset-0">
   <Link href="/" className="relative z-10 text-white/80 hover:text-white hover:px-6 hover:bg-white/15 hover:delay-100 hover:duration-300 text-xs font-light px-3 py-2 rounded-full bg-white/10 transition-all duration-200">
    {t('home')}
  </Link>
     <div className="mx-1 w-[1px] h-6 relative z-10"></div> 

  <Link href="/blog" className="relative z-10 text-white/80 hover:text-white hover:px-6 hover:bg-white/15 hover:delay-100 hover:duration-300 text-xs font-light px-3 py-2 rounded-l-full bg-white/10 transition-all duration-200">
    {t('blogs')}
  </Link>
  <Link href="https://docs.netgoat.xyz" className="relative z-10 text-white/80 hover:text-white hover:px-6 hover:bg-white/15 hover:delay-100 hover:duration-300 text-xs font-light px-3 py-2 rounded-r-full bg-white/10 transition-all duration-200">
    {t('docs')}
  </Link>
   <div className="mx-1 w-[1px] h-6 relative z-10"></div> 
  <Link href="https://discord.gg/3aJ7MdJsZV" className="relative z-10 text-white/80 hover:text-white hover:px-6 hover:bg-white/15 hover:delay-100 hover:duration-300 text-xs font-light px-3 py-2 rounded-l-full bg-white/10 transition-all duration-200">
    Discord
  </Link>
  <Link href="https://github.com/netgoat-xyz/netgoat" className="relative z-10 text-white/80 hover:text-white hover:px-6 hover:bg-white/15 hover:delay-100 hover:duration-300 text-xs font-light px-3 py-2 rounded-r-full bg-white/10 transition-all duration-200">
    {t('source_code')}
  </Link>
</nav>

      {/* Login Button Group with Arrow */}
      <div
        id="gooey-btn"
        className="relative flex items-center group"
        style={{ filter: "url(#gooey-filter)" }}
      >
        <button onClick={() => { router.push('/auth') }} className="absolute right-0 px-2.5 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 17L17 7M17 7H7M17 7V17"
            />
          </svg>
        </button>
        <button onClick={() => { router.push('/auth') }} className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10">
          {t('login')}
        </button>
      </div>
    </header>
  );
}
