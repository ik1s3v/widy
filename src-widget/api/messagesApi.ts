import type { IClientMessage, IMessagesFilter, IPageParm } from "@widy/sdk";
import { api } from ".";

export const messagesApi = api.injectEndpoints({
	endpoints: (builder) => ({
		messages: builder.query<
			IClientMessage,
			{ filter: IMessagesFilter } & IPageParm
		>({
			query: (args) => ({
				params: { ...args },
				url: "/messages",
			}),
			providesTags: ["Messages"],
		}),
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
				url: "/messages",
				params: { ...pageParam, ...queryArg.filter },
			}),
			providesTags: ["Messages"],
		}),
	}),
});
export const { useGetMessagesInfiniteQuery } = messagesApi;
