import { motion } from "framer-motion";
import { AlertCircle, Eye, EyeOff, LogIn } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Logo from "@/components/ui/Logo";
import { useAuthStore } from "@/lib/store/auth-store";

interface LoginFormProps {
	onSuccess: () => void;
}

interface LoginFormData {
	username: string;
	password: string;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { login, isAuthenticated, isAdmin } = useAuthStore();

	// Wenn bereits angemeldet, automatisch weiterleiten
	useEffect(() => {
		if (isAuthenticated && isAdmin) {
			console.log("✅ Bereits angemeldet - automatische Weiterleitung");
			onSuccess();
		}
	}, [isAuthenticated, isAdmin, onSuccess]);

	const {
		register,
		handleSubmit,
		formState: { errors },
		setError,
		setValue,
		trigger,
	} = useForm<LoginFormData>();

	const onSubmit = async (data: LoginFormData) => {
		await loginWithCredentials(data.username, data.password);
	};

	const fillDemoCredentials = async () => {
		// Korrekte Verwendung von setValue und trigger für Validierung
		setValue("username", "admin");
		setValue("password", "admin123");

		// Trigger Validierung nach dem Setzen der Werte
		await trigger(["username", "password"]);

		toast("Demo-Anmeldedaten eingefügt", { icon: "ℹ️" });
	};

	const loginWithCredentials = async (username: string, password: string) => {
		setIsLoading(true);

		try {
			// Simulate API call delay
			await new Promise((resolve) => setTimeout(resolve, 1000));

			if (username === "admin" && password === "admin123") {
				const user = {
					id: "1",
					username: "admin",
					email: "admin@polizei-bw.de",
					role: "admin" as const,
					isAdmin: true,
					lastLogin: new Date(),
				};

				console.log("🔐 LoginForm: Anmeldung erfolgreich, User:", user);
				login(user);
				toast.success("Erfolgreich angemeldet!");
				onSuccess();
			} else {
				setError("password", {
					type: "manual",
					message: "Ungültige Anmeldedaten",
				});
				toast.error("Anmeldung fehlgeschlagen");
			}
		} catch (error) {
			console.error("❌ LoginForm: Fehler bei der Anmeldung:", error);
			toast.error("Ein Fehler ist aufgetreten");
		} finally {
			setIsLoading(false);
		}
	};

	const directDemoLogin = () => {
		loginWithCredentials("admin", "admin123");
	};

	return (
		<div className="flex items-center justify-center py-4 sm:py-6 bg-gradient-to-br from-slate-50 via-white to-blue-50/20 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/5">
			{/* Subtle Background Elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl"></div>
				<div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-400/5 rounded-full blur-3xl"></div>
			</div>

			<div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl mx-auto px-4 sm:px-6">
				{/* Main Container */}
				<div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10">
					<div className="space-y-4 sm:space-y-6">
						{/* Header - Minimal */}
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
							className="text-center"
						>
							<div className="flex justify-center mb-3 sm:mb-4">
								<Logo size="lg" showText={false} animated={true} />
							</div>

							<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-1 sm:mb-2">
								Admin Login
							</h1>
							<p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
								Zugang zum Dashboard
							</p>
						</motion.div>

						{/* Demo Info - Compact */}
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
							className="bg-blue-50/80 dark:bg-blue-900/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4"
						>
							<div className="flex items-center gap-3 mb-2 sm:mb-3">
								<AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
								<span className="text-blue-800 dark:text-blue-200 font-medium text-sm">
									Demo-Zugang
								</span>
							</div>
							<div className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 mb-2 sm:mb-3">
								<span className="font-mono bg-blue-100 dark:bg-blue-800/30 px-2 py-1 rounded">
									admin
								</span>{" "}
								/
								<span className="font-mono bg-blue-100 dark:bg-blue-800/30 px-2 py-1 rounded">
									admin123
								</span>
							</div>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={fillDemoCredentials}
									disabled={isLoading}
									className="flex-1 bg-blue-100/80 dark:bg-blue-800/30 hover:bg-blue-200/80 dark:hover:bg-blue-700/30 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
								>
									Ausfüllen
								</button>
								<button
									type="button"
									onClick={directDemoLogin}
									disabled={isLoading}
									className="flex-1 bg-green-100/80 dark:bg-green-800/30 hover:bg-green-200/80 dark:hover:bg-green-700/30 text-green-700 dark:text-green-300 text-xs sm:text-sm font-medium px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
								>
									Direkt Login
								</button>
							</div>
						</motion.div>

						{/* Already Logged In */}
						{isAuthenticated && isAdmin && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
								className="bg-green-50/80 dark:bg-green-900/10 backdrop-blur-sm rounded-2xl p-3 sm:p-4"
							>
								<div className="flex items-center gap-3">
									<div className="h-4 w-4 text-green-600 dark:text-green-400">
										<svg fill="currentColor" viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
												clipRule="evenodd"
											/>
										</svg>
									</div>
									<div className="text-sm">
										<p className="text-green-800 dark:text-green-200 font-medium">
											Bereits angemeldet
										</p>
										<p className="text-green-700 dark:text-green-300 text-xs">
											Weiterleitung...
										</p>
									</div>
								</div>
							</motion.div>
						)}

						{/* Login Form - Ultra Clean */}
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className="space-y-3 sm:space-y-4"
						>
							<form
								onSubmit={handleSubmit(onSubmit)}
								className="space-y-3 sm:space-y-4"
							>
								{/* Username Field */}
								<div>
									<label
										htmlFor="username"
										className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2"
									>
										Benutzername
									</label>
									<div className="relative">
										<input
											{...register("username", {
												required: "Benutzername ist erforderlich",
												minLength: {
													value: 3,
													message: "Mindestens 3 Zeichen erforderlich",
												},
											})}
											type="text"
											id="username"
											autoComplete="username"
											className={`block w-full pl-4 pr-4 py-3 sm:py-4 rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 ${
												errors.username
													? "ring-2 ring-red-300 dark:ring-red-600"
													: "ring-1 ring-slate-200 dark:ring-slate-600"
											}`}
											placeholder="Benutzername eingeben"
											disabled={isLoading}
										/>
									</div>
									{errors.username && (
										<p className="mt-1 text-xs text-red-600 dark:text-red-400">
											{errors.username.message}
										</p>
									)}
								</div>

								{/* Password Field */}
								<div>
									<label
										htmlFor="password"
										className="block text-sm sm:text-base font-medium text-slate-700 dark:text-slate-300 mb-1 sm:mb-2"
									>
										Passwort
									</label>
									<div className="relative">
										<input
											{...register("password", {
												required: "Passwort ist erforderlich",
												minLength: {
													value: 6,
													message: "Mindestens 6 Zeichen erforderlich",
												},
											})}
											type={showPassword ? "text" : "password"}
											id="password"
											autoComplete="current-password"
											className={`block w-full pl-4 pr-12 py-3 sm:py-4 rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-200 ${
												errors.password
													? "ring-2 ring-red-300 dark:ring-red-600"
													: "ring-1 ring-slate-200 dark:ring-slate-600"
											}`}
											placeholder="Passwort eingeben"
											disabled={isLoading}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
											disabled={isLoading}
										>
											{showPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</button>
									</div>
									{errors.password && (
										<p className="mt-1 text-xs text-red-600 dark:text-red-400">
											{errors.password.message}
										</p>
									)}
								</div>

								{/* Submit Button - Ultra Modern */}
								<motion.button
									type="submit"
									disabled={isLoading}
									whileHover={{ scale: isLoading ? 1 : 1.01 }}
									whileTap={{ scale: isLoading ? 1 : 0.99 }}
									className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 sm:py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed"
								>
									{isLoading ? (
										<div className="flex items-center justify-center gap-2">
											<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
											<span>Anmeldung...</span>
										</div>
									) : (
										<div className="flex items-center justify-center gap-2">
											<LogIn className="h-4 w-4" />
											<span>Anmelden</span>
										</div>
									)}
								</motion.button>
							</form>
						</motion.div>

						{/* Security Notice - Minimal */}
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
							className="text-center"
						>
							<p className="text-xs text-slate-500 dark:text-slate-400">
								🔒 Sichere Verbindung • Polizei Baden-Württemberg
							</p>
						</motion.div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginForm;
