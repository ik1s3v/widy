import { ServiceType } from "./../../shared/enums";
import {
	useDonationAlertsSignOutMutation,
	useTributeBotSignOutMutation,
	useTwitchSignOutMutation,
	useWidySolSignOutMutation,
	useWidyTonSignOutMutation,
} from "../api";
import useStreamElementsSocketService from "./useStreamElementsService";

const useSignOut = (id: ServiceType) => {
	const [tributeBotSignOut] = useTributeBotSignOutMutation();
	const [twitchSignOut] = useTwitchSignOutMutation();
	const [widySolSignOut] = useWidySolSignOutMutation();
	const [widyTonSignOut] = useWidyTonSignOutMutation();
	const [donationAlertsSignOut] = useDonationAlertsSignOutMutation();
	const streamElementsSocketService = useStreamElementsSocketService();

	switch (id) {
		case ServiceType.TributeBot:
			return tributeBotSignOut;
		case ServiceType.Streamelements:
			return streamElementsSocketService.signOut.bind(
				streamElementsSocketService,
			);
		case ServiceType.Twitch:
			return twitchSignOut;
		case ServiceType.WidySol:
			return widySolSignOut;
		case ServiceType.WidyTon:
			return widyTonSignOut;
		case ServiceType.DonationAlerts:
			return donationAlertsSignOut;
		default:
			return () => null;
	}
};
export default useSignOut;
