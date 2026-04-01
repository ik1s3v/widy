import { useBridge, useWidgetSubscription } from "@widy/react";
import type { IAlert, IClientMessage, ISettings, MessageId } from "@widy/sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import getTestAlertMessage from "../../../../shared/utils/getTestAlertMessage";
import getAlertByMessage from "../utils/getAlertByMessage";

const usePlayAlert = () => {
	const bridge = useBridge();
	const { t } = useTranslation();
	const alertAudioRef = useRef<HTMLAudioElement>(new Audio());
	const messageAudioRef = useRef<HTMLAudioElement>(new Audio());
	const alertsRef = useRef<IAlert[]>([]);
	const settingsRef = useRef<ISettings | null>(null);
	const messagesRef = useRef<IClientMessage[]>([]);
	const [currentMessage, setCurrentMessage] = useState<IClientMessage>();
	const [currentAlert, setCurrentAlert] = useState<IAlert>();
	const BASE_URL = import.meta.env.PUBLIC_BASE_URL;

	const handleMessageAudioEnd = useCallback(
		({
			message,
			skip = false,
		}: {
			message: IClientMessage | undefined;
			skip?: boolean;
		}) => {
			messageAudioRef.current.pause();
			alertAudioRef.current.pause();
			setTimeout(
				() => {
					if (!message) return;
					bridge.send<MessageId>("widgets:alert:played.send", message.id);
					messagesRef.current = messagesRef.current.filter(
						(m) => m.id !== message.id,
					);

					const newCurrentMessage = messagesRef.current.at(0);

					setCurrentMessage(undefined);
					setTimeout(() => {
						if (newCurrentMessage) {
							const alert = getAlertByMessage({
								alerts: alertsRef.current,
								message: newCurrentMessage,
							});
							if (alert) {
								playMessage({ message: newCurrentMessage, alert });
							}
						}
					}, 0);
				},
				skip ? 0 : 3000,
			);
		},
		[],
	);
	const playMessage = useCallback(
		({ message, alert }: { message: IClientMessage; alert: IAlert }) => {
			if (settingsRef.current && !settingsRef.current.alert_paused) {
				setTimeout(() => {
					if (settingsRef.current && messagesRef.current.length) {
						bridge.send<MessageId>("widgets:alert:playing.send", message.id);
						alertAudioRef.current.src = `${BASE_URL}/static/${alert.audio}`;
						alertAudioRef.current.volume = alert.audio_volume / 100;
						alertAudioRef.current.play();
						setCurrentMessage(message);
						setCurrentAlert(alert);
					}
				}, settingsRef.current.moderation_duration);
			}
		},
		[],
	);

	const testAlert = useCallback((id: string) => {
		const urlParams = new URLSearchParams(window.location.search);
		const group_id = urlParams.get("group_id");
		const alert = alertsRef.current.find(
			(alert) => alert.id === id && alert.group_id === group_id,
		);
		if (!alert) return;
		const testMessage = getTestAlertMessage({
			alert,
			userName: t("alert.test_name"),
			text: t("alert.test_text"),
			type: alert.type,
		});
		if (!testMessage) return;

		if (!messagesRef.current.length && settingsRef.current) {
			bridge.send<MessageId>("widgets:alert:playing.send", testMessage.id);
			alertAudioRef.current.src = `${BASE_URL}/static/${alert.audio}`;
			alertAudioRef.current.volume = alert.audio_volume / 100;
			alertAudioRef.current.play();
			setCurrentMessage(testMessage);
			setCurrentAlert(alert);
		}
	}, []);

	const skipMessage = useCallback(
		(id: string) => {
			if (currentMessage?.id === id) {
				handleMessageAudioEnd({ message: currentMessage, skip: true });
			} else {
				messagesRef.current = messagesRef.current.filter(
					(message) => message.id !== id,
				);
			}
		},
		[handleMessageAudioEnd, currentMessage],
	);
	const skipPlayingMessage = useCallback(() => {
		if (currentMessage) {
			handleMessageAudioEnd({ message: currentMessage, skip: true });
		}
	}, [handleMessageAudioEnd, currentMessage]);

	const handleNewMessage = useCallback(
		(message: IClientMessage) => {
			const alert = getAlertByMessage({
				alerts: alertsRef.current,
				message: message,
			});
			if (alert) {
				messagesRef.current = [...messagesRef.current, message];
				if (messagesRef.current.length === 1) {
					playMessage({ message, alert });
				}
			}
		},
		[playMessage],
	);
	const handleReplayMessage = useCallback(
		(message: IClientMessage) => {
			const alert = getAlertByMessage({
				alerts: alertsRef.current,
				message: message,
			});
			if (alert) {
				messagesRef.current = [message, ...messagesRef.current];

				if (messagesRef.current.length === 1) {
					playMessage({ message, alert });
				}
			}
		},
		[playMessage],
	);

	const handleAlertAudioEnd = useCallback(() => {
		const audio = currentMessage?.donation?.audio;
		if (audio && settingsRef.current) {
			messageAudioRef.current.src = `${BASE_URL}/static/${audio}`;
			messageAudioRef.current.volume = settingsRef.current.tts_volume / 100;
			messageAudioRef.current.play();
		} else {
			handleMessageAudioEnd({ message: currentMessage });
		}
	}, [currentMessage, handleMessageAudioEnd]);

	const handleSettings = useCallback((settings: ISettings) => {
		if (settingsRef.current?.alert_paused && !settings.alert_paused) {
			settingsRef.current = settings;
			const message = messagesRef.current.at(0);

			if (message) {
				const alert = getAlertByMessage({
					alerts: alertsRef.current,
					message: message,
				});
				if (alert) {
					playMessage({ message, alert });
				}
			}
			return;
		}
		settingsRef.current = settings;
	}, []);
	const handleAlerts = useCallback((alerts: IAlert[]) => {
		alertsRef.current = alerts;
	}, []);

	useEffect(() => {
		messageAudioRef.current.onended = () =>
			handleMessageAudioEnd({ message: currentMessage });
		messageAudioRef.current.onerror = () =>
			handleMessageAudioEnd({ message: currentMessage });

		return () => {
			messageAudioRef.current.onended = null;
			messageAudioRef.current.onerror = null;
		};
	}, [currentMessage, handleMessageAudioEnd]);

	useEffect(() => {
		alertAudioRef.current.onended = handleAlertAudioEnd;
		alertAudioRef.current.onerror = handleAlertAudioEnd;

		return () => {
			alertAudioRef.current.onended = null;
			alertAudioRef.current.onerror = null;
		};
	}, [handleAlertAudioEnd]);

	useWidgetSubscription<IClientMessage>(
		"widgets:messages.subscription",
		handleNewMessage,
	);
	useWidgetSubscription<IClientMessage>(
		"widgets:alert:replay.subscription",
		handleReplayMessage,
	);
	useWidgetSubscription<string>("widgets:alert:skip.subscription", skipMessage);
	useWidgetSubscription<string>("widgets:alert:test.subscription", testAlert);

	useWidgetSubscription<null>(
		"widgets:alert:skip-playing.subscription",
		skipPlayingMessage,
	);
	useWidgetSubscription<IAlert[]>(
		"widgets:alert:alerts.subscription",
		handleAlerts,
	);
	useWidgetSubscription<ISettings>(
		"widgets:settings.subscription",
		handleSettings,
	);

	useEffect(() => {
		bridge
			.action<void, ISettings>("widgets:settings.read")
			.then(handleSettings);
	}, []);

	useEffect(() => {
		bridge.action<void, IAlert[]>("widgets:alerts.read").then(handleAlerts);
	}, []);

	return {
		currentMessage,
		currentAlert,
		settings: settingsRef.current,
	};
};
export default usePlayAlert;
