import { motion } from "framer-motion";
import type React from "react";
import ModernPoliceLogo from "@/components/logo/AnimatedLogo";

interface LogoProps {
	size?: "sm" | "md" | "lg" | "xl";
	className?: string;
	showText?: boolean;
	animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({
	size = "md",
	className = "",
	showText = true,
	animated = true,
}) => {
	const sizeClasses = {
		sm: "w-16 h-16",
		md: "w-24 h-24",
		lg: "w-32 h-32",
		xl: "w-48 h-48",
	};

	const textSizes = {
		sm: "text-lg",
		md: "text-xl",
		lg: "text-2xl",
		xl: "text-3xl",
	};

	const LogoIcon = () => (
		<motion.div
			className="relative"
			initial={animated ? { scale: 0.8, opacity: 0 } : {}}
			animate={animated ? { scale: 1, opacity: 1 } : {}}
			transition={{ duration: 0.6, ease: "easeOut" }}
			whileHover={
				animated
					? {
							scale: 1.05,
						}
					: {}
			}
			whileTap={animated ? { scale: 0.95 } : {}}
		>
			<ModernPoliceLogo size={sizeClasses[size]} />
		</motion.div>
	);

	if (!showText) {
		return <LogoIcon />;
	}

	return (
		<motion.div
			className="flex items-center space-x-3"
			initial={animated ? { opacity: 0, x: -20 } : {}}
			animate={animated ? { opacity: 1, x: 0 } : {}}
			transition={{ duration: 0.6, delay: 0.2 }}
		>
			<LogoIcon />
			<div>
				<motion.h1
					className={`font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent ${textSizes[size]}`}
					animate={
						animated
							? {
									backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
								}
							: {}
					}
					transition={{
						duration: 3,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					style={{
						backgroundSize: "200% 200%",
					}}
				>
					RevierKompass
				</motion.h1>
				<p className="text-base text-gray-600 dark:text-gray-400 font-medium">
					Polizei Baden-Württemberg
				</p>
			</div>
		</motion.div>
	);
};

export default Logo;
