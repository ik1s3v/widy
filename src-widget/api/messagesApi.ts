import type { IClientMessage, IMessagesFilter, IPageParm } from "@widy/sdk";
import { api } from ".";

export const messagesApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getMessages: builder.query<
			IClientMessage,
			{ filter: IMessagesFilter } & IPageParm
		>({
			query: (args) => ({
				params: { ...args },
				url: "/messages",
			}),
			providesTags: ["Messages"],
		}),
	}),
});
export const { useGetMessagesQuery } = messagesApi;
