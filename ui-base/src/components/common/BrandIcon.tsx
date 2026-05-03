import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
}

export function BrandIcon({ className }: BrandIconProps) {
  return (
    <div className={cn("w-full h-full flex items-center justify-center", className)}>
      <span className="text-lg font-semibold tracking-wider text-primary font-brand">byteful</span>
    </div>
  );
}
