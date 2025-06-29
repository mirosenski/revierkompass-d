import {
	AlertTriangle,
	CheckCircle,
	ChevronDown,
	ChevronRight,
	Edit2,
	Mail,
	MapPin,
	Phone,
	Shield,
	Target,
	Trash2,
	XCircle,
} from "lucide-react";
import React, { useCallback } from "react";
import type { StationCardProps } from "./types";

export const StationCard: React.FC<StationCardProps> = React.memo(
	({ station, onEdit, onDelete, isExpanded, onToggle, children }) => {
		const isPraesidium = station.type === "praesidium";

		const handleEdit = useCallback(() => {
			onEdit(station);
		}, [station, onEdit]);

		const handleDelete = useCallback(() => {
			if (window.confirm(`Möchten Sie "${station.name}" wirklich löschen?`)) {
				onDelete(station.id);
			}
		}, [station.name, station.id, onDelete]);

		return (
			<div
				className={`relative overflow-hidden transition-all duration-300 border ${
					isPraesidium
						? "bg-white/15 dark:bg-gray-800/25 backdrop-blur-md shadow-lg hover:shadow-xl border-white/25 dark:border-gray-700/40"
						: "bg-white/25 dark:bg-gray-900/30 backdrop-blur-sm shadow-md hover:shadow-lg ml-3 sm:ml-6 md:ml-8 border-white/30 dark:border-gray-700/40"
				} rounded-xl hover:border-white/40 dark:hover:border-gray-600/60`}
			>
				{/* Header Bar */}
				<div
					className={`px-4 sm:px-6 py-3 sm:py-4 border-b ${
						isPraesidium
							? "bg-white/20 dark:bg-gray-700/30 border-white/30 dark:border-gray-600/40"
							: "bg-white/30 dark:bg-gray-800/30 border-white/40 dark:border-gray-700/30"
					} rounded-t-xl`}
				>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
							{isPraesidium && (
								<button
									type="button"
									onClick={onToggle}
									className="p-2 sm:p-3 hover:bg-blue-100/80 dark:hover:bg-blue-900/40 rounded-lg sm:rounded-xl transition-all duration-300 focus:outline-none focus:ring-3 focus:ring-blue-400/70 shadow-md hover:shadow-lg border border-blue-200/60 dark:border-blue-700/50 flex-shrink-0"
									aria-label={
										isExpanded ? "Reviere ausblenden" : "Reviere anzeigen"
									}
								>
									{isExpanded ? (
										<ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-blue-800 dark:text-blue-300 rotate-180 transition-transform duration-300" />
									) : (
										<ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 text-blue-800 dark:text-blue-300 transition-transform duration-300" />
									)}
								</button>
							)}

							<div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
								{isPraesidium ? (
									<Shield className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 flex-shrink-0" />
								) : (
									<Target className="w-4 h-4 sm:w-6 sm:h-6 text-gray-700 dark:text-gray-300 flex-shrink-0" />
								)}
								<h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white tracking-wide truncate">
									{station.name}
								</h3>
							</div>
						</div>

						{/* Status Indicators */}
						<div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
							{station.notdienst24h && (
								<div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-100/90 dark:bg-red-900/40 backdrop-blur-sm border border-red-200/60 dark:border-red-800/60 rounded-full shadow-lg">
									<AlertTriangle className="w-3 h-3 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
									<span className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
										24h
									</span>
								</div>
							)}

							<div
								className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border shadow-lg ${
									station.isActive
										? "bg-green-100/90 dark:bg-green-900/40 border-green-200/60 dark:border-green-800/60"
										: "bg-gray-100/70 dark:bg-gray-700/50 border-gray-200/60 dark:border-gray-600/60"
								}`}
							>
								{station.isActive ? (
									<CheckCircle className="w-3 h-3 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
								) : (
									<XCircle className="w-3 h-3 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
								)}
								<span
									className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
										station.isActive
											? "text-green-700 dark:text-green-300"
											: "text-gray-600 dark:text-gray-400"
									}`}
								>
									{station.isActive ? "Aktiv" : "Inaktiv"}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
					<div className="space-y-4 sm:space-y-5">
						{/* Address */}
						<div className="flex items-start gap-3 sm:gap-4">
							<MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500 mt-0.5 flex-shrink-0" />
							<div className="min-w-0 flex-1">
								<p className="text-sm sm:text-lg text-gray-900 dark:text-white font-semibold tracking-wide">
									{station.address}
								</p>
								<p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mt-1">
									{station.city}
								</p>
							</div>
						</div>

						{/* Contact Information */}
						<div className="space-y-3 sm:space-y-4">
							<div className="flex items-center gap-3 sm:gap-4">
								<Phone className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500 flex-shrink-0" />
								<a
									href={`tel:${station.telefon}`}
									className="text-sm sm:text-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold"
								>
									{station.telefon}
								</a>
							</div>

							{station.email && (
								<div className="flex items-center gap-3 sm:gap-4">
									<Mail className="w-4 h-4 sm:w-6 sm:h-6 text-gray-500 flex-shrink-0" />
									<a
										href={`mailto:${station.email}`}
										className="text-sm sm:text-lg text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate font-semibold"
									>
										{station.email}
									</a>
								</div>
							)}
						</div>

						{/* Type Badge */}
						<div className="pt-2 sm:pt-3">
							<span
								className={`inline-flex items-center px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-base font-bold border shadow-lg ${
									isPraesidium
										? "bg-blue-100/90 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/60"
										: "bg-gray-100/80 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 border-gray-200/60 dark:border-gray-600/60"
								}`}
							>
								{isPraesidium ? "Polizeipräsidium" : "Polizeirevier"}
							</span>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-white/50 dark:border-gray-700/50">
						<button
							type="button"
							onClick={handleEdit}
							className="flex-1 flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 bg-white/20 dark:bg-gray-700/40 hover:bg-white/30 dark:hover:bg-gray-600/40 text-gray-700 dark:text-gray-300 rounded-lg sm:rounded-xl border border-white/40 dark:border-gray-600/50 transition-all duration-300 focus:outline-none focus:ring-3 focus:ring-gray-400/60 shadow-lg hover:shadow-xl text-sm sm:text-base"
						>
							<Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
							<span className="font-bold uppercase tracking-wider">
								Bearbeiten
							</span>
						</button>
						<button
							type="button"
							onClick={handleDelete}
							className="flex items-center justify-center px-3 sm:px-5 py-2.5 sm:py-3 bg-red-100/90 dark:bg-red-900/40 hover:bg-red-200/90 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg sm:rounded-xl border border-red-200/60 dark:border-red-800/60 transition-all duration-300 focus:outline-none focus:ring-3 focus:ring-red-400/60 shadow-lg hover:shadow-xl"
						>
							<Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
						</button>
					</div>
				</div>

				{/* Children (Reviere) */}
				{isExpanded && (
					<div className="px-4 sm:px-6 pb-4 sm:pb-6">
						<div className="ml-3 sm:ml-6 md:ml-8 pl-3 sm:pl-6 md:pl-8 border-l-2 sm:border-l-3 border-white/60 dark:border-gray-700/60 space-y-3 sm:space-y-4 mt-4 sm:mt-5">
							{children}
						</div>
					</div>
				)}
			</div>
		);
	},
);

StationCard.displayName = "StationCard";
