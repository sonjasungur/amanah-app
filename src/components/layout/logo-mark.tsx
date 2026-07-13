import { cn } from "@/lib/utils/cn";

/** Compact MW monogram — used in header and as app icon source */
export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("rounded-xl shrink-0", className)}
      aria-hidden
    >
      <rect width="512" height="512" rx="96" fill="#0B1511"/>
      <path d="M112 392V208c0-48 48-88 144-88s144 40 144 88v184" stroke="#166534" strokeWidth="14" fill="none" strokeLinecap="round"/>
      <path d="M148 340V172l52 96 52-96v168" stroke="#F8FAFC" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M268 340V172l44 68 44-68v168" stroke="#F8FAFC" strokeWidth="36" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="256" cy="128" r="10" fill="#15803D"/>
    </svg>
  );
}
