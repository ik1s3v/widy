import type { Context, ReactNode } from "react";
import type { IEventsService } from "../types";

const EventsProvider = ({
	children,
	context,
	eventsService,
}: {
	children: ReactNode;
	context: Context<any>;
	eventsService: IEventsService;
}) => {
	return <context.Provider value={eventsService}>{children}</context.Provider>;
};

export default EventsProvider;
