import type { IAlert } from "@widy/sdk";
import { api } from ".";

export const alertsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getAlerts: builder.query<IAlert[], void>({
			query: () => ({
				url: "/alerts",
			}),
		}),
	}),
});
export const { useGetAlertsQuery } = alertsApi;
