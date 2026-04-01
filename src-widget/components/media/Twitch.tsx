import type { IMedia, IMediaPlatformSettings, MessageId } from "@widy/sdk";
import { AppEvent } from "@widy/sdk";
import { useEffect, useRef } from "react";
import useAppEvents from "../../../shared/hooks/useAppEvents";

const Twitch = ({
	mediaPlatformSettings,
	media,
	messageId,
}: {
	mediaPlatformSettings: IMediaPlatformSettings;
	media: IMedia;
	messageId: string;
}) => {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const eventsService = useAppEvents();

	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.volume = mediaPlatformSettings.video_volume / 100;
	}, [mediaPlatformSettings]);
	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.onplay = () => {
			eventsService.send<MessageId>({
				event: AppEvent.MediaPlaying,
				data: messageId,
			});
		};

		videoRef.current.onended = () => {
			eventsService.send<MessageId>({
				event: AppEvent.MediaEnd,
				data: messageId,
			});
		};
		videoRef.current.onpause = () => {
			eventsService.send<MessageId>({
				event: AppEvent.MediaPaused,
				data: messageId,
			});
		};
		videoRef.current.onerror = () => {
			eventsService.send<MessageId>({
				event: AppEvent.MediaError,
				data: messageId,
			});
		};

		return () => {
			if (!videoRef.current) return;
			videoRef.current.onplay = null;
			videoRef.current.onended = null;
			videoRef.current.onpause = null;
			videoRef.current.onerror = null;
		};
	}, [messageId, eventsService]);

	useEffect(() => {
		const unsubscribe = eventsService.subscribe<MessageId>(
			AppEvent.PauseMedia,
			(id) => {
				if (messageId === id && videoRef.current) {
					videoRef.current.pause();
				}
			},
		);

		return () => unsubscribe();
	}, [messageId, eventsService]);

	useEffect(() => {
		const unsubscribe = eventsService.subscribe<MessageId>(
			AppEvent.PlayMedia,
			(id) => {
				if (messageId === id && videoRef.current) {
					videoRef.current.play();
				}
			},
		);

		return () => unsubscribe();
	}, [messageId, eventsService]);

	return (
		<>
			{/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
			<video
				autoPlay
				ref={videoRef}
				src={media.temporary_src}
				style={{ height: "100%", width: "100%" }}
			/>
		</>
	);
};
export default Twitch;
