import { api } from ".";

export const streamLabsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		streamLabsConnect: builder.mutation<void, void>({
			query: () => ({
				command: "stream_labs_connect",
			}),
			invalidatesTags: ["Services"],
		}),
	}),
});
export const { useStreamLabsConnectMutation } = streamLabsApi;
