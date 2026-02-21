import { createSlice } from "@reduxjs/toolkit";
import { ServiceType, WidyNetwork } from "../enums";

interface ServicesState {
	services: Record<
		ServiceType,
		{
			active: boolean;
			color: string;
			authPath: string;
			settingsPath: string;
		}
	>;
}

const initialState: ServicesState = {
	services: {
		[ServiceType.Streamelements]: {
			active: false,
			color: "#2701fb",
			authPath: "/streamelements/token",
			settingsPath: "",
		},
		[ServiceType.TributeBot]: {
			active: false,
			color: "#2692ffb2",
			authPath: "/telegram-authorization/request-code",
			settingsPath: "",
		},
		[ServiceType.Twitch]: {
			active: false,
			color: "#9147ff",
			authPath: "/twitch/device-code",
			settingsPath: "/services-settings/twitch",
		},
		[ServiceType.WidySol]: {
			active: false,
			color: "#370161",
			authPath: `/widy/create-donation-account/${WidyNetwork.Sol}`,
			settingsPath: "",
		},
		[ServiceType.WidyTon]: {
			active: false,
			color: "#0098ea",
			authPath: `/widy/create-donation-account/${WidyNetwork.Ton}`,
			settingsPath: "",
		},
	},
};

export const servicesSlice = createSlice({
	name: "services",
	initialState,
	reducers: {
		setServiceActive: (
			state,
			action: {
				payload: {
					service: ServiceType;
					active: boolean;
				};
			},
		) => {
			state.services[action.payload.service].active = action.payload.active;
		},
	},
});

export const { setServiceActive } = servicesSlice.actions;
