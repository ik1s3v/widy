import { useBridge, useWidgetSubscription } from "@widy/react";
import type {
	IClientMessage,
	IMediaSettings,
	ISettings,
	MessageId,
} from "@widy/sdk";
import { useCallback, useEffect, useRef, useState } from "react";

const usePlayMedia = () => {
	const bridge = useBridge();
	const mediaSettingsRef = useRef<IMediaSettings | null>(null);
	const settingsRef = useRef<ISettings | null>(null);
	const messagesRef = useRef<IClientMessage[]>([]);
	const [currentMessage, setCurrentMessage] = useState<IClientMessage>();

	const handleMediaEnd = useCallback(
		({ message }: { message?: IClientMessage }) => {
			if (!message) return;
			bridge.send<MessageId>("widgets:media:played.send", message.id);

			messagesRef.current = messagesRef.current.filter(
				(m) => m.id !== message.id,
			);

			const newCurrentMessage = messagesRef.current.at(0);
			setCurrentMessage(undefined);
			setTimeout(() => {
				if (newCurrentMessage) {
					playMedia({ message: newCurrentMessage });
				}
			}, 0);
		},
		[],
	);
	const playMedia = useCallback(({ message }: { message: IClientMessage }) => {
		if (settingsRef.current && !settingsRef.current.alert_paused) {
			setCurrentMessage(message);
		}
	}, []);

	const skipMedia = useCallback(
		(id: string) => {
			if (currentMessage?.id === id) {
				handleMediaEnd({ message: currentMessage });
			} else {
				messagesRef.current = messagesRef.current.filter(
					(message) => message.id !== id,
				);
			}
		},
		[handleMediaEnd, currentMessage],
	);

	const skipPlayingMedia = useCallback(() => {
		if (currentMessage) {
			handleMediaEnd({ message: currentMessage });
		}
	}, [handleMediaEnd, currentMessage]);

	const handleNewMessage = useCallback((message: IClientMessage) => {
		const media = message.donation?.media;
		if (media) {
			messagesRef.current = [...messagesRef.current, message];
		}
	}, []);

	const handleReplayMedia = useCallback(
		(message: IClientMessage) => {
			messagesRef.current = [message, ...messagesRef.current];

			if (!currentMessage) {
				playMedia({ message: message });
			}
		},
		[playMedia, currentMessage],
	);

	useWidgetSubscription<IClientMessage>(
		"widgets:messages.subscription",
		handleNewMessage,
	);

	useWidgetSubscription<IClientMessage>(
		"widgets:media:replay.subscription",
		handleReplayMedia,
	);

	const handleMediaSettings = useCallback((mediaSettings: IMediaSettings) => {
		mediaSettingsRef.current = mediaSettings;
	}, []);

	useWidgetSubscription<IMediaSettings>(
		"widgets:media:settings.subscription",
		handleMediaSettings,
	);
	useEffect(() => {
		bridge
			.action<void, IMediaSettings>("widgets:media:settings.read")
			.then(handleMediaSettings);
	}, []);

	const handleSettings = useCallback(
		(settings: ISettings) => {
			if (settingsRef.current?.alert_paused && !settings.alert_paused) {
				settingsRef.current = settings;
				const message = messagesRef.current.at(0);
				if (message) {
					playMedia({ message: message });
				}
				return;
			}
			settingsRef.current = settings;
		},
		[playMedia],
	);

	useWidgetSubscription<ISettings>(
		"widgets:settings.subscription",
		handleSettings,
	);

	useEffect(() => {
		bridge.action<void, ISettings>("widgets:settings.read").then((settings) => {
			settingsRef.current = settings;
		});
	}, []);

	useWidgetSubscription<string>("widgets:media:skip.subscription", skipMedia);

	useWidgetSubscription<null>(
		"widgets:media:skip-playing-media.subscription",
		skipPlayingMedia,
	);

	useWidgetSubscription<null>(
		"widgets:media:skip-playing-media.subscription",
		skipPlayingMedia,
	);

	useWidgetSubscription<string>("widgets:media:end.subscription", (id) => {
		const message = messagesRef.current.find((message) => message.id === id);
		handleMediaEnd({ message: message });
	});

	useWidgetSubscription<string>("widgets:media:error.subscription", (id) => {
		const message = messagesRef.current.find((message) => message.id === id);
		handleMediaEnd({ message: message });
	});
	useWidgetSubscription<string>("widgets:alert:played.subscription", (id) => {
		const message = messagesRef.current.find((message) => message.id === id);
		if (!currentMessage && message) {
			playMedia({ message: message });
		}
	});

	return {
		currentMessage,
		mediaSettings: mediaSettingsRef.current,
	};
};
export default usePlayMedia;
