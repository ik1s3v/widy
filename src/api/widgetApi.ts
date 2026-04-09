import { IManifest, IWidget } from "@widy/sdk";
import { api } from ".";

export const widgetApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getWidgetByWidgetId: builder.query<IWidget, { widgetId: string }>({
			query: (args) => ({
				command: "get_widget_by_widget_id",
				args,
			}),
			providesTags: ["Widgets"],
		}),
		getWidgets: builder.query<IWidget[], void>({
			query: () => ({
				command: "get_widgets",
			}),
			providesTags: ["Widgets"],
		}),
		addWidget: builder.mutation<
			void,
			{ devPath?: string; manifest: IManifest }
		>({
			query: (args) => ({
				command: "add_widget",
				args,
			}),
			invalidatesTags: ["Widgets"],
		}),
		deleteWidget: builder.mutation<void, { widget: IWidget }>({
			query: (args) => ({
				command: "delete_widget",
				args,
			}),
			invalidatesTags: ["Widgets"],
		}),
		installWidget: builder.mutation<void, { manifest: IManifest }>({
			query: (args) => ({
				command: "install_widget",
				args,
			}),
			invalidatesTags: ["Widgets"],
		}),
	}),
});
export const {
	useGetWidgetByWidgetIdQuery,
	useAddWidgetMutation,
	useGetWidgetsQuery,
	useDeleteWidgetMutation,
	useInstallWidgetMutation,
} = widgetApi;
