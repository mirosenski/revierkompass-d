import { create } from "zustand";

export interface User {
	id: string;
	username: string;
	firstName?: string;
	lastName?: string;
	email: string;
	role: "admin" | "user";
	avatar?: string;
	isAdmin: boolean;
	lastLogin: Date;
}

export interface AuthState {
	// Authentication State
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;

	// Actions
	login: (user: User) => void;
	loginWithCredentials: (
		username: string,
		password: string,
	) => Promise<boolean>;
	logout: () => void;
	updateUser: (updates: Partial<User>) => void;

	// Utilities
	hasRole: (role: string) => boolean;
	isAdmin: boolean;

	// Loading States
	isLoggingIn: boolean;
	setLoggingIn: (loading: boolean) => void;

	// Session Management
	checkSession: () => boolean;
	clearSession: () => void;
	initializeSession: () => void;
	loadFromStorage: () => void;
}

// Demo users for testing
const DEMO_USERS: Record<string, { password: string; user: User }> = {
	admin: {
		password: "admin123",
		user: {
			id: "user_admin_001",
			username: "admin",
			firstName: "Max",
			lastName: "Mustermann",
			email: "admin@polizei-bw.de",
			role: "admin",
			avatar: "/favicon.ico",
			isAdmin: true,
			lastLogin: new Date(),
		},
	},
	demo: {
		password: "demo123",
		user: {
			id: "user_demo_001",
			username: "demo",
			firstName: "Demo",
			lastName: "Benutzer",
			email: "demo@polizei-bw.de",
			role: "user",
			isAdmin: false,
			lastLogin: new Date(),
		},
	},
};

// Helper function to save to localStorage
const saveToStorage = (data: {
	isAuthenticated: boolean;
	user: User | null;
	token: string | null;
}) => {
	try {
		localStorage.setItem("revierkompass-auth", JSON.stringify(data));
		console.log("💾 Auth-Daten gespeichert:", data);
	} catch (error) {
		console.error("❌ Fehler beim Speichern:", error);
	}
};

// Helper function to load from localStorage
const loadFromStorage = () => {
	try {
		const data = localStorage.getItem("revierkompass-auth");
		if (data) {
			const parsed = JSON.parse(data);
			console.log("📂 Auth-Daten geladen:", parsed);
			return parsed;
		}
	} catch (error) {
		console.error("❌ Fehler beim Laden:", error);
	}
	return null;
};

export const useAuthStore = create<AuthState>((set, get) => {
	// Load initial state from localStorage
	const savedData = loadFromStorage();
	const initialState = savedData || {
		isAuthenticated: false,
		user: null,
		token: null,
	};

	console.log("🚀 Auth Store initialisiert mit:", initialState);

	return {
		// Initial State
		isAuthenticated: initialState.isAuthenticated,
		user: initialState.user,
		token: initialState.token,
		isLoggingIn: false,

		// Actions
		login: (user: User) => {
			const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			console.log("🔐 Login durchgeführt:", { user, token });

			const newState = {
				isAuthenticated: true,
				user: {
					...user,
					lastLogin: new Date(),
				},
				token: token,
			};

			set(newState);
			saveToStorage(newState);
		},

		loginWithCredentials: async (
			username: string,
			password: string,
		): Promise<boolean> => {
			set({ isLoggingIn: true });

			try {
				// Simulate API delay
				await new Promise((resolve) => setTimeout(resolve, 1000));

				const userRecord = DEMO_USERS[username.toLowerCase()];

				if (!userRecord || userRecord.password !== password) {
					set({ isLoggingIn: false });
					return false;
				}

				// Generate a simple token
				const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

				console.log("🔐 Login mit Credentials:", {
					user: userRecord.user,
					token,
				});

				const newState = {
					isAuthenticated: true,
					user: {
						...userRecord.user,
						lastLogin: new Date(),
					},
					token: token,
					isLoggingIn: false,
				};

				set(newState);
				saveToStorage(newState);

				return true;
			} catch (error) {
				console.error("Login error:", error);
				set({ isLoggingIn: false });
				return false;
			}
		},

		logout: () => {
			console.log("🔐 Logout durchgeführt");
			const newState = {
				isAuthenticated: false,
				user: null,
				token: null,
			};
			set(newState);
			saveToStorage(newState);
		},

		updateUser: (updates: Partial<User>) => {
			const currentUser = get().user;
			if (currentUser) {
				const updatedUser = { ...currentUser, ...updates };
				const newState = {
					...get(),
					user: updatedUser,
				};
				set({ user: updatedUser });
				saveToStorage(newState);
			}
		},

		// Utilities
		hasRole: (role: string): boolean => {
			const user = get().user;
			return user ? user.role === role : false;
		},

		get isAdmin() {
			return get().user?.isAdmin || false;
		},

		// Loading States
		setLoggingIn: (loading: boolean) => set({ isLoggingIn: loading }),

		// Session Management
		checkSession: () => {
			const { token, user, isAuthenticated } = get();
			console.log("🔍 Session Check:", {
				token: !!token,
				user: !!user,
				isAuthenticated,
			});
			return !!(token && user && isAuthenticated);
		},

		clearSession: () => {
			console.log("🔐 Session gelöscht");
			const newState = {
				isAuthenticated: false,
				user: null,
				token: null,
			};
			set(newState);
			saveToStorage(newState);
		},

		loadFromStorage: () => {
			const savedData = loadFromStorage();
			if (savedData) {
				set(savedData);
				console.log("✅ Session aus localStorage wiederhergestellt");
			}
		},

		initializeSession: () => {
			console.log("🚀 Session Initialisierung startet");
			get().loadFromStorage();

			const { token, user, isAuthenticated } = get();
			console.log("🚀 Session Initialisierung abgeschlossen:", {
				token: !!token,
				user: !!user,
				isAuthenticated,
			});
		},
	};
});
