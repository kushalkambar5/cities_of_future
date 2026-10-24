import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#171717] text-white hover:bg-[#333333]",
        secondary:
          "border-[#E5E5E5] bg-[#F7F7F6] text-[#6F7070] hover:bg-[#EAEAEA]",
        blue: "border-transparent bg-[#BAE2EF] text-[#171717]",
        green: "border-transparent bg-[#DCE9C5] text-[#2D4C13]",
        peach: "border-transparent bg-[#F2B29A] text-[#5C2718]",
        destructive:
          "border-transparent bg-red-600 text-white hover:bg-red-700",
        outline: "text-[#171717] border-[#E5E5E5] bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
