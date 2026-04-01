import type { SerializedError } from "@reduxjs/toolkit";
import { type BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import {
	type IClientMessage,
	type IMessagesFilter,
	type IPageParm,
	type WidgetAction,
} from "@widy/sdk";
import { bridge } from "..";

const widgetBaseQuery =
	(): BaseQueryFn<
		{ action: WidgetAction; payload?: unknown },
		unknown,
		SerializedError
	> =>
	async ({ action, payload }) => {
		try {
			const result = await bridge.action(action, payload);
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
	baseQuery: widgetBaseQuery(),
	tagTypes: ["Messages"],
	endpoints: (builder) => ({
		getMessages: builder.infiniteQuery<
			IClientMessage[],
			{ filter: IMessagesFilter },
			IPageParm
		>({
			infiniteQueryOptions: {
				initialPageParam: {
					offset: 0,
					limit: 100,
				},
				getNextPageParam: (
					lastPage,
					_allPages,
					lastPageParam,
					_allPageParams,
				) => {
					const nextOffset = lastPageParam.offset + lastPageParam.limit;

					if (lastPage?.length < lastPageParam.limit) {
						return undefined;
					}

					return {
						...lastPageParam,
						offset: nextOffset,
					};
				},
			},
			query: ({ pageParam, queryArg }) => ({
				payload: { ...pageParam, ...queryArg.filter },
				action: "widgets:messages.read",
			}),
			providesTags: ["Messages"],
		}),
	}),
});

export const { useGetMessagesInfiniteQuery } = api;
