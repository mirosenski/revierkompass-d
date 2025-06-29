import { AnimatePresence, motion } from "framer-motion";
import {
	Settings,
	SignalHigh,
	SignalLow,
	SignalMedium,
	Wifi,
	WifiOff,
	Zap,
} from "lucide-react";
import type React from "react";
import { cn } from "@/lib/utils";

interface RealTimeToggleProps {
	enabled: boolean;
	connected: boolean;
	onToggle: () => void;
	onSettings?: () => void;
	connectionQuality?: "excellent" | "good" | "poor" | "disconnected";
	className?: string;
}

export const RealTimeToggle: React.FC<RealTimeToggleProps> = ({
	enabled,
	connected,
	onToggle,
	onSettings,
	connectionQuality = "disconnected",
	className,
}) => {
	const getConnectionIcon = () => {
		if (!connected) return <WifiOff className="h-4 w-4" />;

		switch (connectionQuality) {
			case "excellent":
				return <SignalHigh className="h-4 w-4 text-green-500" />;
			case "good":
				return <SignalMedium className="h-4 w-4 text-yellow-500" />;
			case "poor":
				return <SignalLow className="h-4 w-4 text-red-500" />;
			default:
				return <Wifi className="h-4 w-4 text-gray-400" />;
		}
	};

	const getConnectionColor = () => {
		if (!connected) return "bg-gray-100 dark:bg-gray-800";

		switch (connectionQuality) {
			case "excellent":
				return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
			case "good":
				return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
			case "poor":
				return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
			default:
				return "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			className={cn(
				"relative flex items-center space-x-2 p-3 rounded-lg border transition-all duration-200",
				getConnectionColor(),
				className,
			)}
		>
			{/* Toggle Button */}
			<motion.button
				onClick={onToggle}
				className={cn(
					"relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
					enabled
						? "bg-blue-600 dark:bg-blue-500"
						: "bg-gray-200 dark:bg-gray-700",
				)}
				whileTap={{ scale: 0.95 }}
			>
				<motion.span
					className={cn(
						"inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
						enabled ? "translate-x-6" : "translate-x-1",
					)}
					layout
				/>
			</motion.button>

			{/* Status Indicator */}
			<div className="flex items-center space-x-2">
				<AnimatePresence mode="wait">
					{enabled && (
						<motion.div
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0 }}
							className="flex items-center space-x-1"
						>
							{getConnectionIcon()}

							{/* Pulsing Activity Indicator */}
							{connected && (
								<motion.div
									animate={{ scale: [1, 1.2, 1] }}
									transition={{ duration: 2, repeat: Infinity }}
									className="w-2 h-2 bg-green-500 rounded-full"
								/>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				<div className="flex flex-col">
					<span className="text-sm font-medium text-gray-900 dark:text-white">
						Echtzeit-Daten
					</span>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						{enabled
							? connected
								? "Verbunden"
								: "Verbinde..."
							: "Deaktiviert"}
					</span>
				</div>
			</div>

			{/* Settings Button */}
			{onSettings && (
				<motion.button
					onClick={onSettings}
					className="ml-auto p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
					whileHover={{ scale: 1.1 }}
					whileTap={{ scale: 0.9 }}
				>
					<Settings className="h-4 w-4" />
				</motion.button>
			)}

			{/* Lightning Effect */}
			<AnimatePresence>
				{enabled && connected && (
					<motion.div
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -10 }}
						className="absolute -top-1 -right-1"
					>
						<motion.div
							animate={{
								rotate: [0, 360],
								scale: [1, 1.2, 1],
							}}
							transition={{
								rotate: { duration: 3, repeat: Infinity, ease: "linear" },
								scale: { duration: 1, repeat: Infinity },
							}}
						>
							<Zap className="h-3 w-3 text-yellow-400" />
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};
