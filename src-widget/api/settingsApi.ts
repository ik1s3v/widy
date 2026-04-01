import type { IAlert } from "@widy/sdk";
import { api } from ".";

export const settingsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getSettings: builder.query<IAlert[], void>({
			query: () => ({
				url: "/settings",
			}),
		}),
	}),
});
export const { useGetSettingsQuery } = settingsApi;
