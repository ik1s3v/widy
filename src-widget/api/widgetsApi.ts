import type { IWidget } from "@widy/sdk";
import { api } from ".";

export const widgetsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getWidgetByWidgetId: builder.query<IWidget, { widgetId?: string }>({
			query: (args) => ({
				url: `/widgets/${args.widgetId}`,
			}),
		}),
	}),
});
export const { useGetWidgetByWidgetIdQuery } = widgetsApi;
