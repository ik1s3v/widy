import { IEventMessage, IEventsService } from "../types";
import Subscriptions from "./subscriptions";

export class WebsocketEventsService
	extends Subscriptions
	implements IEventsService
{
	private socket: WebSocket | null = null;
	private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

	private static readonly RECONNECT_DELAY_MS = 1000;

	constructor(private readonly url: string) {
		super();
	}

	connect(): void {
		if (this.isConnected()) return;

		this.clearReconnectTimer();
		this.socket = new WebSocket(this.url);
		this.socket.onmessage = ({ data }) => {
			const message: IEventMessage<unknown> = JSON.parse(data);
			this.notifySubscribers(message.event, message.data);
		};
		this.socket.onclose = () => {
			this.scheduleReconnect();
		};
	}

	disconnect(): void {
		this.clearReconnectTimer();

		if (this.socket) {
			this.socket.onclose = null;
			this.socket.close();
			this.socket = null;
		}
	}

	send<T>(message: IEventMessage<T>): void {
		if (!this.isConnected()) return;

		try {
			this.socket!.send(JSON.stringify(message));
		} catch (error) {
			console.error(
				"[WebsocketTransportService] Failed to send message:",
				error,
			);
		}
	}

	private isConnected(): boolean {
		return this.socket?.readyState === WebSocket.OPEN;
	}

	private scheduleReconnect(): void {
		this.reconnectTimer = setTimeout(
			() => this.connect(),
			WebsocketEventsService.RECONNECT_DELAY_MS,
		);
	}

	private clearReconnectTimer(): void {
		if (this.reconnectTimer !== null) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
	}
}
