import { IEventsService } from "@widy/sdk";
import { createContext } from "react";

export const EventsContext = createContext<IEventsService | null>(null);
