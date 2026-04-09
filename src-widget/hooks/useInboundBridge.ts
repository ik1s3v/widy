import {
	AppEvent,
	GoalType,
	IAlert,
	IAucFighterMatch,
	IAucFighterMatchWinner,
	IAucFighterSettings,
	IClientMessage,
	IGoal,
	IMediaSettings,
	IMessagesFilter,
	IPageParm,
	ISettings,
	IWidgetRequest,
	MatchId,
	MessageId,
} from "@widy/sdk";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import useAppEvents from "../../shared/hooks/useAppEvents";
import { AppDispatch } from "../../src/store";
import { alertsApi } from "../api/alertsApi";
import { aucFighterApi } from "../api/aucFighterApi";
import { goalsApi } from "../api/goalsApi";
import { messagesApi } from "../api/messagesApi";
import { settingsApi } from "../api/settingsApi";

const useInboundBridge = (widgetId?: string) => {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const eventsService = useAppEvents();
	const dispatch = useDispatch<AppDispatch>();
	const messageHandler = useCallback(
		async (event: MessageEvent<IWidgetRequest>) => {
			const { id, scope, payload } = event.data;
			if (!id || !scope) return;

			try {
				switch (scope) {
					case "widgets:messages.subscription":
						eventsService.subscribe<IClientMessage>(
							AppEvent.Message,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:goal.subscription":
						eventsService.subscribe<IGoal>(AppEvent.Goal, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:settings.subscription":
						eventsService.subscribe<ISettings>(AppEvent.Settings, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;

					case "widgets:goals.read": {
						const { data } = await dispatch(
							goalsApi.endpoints.getNotEndedGoal.initiate(
								payload as { type: GoalType },
							),
						);
						iframeRef.current?.contentWindow?.postMessage(
							{ id, result: data },
							"*",
						);

						break;
					}
					case "widgets:auc-fighter:settings.read": {
						const { data } = await dispatch(
							aucFighterApi.endpoints.getAucFighterSettings.initiate(),
						);
						iframeRef.current?.contentWindow?.postMessage(
							{ id, result: data },
							"*",
						);
						break;
					}
					case "widgets:auc-fighter:start-match.subscription":
						eventsService.subscribe<IAucFighterMatch>(
							AppEvent.StartAucFighterMatch,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:auc-fighter:match-winner.send":
						eventsService.send<IAucFighterMatchWinner>({
							event: AppEvent.AucFighterMatchEnd,
							data: payload as IAucFighterMatchWinner,
						});
						break;

					case "widgets:auc-fighter:match-playing.send":
						eventsService.send<MatchId>({
							event: AppEvent.AucFighterMatchPlaying,
							data: payload as MatchId,
						});
						break;

					case "widgets:auc-fighter:pause-match.subscription":
						eventsService.subscribe<MatchId>(
							AppEvent.PauseAucFighterMatch,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:auc-fighter:match-paused.send":
						eventsService.send<MatchId>({
							event: AppEvent.AucFighterMatchPaused,
							data: payload as MatchId,
						});
						break;
					case "widgets:auc-fighter:resume-match.subscription":
						eventsService.subscribe(AppEvent.ResumeAucFighterMatch, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:auc-fighter:cancel-match.subscription":
						eventsService.subscribe(AppEvent.CancelAucFighterMatch, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:auc-fighter:update-match.subscription":
						eventsService.subscribe<IAucFighterMatch>(
							AppEvent.UpdateAucFighterMatch,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:auc-fighter:settings.subscription":
						eventsService.subscribe<IAucFighterSettings>(
							AppEvent.AucFighterSettings,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:messages.read": {
						const { data } = await dispatch(
							messagesApi.endpoints.messages.initiate(
								payload as { filter: IMessagesFilter } & IPageParm,
							),
						);
						iframeRef.current?.contentWindow?.postMessage(
							{ id, result: data },
							"*",
						);
						break;
					}
					case "widgets:alert:played.send":
						eventsService.send<MessageId>({
							event: AppEvent.AlertPlayed,
							data: payload as MessageId,
						});

						break;
					case "widgets:alert:playing.send":
						eventsService.send<MessageId>({
							event: AppEvent.AlertPlaying,
							data: payload as MessageId,
						});
						break;
					case "widgets:alert:replay.subscription":
						eventsService.subscribe<IClientMessage>(
							AppEvent.ReplayAlert,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:alert:skip.subscription":
						eventsService.subscribe<string>(AppEvent.SkipAlert, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:alert:test.subscription":
						eventsService.subscribe<string>(AppEvent.TestAlert, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:alert:skip-playing.subscription":
						eventsService.subscribe<null>(AppEvent.SkipPlayingAlert, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:alert:alerts.subscription":
						eventsService.subscribe<IAlert[]>(AppEvent.Alerts, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:settings.read": {
						const { data } = await dispatch(
							settingsApi.endpoints.getSettings.initiate(),
						);
						iframeRef.current?.contentWindow?.postMessage(
							{ id, result: data },
							"*",
						);
						break;
					}
					case "widgets:alerts.read": {
						const { data } = await dispatch(
							alertsApi.endpoints.getAlerts.initiate(),
						);
						iframeRef.current?.contentWindow?.postMessage(
							{ id, result: data },
							"*",
						);

						break;
					}
					case "widgets:media:played.send":
						eventsService.send<MessageId>({
							event: AppEvent.MediaPlayed,
							data: payload as MessageId,
						});
						break;
					case "widgets:media:replay.subscription":
						eventsService.subscribe<IClientMessage>(
							AppEvent.ReplayMedia,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:media:settings.subscription":
						eventsService.subscribe<IMediaSettings>(
							AppEvent.MediaSettings,
							(data) => {
								iframeRef.current?.contentWindow?.postMessage(
									{ id, result: data },
									"*",
								);
							},
						);
						break;
					case "widgets:media:skip.subscription":
						eventsService.subscribe<string>(AppEvent.SkipMedia, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:media:skip-playing-media.subscription":
						eventsService.subscribe<null>(AppEvent.SkipPlayingMedia, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:media:end.subscription":
						eventsService.subscribe<string>(AppEvent.MediaEnd, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:media:error.subscription":
						eventsService.subscribe<string>(AppEvent.MediaError, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:alert:played.subscription":
						eventsService.subscribe<string>(AppEvent.AlertPlayed, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:media:pause.subscription":
						eventsService.subscribe<MessageId>(AppEvent.PauseMedia, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:media:play.subscription":
						eventsService.subscribe<MessageId>(AppEvent.PlayMedia, (data) => {
							iframeRef.current?.contentWindow?.postMessage(
								{ id, result: data },
								"*",
							);
						});
						break;
					case "widgets:media:end.send":
						eventsService.send<MessageId>({
							event: AppEvent.MediaEnd,
							data: payload as MessageId,
						});
						break;
					case "widgets:media:playing.send":
						eventsService.send<MessageId>({
							event: AppEvent.MediaPlaying,
							data: payload as MessageId,
						});
						break;
					case "widgets:media:paused.send":
						eventsService.send<MessageId>({
							event: AppEvent.MediaPaused,
							data: payload as MessageId,
						});
						break;
					case "widgets:media:error.send":
						eventsService.send<MessageId>({
							event: AppEvent.MediaError,
							data: payload as MessageId,
						});
						break;
					case "widgets:media:replay.send":
						eventsService.send<IClientMessage>({
							event: AppEvent.ReplayMedia,
							data: payload as IClientMessage,
						});
						break;
					case "widgets:alert:replay.send":
						eventsService.send<IClientMessage>({
							event: AppEvent.ReplayAlert,
							data: payload as IClientMessage,
						});
						break;
					case "widgets:alert:skip.send":
						eventsService.send<MessageId>({
							event: AppEvent.SkipAlert,
							data: payload as MessageId,
						});
						break;
					default:
						break;
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				iframeRef.current?.contentWindow?.postMessage(
					{ id, error: message },
					"*",
				);
			}
		},
		[],
	);

	useEffect(() => {
		if (!iframeRef.current) return;
		window.addEventListener("message", messageHandler);
		return () => {
			window.removeEventListener("message", messageHandler);
		};
	}, []);

	return iframeRef;
};
export default useInboundBridge;
