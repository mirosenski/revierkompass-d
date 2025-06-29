import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, MapPin, Navigation } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { useAppStore } from "@/lib/store/app-store";

const Step1AddressInputSimple: React.FC = () => {
	const [address, setAddress] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);
	const {
		setStartAddress,
		setWizardStep,
		setSelectedStations,
		setSelectedCustomAddresses,
		wizard,
	} = useAppStore();

	// Auto-focus beim Laden
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	const handleSubmit = async (inputAddress: string) => {
		if (!inputAddress.trim()) {
			toast.error("Bitte geben Sie eine Adresse ein");
			return;
		}

		setIsSubmitting(true);

		try {
			// Simuliere API-Verzögerung für bessere UX
			await new Promise((resolve) => setTimeout(resolve, 800));

			// Simuliere sofortige Geocoding-Ergebnisse (für Demo-Zwecke)
			const coordinates = {
				lat: 48.7758 + (Math.random() - 0.5) * 0.1,
				lng: 9.1829 + (Math.random() - 0.5) * 0.1,
			};

			const addressData = {
				street: inputAddress.split(",")[0] || inputAddress,
				houseNumber: "",
				zipCode: "70173",
				city: "Stuttgart",
				fullAddress: inputAddress,
				coordinates,
				accuracy: 95,
			};

			setStartAddress(addressData);

			// Reset-Auswahl vor dem Wechsel zu Schritt 2
			setSelectedStations([]);
			setSelectedCustomAddresses([]);
			console.log("🔄 Step1: Auswahl vor Schritt 2 zurückgesetzt");

			toast.success("Adresse erfolgreich geocodiert!");

			// Sofort zu Schritt 2 weiterleiten
			setWizardStep(2);
		} catch (_error) {
			toast.error("Fehler bei der Adressverarbeitung");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		handleSubmit(address);
	};

	return (
		<div className="w-full max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6">
			{/* Main Container - Größer und zentraler */}
			<div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 lg:p-12">
				<div className="space-y-8">
					{/* Header - Ultra Modern und größer */}
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="text-center"
					>
						<div className="flex justify-center mb-6">
							<div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-3xl shadow-lg">
								<MapPin className="h-8 w-8 text-white" />
							</div>
						</div>

						<h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-3">
							Startadresse eingeben
						</h1>
						<p className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl">
							Wo startet Ihre Route? Geben Sie Ihre Adresse ein
						</p>
					</motion.div>

					{/* Address Input Form - Ultra Clean und größer */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className="space-y-6"
					>
						<form onSubmit={handleFormSubmit} className="space-y-6">
							{/* Address Field - Größer und prominenter */}
							<div>
								<label
									htmlFor="address"
									className="block text-lg sm:text-xl font-semibold text-slate-700 dark:text-slate-300 mb-3"
								>
									Adresse eingeben
								</label>
								<div className="relative">
									<input
										ref={inputRef}
										type="text"
										id="address"
										value={address}
										onChange={(e) => setAddress(e.target.value)}
										onFocus={() => setIsFocused(true)}
										onBlur={() => setIsFocused(false)}
										placeholder="z.B. Schlossplatz 1, 70173 Stuttgart"
										className={`block w-full pl-6 pr-14 py-4 sm:py-5 lg:py-6 text-lg sm:text-xl rounded-2xl bg-white/90 dark:bg-slate-700/90 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-3 focus:ring-blue-500 focus:outline-none transition-all duration-300 ${
											isFocused
												? "ring-3 ring-blue-500 shadow-lg"
												: "ring-2 ring-slate-200 dark:ring-slate-600"
										}`}
										disabled={isSubmitting}
									/>
									<div className="absolute inset-y-0 right-0 pr-4 flex items-center">
										<Navigation className="h-5 w-5 text-slate-400" />
									</div>
								</div>
							</div>

							{/* Submit Button - Ultra Modern und größer */}
							<motion.button
								type="submit"
								disabled={isSubmitting || !address.trim()}
								whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
								whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
								className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold py-4 sm:py-5 lg:py-6 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:cursor-not-allowed text-lg sm:text-xl"
							>
								{isSubmitting ? (
									<div className="flex items-center justify-center gap-3">
										<div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
										<span>Verarbeite Adresse...</span>
									</div>
								) : (
									<div className="flex items-center justify-center gap-3">
										<ArrowRight className="h-5 w-5" />
										<span>Route starten</span>
									</div>
								)}
							</motion.button>
						</form>
					</motion.div>

					{/* Current Address Display - Enhanced */}
					{wizard.startAddress && (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="bg-green-50/80 dark:bg-green-900/10 backdrop-blur-sm rounded-2xl p-6"
						>
							<div className="flex items-center gap-4">
								<div className="bg-green-100/80 dark:bg-green-800/50 backdrop-blur-md rounded-xl p-3 flex-shrink-0">
									<CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
								</div>
								<div className="flex-1">
									<p className="text-green-800 dark:text-green-200 font-semibold text-lg">
										Startadresse bestätigt
									</p>
									<p className="text-green-700 dark:text-green-300 text-base">
										{wizard.startAddress.fullAddress}
									</p>
								</div>
							</div>
						</motion.div>
					)}

					{/* Info Notice - Minimal */}
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.4 }}
						className="text-center"
					>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							🗺️ Automatische Geocoding • Präzise Routenberechnung •
							Baden-Württemberg
						</p>
					</motion.div>
				</div>
			</div>
		</div>
	);
};

export default Step1AddressInputSimple;
