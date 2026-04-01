import { createContext } from "react";
import type StreamElementsSocketService from "../services/streamElementsSocketService";

export const StreamElementsSocketServiceContext =
	createContext<StreamElementsSocketService | null>(null);
