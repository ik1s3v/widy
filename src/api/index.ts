import type { SerializedError } from "@reduxjs/toolkit";
import { type BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import { type InvokeArgs, invoke } from "@tauri-apps/api/core";

const tauriBaseQuery =
	(): BaseQueryFn<
		{ command: string; args?: InvokeArgs | undefined },
		unknown,
		SerializedError
	> =>
	async ({ command, args }) => {
		try {
			const result = await invoke<unknown>(command, args);
			return { data: result };
		} catch (error) {
			return {
				error: {
					message: error as string,
				},
			};
		}
	};

export const api = createApi({
	reducerPath: "api",
	baseQuery: tauriBaseQuery(),
	tagTypes: [
		"Services",
		"Settings",
		"Alerts",
		"Auc-Filters",
		"Auction-Settings",
		"Goals",
		"Maption-Settings",
		"Media-Settings",
		"Messages",
	],
	endpoints: (builder) => ({
		init: builder.mutation<void, void>({
			query: () => ({
				command: "init",
			}),
		}),
		tributeBotSignOut: builder.mutation<void, void>({
			query: () => ({
				command: "tribute_bot_sign_out",
			}),
			invalidatesTags: ["Services"],
		}),
		twitchSignOut: builder.mutation<void, void>({
			query: () => ({
				command: "twitch_sign_out",
			}),
			invalidatesTags: ["Services"],
		}),
		widySolSignOut: builder.mutation<void, void>({
			query: () => ({
				command: "widy_sol_sign_out",
			}),
			invalidatesTags: ["Services"],
		}),
	}),
});

export const {
	useInitMutation,
	useTributeBotSignOutMutation,
	useTwitchSignOutMutation,
	useWidySolSignOutMutation,
} = api;
