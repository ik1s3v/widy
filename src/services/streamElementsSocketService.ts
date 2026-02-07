import { io, Socket } from "socket.io-client";
import { ServiceType, StreamElementsEventType } from "../../shared/enums";
import Subscriptions from "../../shared/services/subscriptions";
import {
	IService,
	IStreamElementsAuth,
	IStreamElementsAuthenticated,
	IStreamElementsEvent,
	IStreamElementsTip,
} from "../../shared/types";
import { servicesApi } from "../api/servicesApi";
import { streamElementsApi } from "../api/streamElementsApi";
import { store } from "../store";

export default class StreamElementsSocketService extends Subscriptions {
	socket: Socket;

	constructor() {
		super();
		this.socket = io("https://realtime.streamelements.com", {
			transports: ["websocket"],
		});

		this.socket.on("unauthorized", async () => {
			this.signOut();
		});

		this.socket.on("authenticated", async (_: IStreamElementsAuthenticated) => {
			const { data } = await store.dispatch(
				servicesApi.endpoints.getServiceWithAuthById.initiate(
					{
						id: ServiceType.Streamelements,
					},
					{ forceRefetch: true },
				),
			);
			const service = data as IService<IStreamElementsAuth, undefined>;
			await this.setAuthorized({
				authorized: true,
				auth: { jwt_token: service.auth.jwt_token },
			});
			this.notifySubscribers("authenticated", true);
		});

		this.socket.on("event", (data: IStreamElementsEvent<unknown>) => {
			switch (data.type) {
				case StreamElementsEventType.tip:
					if (process.env.NODE_ENV !== "development" && data.isMock) return;
					const event = data as IStreamElementsEvent<IStreamElementsTip>;

					store.dispatch(
						streamElementsApi.endpoints.streamElementsTipEvent.initiate({
							event,
						}),
					);
					break;

				default:
					break;
			}
		});

		this.socket.on("connect", async () => {
			const { data } = await store.dispatch(
				servicesApi.endpoints.getServiceWithAuthById.initiate(
					{
						id: ServiceType.Streamelements,
					},
					{ forceRefetch: true },
				),
			);
			const service = data as IService<IStreamElementsAuth, undefined>;
			const token = service?.auth?.jwt_token;
			if (token) {
				this.socket.emit("authenticate", { method: "jwt", token });
			}
		});
	}

	async setAuthorized({
		authorized,
		auth,
	}: {
		authorized: boolean;
		auth?: IStreamElementsAuth;
	}) {
		await store
			.dispatch(
				servicesApi.endpoints.updateServiceAuth.initiate({
					id: ServiceType.Streamelements,
					authorized,
					auth,
				}),
			)
			.unwrap();
	}

	async signIn(token: string) {
		await this.setAuthorized({
			authorized: false,
			auth: {
				jwt_token: token,
			},
		});
		if (this.socket.connected) {
			this.socket.disconnect();
		}
		this.socket.connect();
	}

	signOut() {
		this.socket.disconnect();
		this.setAuthorized({ authorized: false });
	}
}
