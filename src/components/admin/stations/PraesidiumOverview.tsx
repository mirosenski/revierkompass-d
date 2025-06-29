import {
	Building2,
	ChevronDown,
	ChevronRight,
	Edit,
	MapPin,
	Trash2,
	Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Station } from "@/types/station.types";

interface PraesidiumOverviewProps {
	praesidien: Station[];
	reviere: Station[];
	onEdit?: (station: Station) => void;
	onDelete?: (id: string) => void;
	className?: string;
}

export const PraesidiumOverview: React.FC<PraesidiumOverviewProps> = ({
	praesidien,
	reviere,
	onEdit,
	onDelete,
	className = "",
}) => {
	const [expandedPraesidien, setExpandedPraesidien] = useState<Set<string>>(
		new Set(),
	);

	const togglePraesidium = (praesidiumId: string) => {
		setExpandedPraesidien((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(praesidiumId)) {
				newSet.delete(praesidiumId);
			} else {
				newSet.add(praesidiumId);
			}
			return newSet;
		});
	};

	const getReviereForPraesidium = (praesidiumId: string) => {
		return reviere.filter((revier) => revier.parentId === praesidiumId);
	};

	return (
		<div className={`space-y-4 ${className}`}>
			<div className="flex items-center justify-between">
				<h3 className="text-lg font-semibold text-gray-900 dark:text-white">
					Präsidien Übersicht
				</h3>
				<div className="text-sm text-gray-500 dark:text-gray-400">
					{praesidien.length} Präsidien, {reviere.length} Reviere
				</div>
			</div>

			{praesidien.map((praesidium) => {
				const praesidiumReviere = getReviereForPraesidium(praesidium.id);
				const isExpanded = expandedPraesidien.has(praesidium.id);

				return (
					<div
						key={praesidium.id}
						className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
					>
						{/* Präsidium Header */}
						<div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
							<div className="flex items-center gap-3 flex-1 min-w-0">
								<button
									type="button"
									onClick={() => togglePraesidium(praesidium.id)}
									className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
								>
									{isExpanded ? (
										<ChevronDown className="w-4 h-4 text-gray-500" />
									) : (
										<ChevronRight className="w-4 h-4 text-gray-500" />
									)}
								</button>

								<div className="flex-shrink-0">
									<Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
								</div>

								<div className="flex-1 min-w-0">
									<h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
										{praesidium.name}
									</h4>
									<div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
										<MapPin className="w-3 h-3" />
										<span>{praesidium.city}</span>
										<span>•</span>
										<Users className="w-3 h-3" />
										<span>{praesidiumReviere.length} Reviere</span>
									</div>
								</div>
							</div>

							<div className="flex items-center gap-2 flex-shrink-0">
								{onEdit && (
									<button
										type="button"
										onClick={() => onEdit(praesidium)}
										className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
										title="Bearbeiten"
									>
										<Edit className="w-4 h-4" />
									</button>
								)}
								{onDelete && (
									<button
										type="button"
										onClick={() => onDelete(praesidium.id)}
										className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
										title="Löschen"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								)}
							</div>
						</div>

						{/* Reviere Liste */}
						{isExpanded && praesidiumReviere.length > 0 && (
							<div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
								<div className="p-4 space-y-2">
									<h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
										Reviere
									</h5>
									{praesidiumReviere.map((revier) => (
										<div
											key={revier.id}
											className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
										>
											<div className="flex items-center gap-3 flex-1 min-w-0">
												<div className="flex-shrink-0">
													<Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
												</div>
												<div className="flex-1 min-w-0">
													<h6 className="text-sm font-medium text-gray-900 dark:text-white truncate">
														{revier.name}
													</h6>
													<div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
														<MapPin className="w-3 h-3" />
														<span>{revier.city}</span>
													</div>
												</div>
											</div>

											<div className="flex items-center gap-2 flex-shrink-0">
												{onEdit && (
													<button
														type="button"
														onClick={() => onEdit(revier)}
														className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
														title="Bearbeiten"
													>
														<Edit className="w-3 h-3" />
													</button>
												)}
												{onDelete && (
													<button
														type="button"
														onClick={() => onDelete(revier.id)}
														className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
														title="Löschen"
													>
														<Trash2 className="w-3 h-3" />
													</button>
												)}
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				);
			})}

			{praesidien.length === 0 && (
				<div className="text-center py-12 text-gray-500 dark:text-gray-400">
					<Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
						Keine Präsidien gefunden
					</h3>
					<p>Erstellen Sie Ihr erstes Präsidium, um zu beginnen.</p>
				</div>
			)}
		</div>
	);
};
