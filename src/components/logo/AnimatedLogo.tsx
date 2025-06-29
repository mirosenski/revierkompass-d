import { useEffect, useState } from "react";
import "./AnimatedLogo.css";

const ModernPoliceLogo = ({ size = "w-96 h-96" }) => {
	const [isHovered, setIsHovered] = useState(false);
	const [pulseIntensity, setPulseIntensity] = useState(0);
	const [dataPoints, setDataPoints] = useState([]);

	useEffect(() => {
		const interval = setInterval(() => {
			setPulseIntensity((prev) => (prev + 1) % 360);
		}, 50);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		// Generiere dynamische Datenpunkte für Tech-Effekt
		const points = Array.from({ length: 12 }, (_, i) => ({
			angle: i * 30,
			active: Math.random() > 0.5,
		}));
		setDataPoints(points);
	}, []);

	return (
		<div
			className={`animated-logo-container ${size} cursor-pointer`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<svg
				viewBox="0 0 400 400"
				className="animated-logo-svg w-full h-full"
				style={{
					filter: `drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))`,
					transition: "all 0.3s ease",
				}}
			>
				<defs>
					{/* Vereinfachte Gradienten */}
					<linearGradient
						id="shieldGradient"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#1e3a8a" />
						<stop offset="50%" stopColor="#2563eb" />
						<stop offset="100%" stopColor="#1e40af" />
					</linearGradient>

					<linearGradient
						id="borderGradient"
						x1="0%"
						y1="0%"
						x2="100%"
						y2="100%"
					>
						<stop offset="0%" stopColor="#e5e7eb" />
						<stop offset="50%" stopColor="#ffffff" />
						<stop offset="100%" stopColor="#f3f4f6" />
					</linearGradient>

					<radialGradient id="starGradient" cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor="#ffffff" />
						<stop offset="50%" stopColor="#dbeafe" />
						<stop offset="100%" stopColor="#93c5fd" />
					</radialGradient>

					<radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
						<stop offset="0%" stopColor="#60a5fa" />
						<stop offset="100%" stopColor="#3b82f6" />
					</radialGradient>

					{/* Vereinfachter Glow Filter */}
					<filter id="simpleGlow" x="-20%" y="-20%" width="140%" height="140%">
						<feGaussianBlur stdDeviation="2" result="coloredBlur" />
						<feMerge>
							<feMergeNode in="coloredBlur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				{/* Äußerer Rahmen */}
				<path
					d="M200 20 C240 20, 280 40, 320 80 L320 200 C320 280, 280 340, 200 380 C120 340, 80 280, 80 200 L80 80 C120 40, 160 20, 200 20 Z"
					fill="url(#borderGradient)"
					stroke="#d1d5db"
					strokeWidth="2"
					className="transition-all duration-300"
				/>

				{/* Inneres Schild */}
				<path
					d="M200 35 C235 35, 270 50, 305 85 L305 200 C305 270, 270 325, 200 365 C130 325, 95 270, 95 200 L95 85 C130 50, 165 35, 200 35 Z"
					fill="url(#shieldGradient)"
					className="transition-all duration-300"
				/>

				{/* Äußerer Ring */}
				<g
					className="animated-logo-rotate"
					style={{
						transform: `rotate(${pulseIntensity * 0.1}deg)`,
						transformOrigin: "center",
					}}
				>
					<circle
						cx="200"
						cy="200"
						r="140"
						fill="none"
						stroke="#60a5fa"
						strokeWidth="2"
						strokeDasharray="5,5"
						opacity="0.6"
					/>
					{/* Vereinfachte Datenpunkte */}
					{dataPoints.map((point, i) => (
						<circle
							key={i}
							cx={200 + 140 * Math.cos(((point.angle - 90) * Math.PI) / 180)}
							cy={200 + 140 * Math.sin(((point.angle - 90) * Math.PI) / 180)}
							r="3"
							fill={point.active ? "#60a5fa" : "#6b7280"}
							opacity="0.8"
							className={point.active ? "animated-logo-pulse" : ""}
						/>
					))}
				</g>

				{/* Mittlerer Ring */}
				<circle
					cx="200"
					cy="200"
					r="115"
					fill="none"
					stroke="#3b82f6"
					strokeWidth="2"
					opacity="0.8"
				/>

				{/* Innerer Ring */}
				<circle
					cx="200"
					cy="200"
					r="90"
					fill="none"
					stroke="#60a5fa"
					strokeWidth="2"
					opacity="0.7"
				/>

				{/* Scan-Line */}
				<line
					x1="200"
					y1="200"
					x2={200 + 90 * Math.cos(((pulseIntensity - 90) * Math.PI) / 180)}
					y2={200 + 90 * Math.sin(((pulseIntensity - 90) * Math.PI) / 180)}
					stroke="#60a5fa"
					strokeWidth="3"
					opacity={isHovered ? "1" : "0.5"}
					style={{ transition: "opacity 0.3s ease" }}
				/>

				{/* Zentraler Stern */}
				<g filter="url(#simpleGlow)">
					{/* Äußere Sternschicht */}
					<path
						d="M200 110 L225 175 L290 200 L225 225 L200 290 L175 225 L110 200 L175 175 Z"
						fill="url(#starGradient)"
						style={{
							transform: isHovered ? "scale(1.1)" : "scale(1)",
							transformOrigin: "center",
							transition: "transform 0.3s ease",
						}}
					/>

					{/* Mittlere Sternschicht */}
					<path
						d="M200 130 L215 185 L270 200 L215 215 L200 270 L185 215 L130 200 L185 185 Z"
						fill="white"
						opacity="0.9"
						style={{
							transform: isHovered ? "scale(1.05)" : "scale(1)",
							transformOrigin: "center",
							transition: "transform 0.3s ease",
						}}
					/>

					{/* Innerer Stern */}
					<path
						d="M200 150 L210 190 L250 200 L210 210 L200 250 L190 210 L150 200 L190 190 Z"
						fill="#93c5fd"
					/>

					{/* Zentraler Kern */}
					<circle
						cx="200"
						cy="200"
						r="15"
						fill="url(#centerGlow)"
						style={{
							transform: isHovered ? "scale(1.2)" : "scale(1)",
							transformOrigin: "center",
							transition: "transform 0.3s ease",
						}}
					/>
					<circle cx="200" cy="200" r="8" fill="white" />
				</g>

				{/* Kompass-Richtungen */}
				<g
					opacity={isHovered ? "1" : "0.7"}
					style={{ transition: "opacity 0.3s ease" }}
				>
					{/* Nord */}
					<line
						x1="200"
						y1="70"
						x2="200"
						y2="85"
						stroke="white"
						strokeWidth="3"
					/>
					<circle cx="200" cy="70" r="5" fill="white" />

					{/* Ost */}
					<line
						x1="315"
						y1="200"
						x2="330"
						y2="200"
						stroke="white"
						strokeWidth="3"
					/>
					<circle cx="330" cy="200" r="5" fill="white" />

					{/* Süd */}
					<line
						x1="200"
						y1="315"
						x2="200"
						y2="330"
						stroke="white"
						strokeWidth="3"
					/>
					<circle cx="200" cy="330" r="5" fill="white" />

					{/* West */}
					<line
						x1="70"
						y1="200"
						x2="85"
						y2="200"
						stroke="white"
						strokeWidth="3"
					/>
					<circle cx="70" cy="200" r="5" fill="white" />
				</g>

				{/* Äußere Markierungen */}
				<g opacity="0.8">
					{[0, 90, 180, 270].map((angle, i) => (
						<g key={i}>
							<line
								x1={200 + 125 * Math.cos(((angle - 90) * Math.PI) / 180)}
								y1={200 + 125 * Math.sin(((angle - 90) * Math.PI) / 180)}
								x2={200 + 135 * Math.cos(((angle - 90) * Math.PI) / 180)}
								y2={200 + 135 * Math.sin(((angle - 90) * Math.PI) / 180)}
								stroke="white"
								strokeWidth="3"
							/>
						</g>
					))}
				</g>
			</svg>
		</div>
	);
};

export default ModernPoliceLogo;
