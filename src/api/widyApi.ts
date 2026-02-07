import { api } from ".";

export const widySolApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getWidySolNonce: builder.mutation<string, void>({
			query: () => ({
				command: "get_widy_sol_nonce",
			}),
		}),
	}),
});
export const { useGetWidySolNonceMutation } = widySolApi;
