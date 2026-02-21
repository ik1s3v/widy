import { WidyNetwork } from "./../../shared/enums";
import { api } from ".";

export const widyApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getWidyNonce: builder.mutation<string, { network: WidyNetwork }>({
			query: (args) => ({
				command: "get_widy_nonce",
				args,
			}),
		}),
	}),
});
export const { useGetWidyNonceMutation } = widyApi;
