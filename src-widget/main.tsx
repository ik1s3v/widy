import { CssBaseline } from "@mui/material";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";
import "../shared/i18n/i18n";
import { Provider } from "react-redux";
import { EventsContext } from "../shared/contexts/EventsContext";
import { AppEvent } from "../shared/enums";
import i18n from "../shared/i18n/i18n";
import EventsProvider from "../shared/providers/EventsProvider";
import { WebsocketEventsService } from "../shared/services/websocketEventsService";
import { setPlayingAlertId } from "../shared/slices/alertsSlice";
import {
	setPausedMediaId,
	setPlayingMediaId,
} from "../shared/slices/mediaSlice";
import type { IClientMessage, ISettings } from "../shared/types";
import { messagesApi } from "./api/messagesApi";
import { store } from "./store";

const eventsService = new WebsocketEventsService("ws://127.0.0.1:12553/ws");

eventsService.connect();

store.dispatch(messagesApi.util.invalidateTags(["Messages"]));

eventsService.subscribe<IClientMessage>(AppEvent.Message, (_) => {
	store.dispatch(messagesApi.util.invalidateTags(["Messages"]));
});

eventsService.subscribe<string>(AppEvent.AlertPlaying, (id) => {
	store.dispatch(setPlayingAlertId(id));
});

eventsService.subscribe<string>(AppEvent.MediaPlaying, (id) => {
	store.dispatch(setPausedMediaId(""));
	store.dispatch(setPlayingMediaId(id));
});

eventsService.subscribe<string>(AppEvent.MediaPaused, (id) => {
	store.dispatch(setPausedMediaId(id));
});

eventsService.subscribe<string>(AppEvent.AlertPlayed, (_) => {
	store.dispatch(setPlayingAlertId(""));
});
eventsService.subscribe<string>(AppEvent.MediaPlayed, (_) => {
	store.dispatch(setPlayingMediaId(""));
	store.dispatch(setPausedMediaId(""));
});

eventsService.subscribe<ISettings>(AppEvent.Settings, (settings) => {
	i18n.changeLanguage(settings.language);
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<EventsProvider context={EventsContext} eventsService={eventsService}>
			<Provider store={store}>
				<BrowserRouter>
					<CssBaseline />
					<App />
				</BrowserRouter>
			</Provider>
		</EventsProvider>
	</React.StrictMode>,
);
