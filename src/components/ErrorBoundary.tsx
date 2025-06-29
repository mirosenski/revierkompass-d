import React from "react";

// Definiere einen spezifischen Error-Typ für bessere Type Safety
type ErrorInfo = Error | string | object | null;

const serializeError = (error: ErrorInfo): string => {
	if (error instanceof Error) {
		return `${error.message}\n${error.stack}`;
	}
	if (typeof error === "string") {
		return error;
	}
	return JSON.stringify(error, null, 2);
};

export class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; error: ErrorInfo }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: ErrorInfo) {
		return { hasError: true, error };
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="p-4 border border-red-500 rounded">
					<h2 className="text-red-500">Something went wrong.</h2>
					<pre className="mt-2 text-sm">{serializeError(this.state.error)}</pre>
				</div>
			);
		}

		return this.props.children;
	}
}
