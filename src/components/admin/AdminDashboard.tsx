import {
	BarChart3,
	Building2,
	Database,
	MapPin,
	Menu,
	Settings,
	X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import Logo from "@/components/ui/Logo";
import AddressImporter from "./AddressImporter";
import { AdminAddressManagement } from "./addresses";
import { AdminStationManagement } from "./stations";

const AdminDashboard: React.FC = () => {
	const [activeTab, setActiveTab] = useState("stations");
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const tabs = [
		{
			id: "stations",
			label: "Stationen",
			icon: Building2,
			description: "Polizeipräsidien und Reviere verwalten",
		},
		{
			id: "addresses",
			label: "Adressen",
			icon: MapPin,
			description: "Benutzer-Adressen verwalten und genehmigen",
		},
		{
			id: "import",
			label: "Import",
			icon: Database,
			description: "Adressen aus Daten-Dateien importieren",
		},
		{
			id: "analytics",
			label: "Analytics",
			icon: BarChart3,
			description: "Statistiken und Berichte",
		},
		{
			id: "settings",
			label: "Einstellungen",
			icon: Settings,
			description: "System-Einstellungen",
		},
	];

	const renderTabContent = () => {
		switch (activeTab) {
			case "stations":
				return <AdminStationManagement />;
			case "addresses":
				return <AdminAddressManagement />;
			case "import":
				return (
					<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
							<AddressImporter />
						</div>
					</div>
				);
			case "analytics":
				return (
					<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
							<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-8">
								<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
									Analytics & Berichte
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
									Analytics-Funktionen werden in Kürze verfügbar sein.
								</p>
							</div>
						</div>
					</div>
				);
			case "settings":
				return (
					<div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
							<div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-4 sm:p-8">
								<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
									System-Einstellungen
								</h2>
								<p className="text-gray-600 dark:text-gray-400">
									System-Einstellungen werden in Kürze verfügbar sein.
								</p>
							</div>
						</div>
					</div>
				);
			default:
				return <AdminStationManagement />;
		}
	};

	const handleTabClick = (tabId: string) => {
		setActiveTab(tabId);
		setIsMobileMenuOpen(false);
	};

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Mobile Header */}
			<div className="lg:hidden sticky top-0 z-50 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex items-center gap-3">
						<button
							type="button"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
							aria-label="Menü öffnen"
						>
							{isMobileMenuOpen ? (
								<X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
							) : (
								<Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
							)}
						</button>
						<div className="flex items-center gap-3">
							<Logo size="sm" showText={false} animated={false} />
							<div>
								<h1 className="text-lg font-bold text-gray-900 dark:text-white">
									Admin Dashboard
								</h1>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									{tabs.find((tab) => tab.id === activeTab)?.label}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Mobile Menu Overlay */}
			{isMobileMenuOpen && (
				<div className="lg:hidden fixed inset-0 z-[60]">
					{/* Backdrop */}
					<div
						role="button"
						tabIndex={0}
						className="absolute inset-0 bg-black/50 backdrop-blur-sm"
						onClick={() => setIsMobileMenuOpen(false)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								setIsMobileMenuOpen(false);
							}
						}}
						aria-label="Menü schließen"
					/>

					{/* Menu Panel */}
					<div className="absolute top-0 left-0 w-80 h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out">
						<div className="p-4 border-b border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-bold text-gray-900 dark:text-white">
									Navigation
								</h2>
								<button
									type="button"
									onClick={() => setIsMobileMenuOpen(false)}
									className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
									aria-label="Menü schließen"
								>
									<X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
								</button>
							</div>
						</div>
						<nav className="p-4 space-y-2 overflow-y-auto h-full">
							{tabs.map((tab) => {
								const Icon = tab.icon;
								const isActive = activeTab === tab.id;

								return (
									<button
										type="button"
										key={tab.id}
										onClick={() => handleTabClick(tab.id)}
										className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
											isActive
												? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700"
												: "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
										}`}
									>
										<Icon className="h-5 w-5 flex-shrink-0" />
										<div className="flex-1">
											<div className="font-semibold">{tab.label}</div>
											<div className="text-xs opacity-75 mt-0.5">
												{tab.description}
											</div>
										</div>
									</button>
								);
							})}
						</nav>
					</div>
				</div>
			)}

			{/* Desktop Tab Navigation */}
			<div className="hidden lg:block sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex space-x-8">
						{tabs.map((tab) => {
							const Icon = tab.icon;
							const isActive = activeTab === tab.id;

							return (
								<button
									type="button"
									key={tab.id}
									onClick={() => setActiveTab(tab.id)}
									className={`flex items-center space-x-3 py-6 px-4 font-medium transition-all duration-200 border-b-2 ${
										isActive
											? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400"
											: "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
									}`}
								>
									<Icon className="h-5 w-5" />
									<div className="text-left">
										<div className="font-semibold">{tab.label}</div>
										<div className="text-xs opacity-75">{tab.description}</div>
									</div>
								</button>
							);
						})}
					</div>
				</div>
			</div>

			{/* Tab Content */}
			<div className="flex-1">{renderTabContent()}</div>
		</div>
	);
};

export default AdminDashboard;
