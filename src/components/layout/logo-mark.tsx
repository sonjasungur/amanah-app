import { cn } from "@/lib/utils/cn";

/** Mihrab arch + held document — app icon & header symbol (no letterforms) */
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
      <rect width="512" height="512" rx="96" fill="#0B1511" />
      <path fill="#166534" d="M72 424V248c0-108 184-132 184-132s184 24 184 132v176H72z" />
      <rect x="152" y="184" width="208" height="248" rx="24" fill="#F8FAFC" />
      <rect x="188" y="232" width="136" height="20" rx="10" fill="#14532D" />
      <rect x="188" y="276" width="96" height="20" rx="10" fill="#14532D" opacity="0.55" />
      <circle cx="256" cy="376" r="18" fill="#15803D" />
    </svg>
  );
}
