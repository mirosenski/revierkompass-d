import {
	AlertTriangle,
	Building2,
	CheckCircle,
	Edit,
	MapPin,
	Shield,
	Target,
	Trash2,
	XCircle,
} from "lucide-react";
import type React from "react";
import type { Station } from "@/types/station.types";

interface CompactStationListProps {
	stations: Station[];
	onEdit?: (station: Station) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export const CompactStationList: React.FC<CompactStationListProps> = ({
	stations,
	onEdit,
	onDelete,
	className = "",
}) => {
	return (
		<div className={`space-y-2 ${className}`}>
			{stations.map((station) => (
				<div
					key={station.id}
					className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
				>
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<div className="flex-shrink-0">
							{station.type === "praesidium" ? (
								<Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
							) : (
								<Target className="w-5 h-5 text-gray-600 dark:text-gray-400" />
							)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
									{station.name}
								</h4>
								{/* Status Indicators */}
								<div className="flex items-center gap-1">
									{station.notdienst24h && (
										<div className="flex items-center gap-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 rounded text-xs">
											<AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
											<span className="text-red-700 dark:text-red-300 font-bold">
												24h
											</span>
										</div>
									)}
									<div
										className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
											station.isActive
												? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
												: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
										}`}
									>
										{station.isActive ? (
											<CheckCircle className="w-3 h-3" />
										) : (
											<XCircle className="w-3 h-3" />
										)}
										<span className="font-bold">
											{station.isActive ? "Aktiv" : "Inaktiv"}
										</span>
									</div>
								</div>
							</div>
							<div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
								<MapPin className="w-3 h-3" />
								<span>{station.city}</span>
								<span>•</span>
								<span>{station.address}</span>
								{station.telefon && (
									<>
										<span>•</span>
										<span>{station.telefon}</span>
									</>
								)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-1 flex-shrink-0">
						{onEdit && (
							<button
								type="button"
								onClick={() => onEdit(station)}
								className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
								title="Bearbeiten"
							>
								<Edit className="w-4 h-4" />
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={() => onDelete(station.id)}
								className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
								title="Löschen"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						)}
					</div>
				</div>
			))}

			{stations.length === 0 && (
				<div className="text-center py-8 text-gray-500 dark:text-gray-400">
					<Building2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
					<p>Keine Stationen gefunden</p>
				</div>
			)}
		</div>
	);
};
