import { api } from ".";

export const widgetApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getWidgetByName: builder.query<string, { name: string }>({
			query: (args) => ({
				command: "get_widget_by_name",
				args,
			}),
		}),
		uploadWidget: builder.mutation<void, { devPath: string; manifest: string }>(
			{
				query: (args) => ({
					command: "upload_widget",
					args,
				}),
			},
		),
	}),
});
export const { useGetWidgetByNameQuery, useUploadWidgetMutation } = widgetApi;
