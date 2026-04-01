import { useBridge, useWidgetSubscription } from "@widy/react";
import type { IMedia, IMediaPlatformSettings, MessageId } from "@widy/sdk";
import { useState } from "react";
import YouTube, { type YouTubePlayer } from "react-youtube";

const Youtube = ({
	mediaPlatformSettings,
	media,
	messageId,
}: {
	mediaPlatformSettings: IMediaPlatformSettings;
	media: IMedia;
	messageId: string;
}) => {
	const bridge = useBridge();
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
		bridge.send<MessageId>("widgets:media:playing.send", messageId);
		event.target.setVolume(mediaPlatformSettings.video_volume);
		setPlayer(event.target);
	};
	const onError = () => {
		bridge.send<MessageId>("widgets:media:error.send", messageId);
	};
	const onPlay = () => {
		bridge.send<MessageId>("widgets:media:playing.send", messageId);
	};
	const onPause = () => {
		bridge.send<MessageId>("widgets:media:paused.send", messageId);
	};
	const onEnd = () => {
		bridge.send<MessageId>("widgets:media:end.send", messageId);
	};

	useWidgetSubscription("widgets:media:pause.subscription", (id) => {
		if (messageId === id) {
			player.pauseVideo();
		}
	});

	useWidgetSubscription("widgets:media:play.subscription", (id) => {
		if (messageId === id) {
			player.playVideo();
		}
	});

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
