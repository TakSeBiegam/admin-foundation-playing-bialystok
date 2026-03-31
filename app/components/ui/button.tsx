import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    {
        variants: {
            variant: {
                default:
                    "bg-[#FEE600] text-black hover:bg-yellow-300 focus-visible:ring-[#FEE600]",
                destructive:
                    "bg-[#F13738] text-white hover:bg-[#c42d2e] focus-visible:ring-[#F13738]",
                outline:
                    "border border-white/20 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white",
                secondary:
                    "bg-[#2e2e2e] text-white hover:bg-[#3a3a3a] focus-visible:ring-white",
                ghost:
                    "bg-transparent text-white hover:bg-white/10 focus-visible:ring-white",
                link: "text-[#FEE600] underline-offset-4 hover:underline",
            },
            size: {
                default: "h-9 px-4 py-2 rounded-md",
                sm: "h-8 px-3 text-xs rounded-md",
                lg: "h-11 px-8 rounded-md",
                icon: "h-9 w-9 rounded-md",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
