import { useContext } from "react";
import { EventsContext } from "../contexts/EventsContext";

const useAppEvents = () => {
	const service = useContext(EventsContext);
	if (!service) {
		throw new Error("useAppEvents must be used within a EventsProvider");
	}
	return service;
};
export default useAppEvents;
