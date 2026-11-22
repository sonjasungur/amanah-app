import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";

/**
 * Wasiyya brand (owner approval 22.11.2026, design Y2 „Buch mit Siegel“):
 * a closed book with a gold seal star and a gold bookmark ribbon — the kept testament.
 * Source: docs/qa/p27-wissenszentrum/logo/wasiyya/make_wasiyya2.py and logo/app/make_app.py (not committed).
 */
export const WASIYYA_NAVY = "#1F2C4A";
export const WASIYYA_NAVY_TEXT = "#1A2440";
export const WASIYYA_GOLD = "#C9A04A";
export const WASIYYA_GOLD_TEXT = "#8A6A22";
export const WASIYYA_IVORY = "#FAF7F0";

const STAR = "104.0,76.0 107.3,84.1 115.3,80.7 111.9,88.7 120.0,92.0 111.9,95.3 115.3,103.3 107.3,99.9 104.0,108.0 100.7,99.9 92.7,103.3 96.1,95.3 88.0,92.0 96.1,88.7 92.7,80.7 100.7,84.1";
/** „Wasiyya“ set in Marcellus (OFL) at 96 units, tracking 0.03, converted to a path: no web font needed. */
const WORDMARK = "M50.6 -58.4 69.3 -12.8 87.6 -57.5Q88.6 -60.3 89.2 -62.2Q89.7 -64.1 89.7 -65.5Q89.7 -65.9 89.6 -66.4Q89.6 -66.8 89.5 -67V-67.2H98.8V-67Q97.8 -66 96.7 -63.8Q95.6 -61.5 94.2 -58.2L69.1 1.5H65.6L47.3 -42.8L30.7 1.5H27.2L4.2 -55.9Q3.4 -57.9 2.5 -59.8Q1.6 -61.6 0.9 -63.1Q0.1 -64.6 -0.5 -65.7Q-1.2 -66.7 -1.5 -67V-67.2H11.5V-67Q11.4 -66.5 11.4 -66.2Q11.4 -66 11.4 -65.6Q11.4 -64 11.8 -62.2Q12.1 -60.4 13.2 -57.9L30.8 -13.4L47.6 -58.2ZM103.7 -13.8Q103.7 -17.5 105.2 -20.2Q106.8 -23 109.3 -24.9Q111.8 -26.8 115.1 -28Q118.3 -29.2 121.8 -29.9Q125.2 -30.6 128.6 -30.8Q132 -31.1 134.8 -31.1V-33.5Q134.8 -36.6 134 -38.9Q133.2 -41.1 131.7 -42.6Q130.3 -44.1 128.2 -44.8Q126.2 -45.5 123.8 -45.5Q122.1 -45.5 120.4 -45.2Q118.8 -45 117 -44.3Q115.3 -43.6 113.3 -42.5Q111.4 -41.4 109.1 -39.7L108.7 -39.9L111.9 -46.5Q113.4 -47.2 114.9 -47.7Q116.4 -48.1 118 -48.4Q119.5 -48.7 121.1 -48.8Q122.7 -48.9 124.5 -48.9Q129.4 -48.9 132.9 -47.7Q136.4 -46.5 138.7 -44.5Q140.9 -42.4 141.9 -39.6Q142.9 -36.8 142.9 -33.6V-18.3Q142.9 -14.3 143.1 -11.4Q143.2 -8.4 143.3 -6.2Q143.5 -4.1 143.8 -2.6Q144 -1.2 144.3 -0.2V0H133.9V-0.2Q134.2 -0.9 134.3 -1.9Q134.4 -2.8 134.5 -4.1Q133.5 -3.3 132.2 -2.4Q130.8 -1.5 129.1 -0.8Q127.4 -0 125.3 0.4Q123.3 0.8 120.8 0.8Q112.6 0.8 108.2 -3Q103.7 -6.8 103.7 -13.8ZM134.8 -27.5Q130.5 -27.4 126.6 -27Q122.6 -26.5 119.6 -25.1Q116.6 -23.7 114.8 -21.1Q113 -18.5 113 -14.2Q113 -8.7 115.8 -5.8Q118.5 -2.9 123.4 -2.9Q125.6 -2.9 127.5 -3.5Q129.3 -4.1 130.8 -5.1Q132.2 -6 133.2 -7.2Q134.2 -8.3 134.7 -9.4Q134.8 -11.2 134.8 -13.4Q134.8 -15.6 134.8 -18.3ZM181.2 -38.6 180.5 -38.5Q180.2 -39.6 179.5 -40.8Q178.7 -42 177.6 -43Q176.4 -44.1 174.8 -44.7Q173.2 -45.4 171.1 -45.4Q169.6 -45.4 168.3 -45Q167.1 -44.6 166.1 -43.8Q165.1 -42.9 164.6 -41.7Q164 -40.5 164 -38.9Q164 -36.6 165.4 -34.5Q166.9 -32.4 169 -30.4Q171.2 -28.3 173.7 -26.2Q176.2 -24.2 178.4 -21.9Q180.5 -19.7 181.9 -17.1Q183.4 -14.6 183.4 -11.6Q183.4 -9.2 182.5 -7Q181.7 -4.7 179.9 -2.9Q178.2 -1.1 175.4 -0Q172.7 1.1 168.9 1.1Q166.6 1.1 164.7 0.7Q162.7 0.2 161.1 -0.4Q159.5 -1 158.2 -1.8Q156.9 -2.6 155.9 -3.3L156.4 -12.2H157.2Q157.6 -10 158.6 -8.2Q159.5 -6.3 160.9 -5Q162.3 -3.8 164.1 -3Q165.8 -2.3 167.9 -2.3Q171.4 -2.3 173.5 -4.2Q175.5 -6.1 175.5 -9.2Q175.5 -11.7 174.1 -13.8Q172.7 -15.9 170.6 -17.8Q168.5 -19.7 166.1 -21.7Q163.7 -23.6 161.6 -25.8Q159.5 -27.9 158.1 -30.5Q156.7 -33.1 156.7 -36.5Q156.7 -39.2 157.7 -41.5Q158.7 -43.7 160.5 -45.4Q162.3 -47 164.8 -47.9Q167.3 -48.8 170.2 -48.8Q174.1 -48.8 176.7 -47.9Q179.3 -47.1 180.7 -46.4ZM197.1 -29.7Q197.1 -33.7 197 -36.6Q196.9 -39.6 196.7 -41.8Q196.6 -43.9 196.3 -45.4Q196 -46.8 195.8 -47.8V-48H206.6V-47.8Q206.3 -46.8 206.1 -45.4Q205.8 -43.9 205.7 -41.8Q205.5 -39.6 205.4 -36.6Q205.3 -33.7 205.3 -29.7V-18.3Q205.3 -14.3 205.4 -11.4Q205.5 -8.4 205.7 -6.2Q205.8 -4.1 206.1 -2.6Q206.3 -1.2 206.6 -0.2V0H195.8V-0.2Q196 -1.2 196.3 -2.6Q196.6 -4.1 196.7 -6.2Q196.9 -8.4 197 -11.4Q197.1 -14.3 197.1 -18.3ZM196.1 -62.2Q196.1 -63.2 196.5 -64.1Q196.9 -65.1 197.6 -65.7Q198.2 -66.4 199.2 -66.8Q200.1 -67.2 201.2 -67.2Q202.2 -67.2 203.1 -66.8Q204.1 -66.4 204.7 -65.7Q205.4 -65.1 205.8 -64.1Q206.2 -63.2 206.2 -62.2Q206.2 -60 204.8 -58.6Q203.3 -57.1 201.2 -57.1Q200.1 -57.1 199.2 -57.5Q198.2 -57.9 197.6 -58.6Q196.9 -59.3 196.5 -60.2Q196.1 -61.1 196.1 -62.2ZM237.9 -0.6 221.4 -36.7Q220.5 -38.7 219.5 -40.6Q218.5 -42.5 217.6 -44Q216.6 -45.5 215.9 -46.5Q215.2 -47.5 215 -47.8V-48H227.3V-47.8Q227.2 -47.6 227.1 -47.1Q227.1 -46.6 227.1 -46.3Q227.1 -44.8 227.5 -43.1Q228 -41.3 229.2 -38.7L242.1 -10.5L254 -38.3Q254.7 -40 255.5 -42.1Q256.3 -44.2 256.3 -46.3Q256.3 -46.9 256.2 -47.3Q256.1 -47.7 256 -47.8V-48H264.4V-47.8Q263.6 -46.9 262.3 -44.6Q261 -42.4 259.5 -39L237.2 14.3Q236.4 16 235.7 18.1Q234.9 20.2 234.9 22.3Q234.9 22.9 235 23.3Q235.1 23.7 235.2 23.8V24H226.4V23.8Q227.3 22.9 228.6 20.7Q229.9 18.5 231.3 15.1ZM288.9 -0.6 272.4 -36.7Q271.5 -38.7 270.5 -40.6Q269.4 -42.5 268.5 -44Q267.6 -45.5 266.9 -46.5Q266.2 -47.5 266 -47.8V-48H278.3V-47.8Q278.2 -47.6 278.1 -47.1Q278.1 -46.6 278.1 -46.3Q278.1 -44.8 278.5 -43.1Q279 -41.3 280.2 -38.7L293.1 -10.5L304.9 -38.3Q305.7 -40 306.5 -42.1Q307.2 -44.2 307.2 -46.3Q307.2 -46.9 307.1 -47.3Q307 -47.7 306.9 -47.8V-48H315.4V-47.8Q314.5 -46.9 313.3 -44.6Q312 -42.4 310.5 -39L288.1 14.3Q287.4 16 286.6 18.1Q285.9 20.2 285.9 22.3Q285.9 22.9 285.9 23.3Q286 23.7 286.1 23.8V24H277.4V23.8Q278.3 22.9 279.5 20.7Q280.8 18.5 282.3 15.1ZM321.1 -13.8Q321.1 -17.5 322.6 -20.2Q324.1 -23 326.7 -24.9Q329.2 -26.8 332.4 -28Q335.7 -29.2 339.1 -29.9Q342.6 -30.6 346 -30.8Q349.3 -31.1 352.2 -31.1V-33.5Q352.2 -36.6 351.4 -38.9Q350.6 -41.1 349.1 -42.6Q347.7 -44.1 345.6 -44.8Q343.6 -45.5 341.1 -45.5Q339.5 -45.5 337.8 -45.2Q336.2 -45 334.4 -44.3Q332.7 -43.6 330.7 -42.5Q328.8 -41.4 326.5 -39.7L326 -39.9L329.2 -46.5Q330.8 -47.2 332.3 -47.7Q333.8 -48.1 335.3 -48.4Q336.9 -48.7 338.5 -48.8Q340.1 -48.9 341.9 -48.9Q346.8 -48.9 350.3 -47.7Q353.8 -46.5 356 -44.5Q358.2 -42.4 359.3 -39.6Q360.3 -36.8 360.3 -33.6V-18.3Q360.3 -14.3 360.4 -11.4Q360.5 -8.4 360.7 -6.2Q360.9 -4.1 361.1 -2.6Q361.4 -1.2 361.7 -0.2V0H351.3V-0.2Q351.5 -0.9 351.7 -1.9Q351.8 -2.8 351.9 -4.1Q350.9 -3.3 349.6 -2.4Q348.2 -1.5 346.5 -0.8Q344.8 -0 342.7 0.4Q340.6 0.8 338.1 0.8Q330 0.8 325.5 -3Q321.1 -6.8 321.1 -13.8ZM352.2 -27.5Q347.9 -27.4 344 -27Q340 -26.5 337 -25.1Q334 -23.7 332.2 -21.1Q330.4 -18.5 330.4 -14.2Q330.4 -8.7 333.1 -5.8Q335.9 -2.9 340.8 -2.9Q343 -2.9 344.9 -3.5Q346.7 -4.1 348.1 -5.1Q349.6 -6 350.6 -7.2Q351.5 -8.3 352.1 -9.4Q352.2 -11.2 352.2 -13.4Q352.2 -15.6 352.2 -18.3Z";

/** The book with seal. Height-driven; the width follows the 100 : 168 box. */
export function WasiyyaMark({ height = 40, inverted = false, className }: { height?: number; inverted?: boolean; className?: string }) {
  const fg = inverted ? WASIYYA_IVORY : WASIYYA_NAVY;
  const ground = inverted ? WASIYYA_NAVY : WASIYYA_IVORY;
  return (
    <svg
      viewBox="50 24 100 168"
      height={height}
      width={(height * 100) / 168}
      className={cn("shrink-0", className)}
      aria-hidden
      focusable="false"
      data-testid="wasiyya-mark"
    >
      <rect x="50" y="24" width="100" height="148" rx="12" fill={fg} />
      <path d="M62 24 V172" stroke={ground} strokeWidth="4" opacity="0.5" />
      <path d="M120 150 V192 L128 184 L136 192 V150 Z" fill={WASIYYA_GOLD} />
      <circle cx="104" cy="92" r="27" fill={WASIYYA_GOLD} />
      <polygon points={STAR} fill={fg} />
    </svg>
  );
}

/** The name alone as a path. `height` is the box height (cap height plus the descender of „y“). */
/** With `aria-label` the name is announced (e.g. in printed documents); without it the wordmark is decorative. */
export function WasiyyaWordmark({
  height = 28,
  inverted = false,
  className,
  "aria-label": label,
}: {
  height?: number;
  inverted?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <svg
      viewBox="-1.5 -67.2 363.2 91.2"
      height={height}
      width={(height * 363.2) / 91.2}
      className={cn("shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      focusable="false"
      data-testid="wasiyya-wordmark"
    >
      <path d={WORDMARK} fill={inverted ? WASIYYA_IVORY : WASIYYA_NAVY_TEXT} />
    </svg>
  );
}

/**
 * Lockup: book, name and the descriptor „Islamische Vorsorge und Testament“.
 * The descriptor is real text (readable at 14–16 px, selectable, translatable); `descriptor` decides from which
 * breakpoint it shows, so the mobile header stays compact.
 */
export function WasiyyaLockup({
  size = "md",
  inverted = false,
  descriptor = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
  descriptor?: "always" | "md" | "never";
  className?: string;
}) {
  const dims = { sm: { mark: 36, word: 24 }, md: { mark: 46, word: 29 }, lg: { mark: 64, word: 40 } }[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5 md:gap-3 min-w-0", className)} data-testid="wasiyya-lockup">
      <WasiyyaMark height={dims.mark} inverted={inverted} />
      <span className="flex flex-col justify-center min-w-0 gap-1">
        <WasiyyaWordmark height={dims.word} inverted={inverted} />
        {descriptor !== "never" && (
          <span
            className={cn(
              "text-[14px] 2xl:text-[15px] leading-tight font-medium tracking-[0.01em] whitespace-nowrap",
              inverted ? "text-[#E2C98F]" : "text-[#8A6A22]",
              descriptor === "md" && "hidden md:block"
            )}
            data-testid="wasiyya-descriptor"
          >
            {BRAND.descriptor}
          </span>
        )}
      </span>
    </span>
  );
}
