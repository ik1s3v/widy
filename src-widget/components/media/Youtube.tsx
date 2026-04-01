import type { IMedia, IMediaPlatformSettings, MessageId } from "@widy/sdk";
import { AppEvent } from "@widy/sdk";
import { useEffect, useState } from "react";
import YouTube, { type YouTubePlayer } from "react-youtube";
import useAppEvents from "../../../shared/hooks/useAppEvents";

const Youtube = ({
	mediaPlatformSettings,
	media,
	messageId,
}: {
	mediaPlatformSettings: IMediaPlatformSettings;
	media: IMedia;
	messageId: string;
}) => {
	const eventsService = useAppEvents();
	const [player, setPlayer] = useState<YouTubePlayer>();
	const opts = {
		height: window.innerHeight,
		width: window.innerWidth,
		playerVars: {
			// https://developers.google.com/youtube/player_parameters
			autoplay: 1,
			controls: 0,
		},
	};

	const onReady = (event: YouTubePlayer) => {
		eventsService.send<MessageId>({
			event: AppEvent.MediaPlaying,
			data: messageId,
		});
		event.target.setVolume(mediaPlatformSettings.video_volume);
		setPlayer(event.target);
	};
	const onError = () => {
		eventsService.send<MessageId>({
			event: AppEvent.MediaError,
			data: messageId,
		});
	};
	const onPlay = () => {
		eventsService.send<MessageId>({
			event: AppEvent.MediaPlaying,
			data: messageId,
		});
	};
	const onPause = () => {
		eventsService.send<MessageId>({
			event: AppEvent.MediaPaused,
			data: messageId,
		});
	};
	const onEnd = () => {
		eventsService.send<MessageId>({
			event: AppEvent.MediaEnd,
			data: messageId,
		});
	};

	useEffect(() => {
		const unsubscribe = eventsService.subscribe<MessageId>(
			AppEvent.PauseMedia,
			(id) => {
				if (messageId === id) {
					player.pauseVideo();
				}
			},
		);

		return () => unsubscribe();
	}, [messageId, player, eventsService]);

	useEffect(() => {
		const unsubscribe = eventsService.subscribe<MessageId>(
			AppEvent.PlayMedia,
			(id) => {
				if (messageId === id) {
					player.playVideo();
				}
			},
		);

		return () => unsubscribe();
	}, [messageId, player, eventsService]);

	return (
		<YouTube
			videoId={media?.temporary_src}
			opts={opts}
			onError={onError}
			onReady={onReady}
			onPlay={onPlay}
			onPause={onPause}
			onEnd={onEnd}
		/>
	);
};
export default Youtube;
