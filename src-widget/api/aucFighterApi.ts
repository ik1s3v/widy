import type { IAucFighterSettings } from "@widy/sdk";
import { api } from ".";

export const aucFighterApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getAucFighterSettings: builder.query<IAucFighterSettings, void>({
			query: () => ({
				url: "/auc-fighter-settings",
			}),
		}),
	}),
});
export const { useGetAucFighterSettingsQuery } = aucFighterApi;
