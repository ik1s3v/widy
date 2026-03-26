import { IWidgetResponse, WidgetAction, WidgetSubscription } from "../types";

export default class WidgetOutboundBridge {
	private readonly pendingRequests = new Map();
	private readonly subscriptionHandlers = new Map();
	private static readonly REQUEST_TIMEOUT_MS = 5000;

	constructor() {
		window.addEventListener("message", this.handleMessage);
	}

	private handleMessage = (event: MessageEvent<IWidgetResponse>): void => {
		const { id, result, error } = event.data;
		if (!id) return;

		if (this.subscriptionHandlers.has(id)) {
			this.subscriptionHandlers.get(id)!(result);
			return;
		}

		if (!this.pendingRequests.has(id)) return;

		const { resolve, reject } = this.pendingRequests.get(id)!;
		this.pendingRequests.delete(id);

		if (error) {
			reject(new Error(error));
		} else {
			resolve(result);
		}
	};

	action<T>(scope: WidgetAction, payload?: T): Promise<unknown> {
		return new Promise((resolve, reject) => {
			const id = crypto.randomUUID();
			this.pendingRequests.set(id, { resolve, reject });
			window.parent.postMessage({ id, scope, payload }, "*");

			setTimeout(() => {
				if (this.pendingRequests.has(id)) {
					this.pendingRequests.delete(id);
					reject(new Error(`Parent request "${scope}" timed out`));
				}
			}, WidgetOutboundBridge.REQUEST_TIMEOUT_MS);
		});
	}

	subscribe<T>(
		scope: WidgetSubscription,
		onMessage: (message: T) => void,
	): () => void {
		const id = crypto.randomUUID();
		this.subscriptionHandlers.set(id, onMessage);
		window.parent.postMessage({ id, scope }, "*");

		return () => {
			this.subscriptionHandlers.delete(id);
		};
	}

	destroy(): void {
		this.subscriptionHandlers.clear();
		this.pendingRequests.clear();
		window.removeEventListener("message", this.handleMessage);
	}
}
