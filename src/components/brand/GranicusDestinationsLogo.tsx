import Image from "next/image";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

/** Intrinsic dimensions of public/granicus-destinations-logo.png */
const LOGO_WIDTH = 1024;
const LOGO_HEIGHT = 285;
const LOGO_ASPECT = LOGO_WIDTH / LOGO_HEIGHT;

function renderedWidthForHeight(heightPx: number) {
  return Math.round(heightPx * LOGO_ASPECT);
}

const sizeStyles: Record<LogoSize, { height: string; heightPx: number }> = {
  sm: { height: "h-8", heightPx: 32 },
  md: { height: "h-9 sm:h-10", heightPx: 40 },
  lg: { height: "h-10 sm:h-11", heightPx: 44 },
};

interface GranicusDestinationsLogoProps {
  size?: LogoSize;
  className?: string;
  /** When set, logo links home and reloads the app on click. Pass `null` for a static logo. */
  href?: string | null;
}

export function GranicusDestinationsLogo({
  size = "sm",
  className = "",
  href = "/",
}: GranicusDestinationsLogoProps) {
  const styles = sizeStyles[size];

  const image = (
    <Image
      src="/granicus-destinations-logo.png"
      alt=""
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      sizes={`(min-width: 640px) ${renderedWidthForHeight(styles.heightPx)}px, ${renderedWidthForHeight(Math.round(styles.heightPx * 0.9))}px`}
      unoptimized
      className={`w-auto shrink-0 object-contain object-left ${styles.height} ${className}`}
      priority
    />
  );

  if (href === null) {
    return image;
  }

  return (
    <Link
      href={href}
      onClick={(event) => {
        event.preventDefault();
        window.location.assign(href);
      }}
      className="inline-flex shrink-0 rounded-md transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-granicus-red/35"
      aria-label="Granicus Destinations — reload page"
    >
      {image}
    </Link>
  );
}
