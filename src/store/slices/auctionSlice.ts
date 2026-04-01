import { createSlice } from "@reduxjs/toolkit";
import type { IAuctionSettings } from "@widy/sdk";

interface AuctionSettingsState {
	auctionSettings: IAuctionSettings | null;
}

const initialState: AuctionSettingsState = {
	auctionSettings: null,
};

export const auctionSlice = createSlice({
	name: "auction",
	initialState,
	reducers: {
		setAuctionSettings: (
			state,
			action: {
				payload: IAuctionSettings;
			},
		) => {
			state.auctionSettings = action.payload;
		},
	},
});

export const { setAuctionSettings } = auctionSlice.actions;
