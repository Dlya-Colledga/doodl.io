import React from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: "primary" | "secondary" | "danger";
	size?: "md" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
	children,
	className,
	variant = "primary",
	size = "md",
	...props
}) => {
	const baseStyles = "rounded-2xl font-bold transition-all transform active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[4px]";

	const variants = {
		primary: "bg-primary hover:bg-primary-dark text-white",
		secondary: "bg-secondary hover:brightness-110 text-slate-900",
		danger: "bg-red-500 hover:bg-red-600 text-white",
	};

	const sizes = {
		md: "px-6 py-3 text-lg",
		lg: "px-12 py-4 text-2xl w-full max-w-xs",
	};

	return (
		<button
			className={twMerge(baseStyles, variants[variant], sizes[size], className)}
			{...props}
		>
			{children}
		</button>
	);
};