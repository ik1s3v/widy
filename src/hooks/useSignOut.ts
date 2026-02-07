import { ServiceType } from "./../../shared/enums";
import {
	useTributeBotSignOutMutation,
	useTwitchSignOutMutation,
	useWidySolSignOutMutation,
} from "../api";
import useStreamElementsSocketService from "./useStreamElementsService";

const useSignOut = (id: ServiceType) => {
	const [tributeBotSignOut] = useTributeBotSignOutMutation();
	const [twitchSignOut] = useTwitchSignOutMutation();
	const [widySolSignOut] = useWidySolSignOutMutation();
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
		default:
			return () => null;
	}
};
export default useSignOut;
