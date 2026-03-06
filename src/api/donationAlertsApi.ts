import { api } from ".";

export const donationAlertsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		donationAlertsConnect: builder.mutation<void, void>({
			query: () => ({
				command: "donation_alerts_connect",
			}),
			invalidatesTags: ["Services"],
		}),
	}),
});
export const { useDonationAlertsConnectMutation } = donationAlertsApi;
