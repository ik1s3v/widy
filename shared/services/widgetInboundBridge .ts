import { RefObject } from "react";
import { AppEvent } from "../enums";
import {
	IClientMessage,
	IEventsService,
	IGoal,
	ISettings,
	IWidgetRequest,
} from "../types";

export default class WidgetInboundBridge {
	private readonly eventsService: IEventsService;
	private readonly ref: RefObject<HTMLIFrameElement>;

	constructor(
		ref: RefObject<HTMLIFrameElement>,
		eventsService: IEventsService,
	) {
		this.ref = ref;
		this.eventsService = eventsService;

		window.addEventListener("message", this.handleMessage);
	}

	private handleMessage = async (event: MessageEvent<IWidgetRequest>) => {
		const { id, scope, payload } = event.data;
		if (!id || !scope) return;
		try {
			switch (scope) {
				case "widgets:messages.subscription":
					this.eventsService.subscribe<IClientMessage>(
						AppEvent.Message,
						(data) => {
							this.ref.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						},
					);
					break;
				case "widgets:goal.subscription":
					this.eventsService.subscribe<IGoal>(AppEvent.Goal, (data) => {
						this.ref.current?.contentWindow?.postMessage(
							{ id, result: data },
							"*",
						);
					});
					break;
				case "widgets:settings.subscription":
					console.log("widgets:settings.subscription");
					this.eventsService.subscribe<ISettings>(AppEvent.Settings, (data) => {
						console.log("subscription:", data);
						this.ref.current?.contentWindow?.postMessage(
							{ id, result: data },
							"*",
						);
					});
					break;

				case "widgets:goals.read":
					break;
				case "widgets:messages.read":
					break;
				default:
					break;
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			this.ref.current?.contentWindow?.postMessage({ id, error: message }, "*");
		}
	};

	destroy(): void {
		window.removeEventListener("message", this.handleMessage);
	}
}
