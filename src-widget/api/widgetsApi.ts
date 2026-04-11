import type { IWidget } from "@widy/sdk";
import { api } from ".";

export const widgetsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getWidgetById: builder.query<IWidget, { id?: string }>({
			query: (args) => ({
				url: `/widgets/${args.id}`,
			}),
			providesTags: ["Widgets"],
		}),
		updateWidget: builder.mutation<void, IWidget>({
			query: (args) => ({
				url: "/widgets",
				body: args,
				method: "PUT",
			}),
			invalidatesTags: ["Widgets"],
		}),
	}),
});
export const { useGetWidgetByIdQuery } = widgetsApi;
