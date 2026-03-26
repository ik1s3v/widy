import { Context, createContext } from "react";
import { IEventsService } from "../types";

export const EventsContext = createContext(
	null,
) as Context<IEventsService | null>;
