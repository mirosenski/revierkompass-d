import { AlertTriangle, Building2, MapPin, X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Address } from "@/services/api/admin-address.service";
import type { Praesidium, StationData } from "./types";

interface ConvertToStationModalProps {
	address: Address | null;
	isOpen: boolean;
	onClose: () => void;
	onConvert: (address: Address, stationData: StationData) => void;
	availablePraesidien: Praesidium[];
}

const ConvertToStationModal: React.FC<ConvertToStationModalProps> = ({
	address,
	isOpen,
	onClose,
	onConvert,
	availablePraesidien,
}) => {
	const [stationData, setStationData] = useState({
		type: "revier" as "praesidium" | "revier",
		parentId: "",
		telefon: "",
		email: "",
		notdienst24h: false,
		isActive: true,
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	if (!isOpen || !address) return null;

	const validateForm = () => {
		const newErrors: Record<string, string> = {};

		if (stationData.type === "revier" && !stationData.parentId) {
			newErrors.parentId = "Bitte wählen Sie ein Präsidium aus";
		}

		if (!stationData.telefon) {
			newErrors.telefon = "Telefonnummer ist erforderlich";
		}

		if (!stationData.email) {
			newErrors.email = "E-Mail ist erforderlich";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleConvert = () => {
		if (validateForm()) {
			onConvert(address, stationData);
			onClose();
		}
	};

	const handleClose = () => {
		setStationData({
			type: "revier",
			parentId: "",
			telefon: "",
			email: "",
			notdienst24h: false,
			isActive: true,
		});
		setErrors({});
		onClose();
	};

	return (
		<div
			className="fixed inset-0 z-50 overflow-y-auto"
			role="dialog"
			aria-modal="true"
		>
			<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
				<div
					className="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity"
					onClick={handleClose}
				></div>

				<div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
					<div className="bg-white dark:bg-gray-800 px-6 py-6">
						{/* Header */}
						<div className="flex items-center justify-between mb-6">
							<div className="flex items-center gap-3">
								<div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-2">
									<Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
										Zu Station konvertieren
									</h3>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Adresse in offizielle Station umwandeln
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={handleClose}
								className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
							>
								<X className="w-6 h-6" />
							</button>
						</div>

						{/* Address Info */}
						<div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
							<div className="flex items-start gap-3">
								<MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
								<div>
									<h4 className="font-medium text-gray-900 dark:text-white">
										{address.name}
									</h4>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{address.street}, {address.zipCode} {address.city}
									</p>
								</div>
							</div>
						</div>

						{/* Warning */}
						<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
							<div className="flex items-start gap-3">
								<AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
								<div>
									<h5 className="font-medium text-yellow-800 dark:text-yellow-200">
										Wichtiger Hinweis
									</h5>
									<p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
										Diese Aktion wandelt die Adresse in eine offizielle Station
										um. Die ursprüngliche Adresse wird aus dem Adressen-Bereich
										entfernt.
									</p>
								</div>
							</div>
						</div>

						{/* Form */}
						<div className="space-y-4">
							{/* Station Type */}
							<div>
								<label
									htmlFor="stationType"
									className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
								>
									Stationstyp *
								</label>
								<div className="grid grid-cols-2 gap-3">
									<label className="relative flex items-center p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
										<input
											id="stationType-praesidium"
											type="radio"
											name="stationType"
											value="praesidium"
											checked={stationData.type === "praesidium"}
											onChange={(e) =>
												setStationData({
													...stationData,
													type: e.target.value as "praesidium" | "revier",
													parentId: "",
												})
											}
											className="sr-only"
										/>
										<div
											className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
												stationData.type === "praesidium"
													? "border-blue-600 bg-blue-600"
													: "border-gray-300 dark:border-gray-500"
											}`}
										>
											{stationData.type === "praesidium" && (
												<div className="w-2 h-2 bg-white rounded-full"></div>
											)}
										</div>
										<div>
											<div className="font-medium text-gray-900 dark:text-white">
												Präsidium
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">
												Hauptstation
											</div>
										</div>
									</label>

									<label className="relative flex items-center p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
										<input
											id="stationType-revier"
											type="radio"
											name="stationType"
											value="revier"
											checked={stationData.type === "revier"}
											onChange={(e) =>
												setStationData({
													...stationData,
													type: e.target.value as "praesidium" | "revier",
												})
											}
											className="sr-only"
										/>
										<div
											className={`w-4 h-4 border-2 rounded-full mr-3 flex items-center justify-center ${
												stationData.type === "revier"
													? "border-blue-600 bg-blue-600"
													: "border-gray-300 dark:border-gray-500"
											}`}
										>
											{stationData.type === "revier" && (
												<div className="w-2 h-2 bg-white rounded-full"></div>
											)}
										</div>
										<div>
											<div className="font-medium text-gray-900 dark:text-white">
												Revier
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400">
												Unterstation
											</div>
										</div>
									</label>
								</div>
							</div>

							{/* Parent Selection for Revier */}
							{stationData.type === "revier" && (
								<div>
									<label
										htmlFor="parentId"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
									>
										Zugehöriges Präsidium *
									</label>
									<select
										id="parentId"
										value={stationData.parentId}
										onChange={(e) =>
											setStationData({
												...stationData,
												parentId: e.target.value,
											})
										}
										className={`w-full px-4 py-2 rounded-lg border ${
											errors.parentId
												? "border-red-500"
												: "border-gray-300 dark:border-gray-600"
										} dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
									>
										<option key="select-parent" value="">
											Präsidium auswählen
										</option>
										{availablePraesidien.map((praesidium) => (
											<option key={praesidium.id} value={praesidium.id}>
												{praesidium.name} ({praesidium.city})
											</option>
										))}
									</select>
									{errors.parentId && (
										<p className="text-red-500 text-xs mt-1">
											{errors.parentId}
										</p>
									)}
								</div>
							)}

							{/* Contact Information */}
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="telefon"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
									>
										Telefon *
									</label>
									<input
										id="telefon"
										type="tel"
										value={stationData.telefon}
										onChange={(e) =>
											setStationData({
												...stationData,
												telefon: e.target.value,
											})
										}
										placeholder="z.B. 0711 8990-0"
										className={`w-full px-4 py-2 rounded-lg border ${
											errors.telefon
												? "border-red-500"
												: "border-gray-300 dark:border-gray-600"
										} dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
									/>
									{errors.telefon && (
										<p className="text-red-500 text-xs mt-1">
											{errors.telefon}
										</p>
									)}
								</div>

								<div>
									<label
										htmlFor="email"
										className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
									>
										E-Mail *
									</label>
									<input
										id="email"
										type="email"
										value={stationData.email}
										onChange={(e) =>
											setStationData({ ...stationData, email: e.target.value })
										}
										placeholder="z.B. station@polizei.bwl.de"
										className={`w-full px-4 py-2 rounded-lg border ${
											errors.email
												? "border-red-500"
												: "border-gray-300 dark:border-gray-600"
										} dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
									/>
									{errors.email && (
										<p className="text-red-500 text-xs mt-1">{errors.email}</p>
									)}
								</div>
							</div>

							{/* 24h Service */}
							<div className="flex items-center gap-3">
								<input
									type="checkbox"
									id="notdienst24h"
									checked={stationData.notdienst24h}
									onChange={(e) =>
										setStationData({
											...stationData,
											notdienst24h: e.target.checked,
										})
									}
									className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
								/>
								<label
									htmlFor="notdienst24h"
									className="text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									24-Stunden-Notdienst
								</label>
							</div>
						</div>

						{/* Actions */}
						<div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
							<button
								type="button"
								onClick={handleClose}
								className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
							>
								Abbrechen
							</button>
							<button
								type="button"
								onClick={handleConvert}
								className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
							>
								Zu Station konvertieren
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ConvertToStationModal;
