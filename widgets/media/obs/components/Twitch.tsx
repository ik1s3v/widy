import { useBridge, useWidgetSubscription } from "@widy/react";
import type { IMedia, IMediaPlatformSettings, MessageId } from "@widy/sdk";
import { useEffect, useRef } from "react";

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
	const bridge = useBridge();

	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.volume = mediaPlatformSettings.video_volume / 100;
	}, [mediaPlatformSettings]);
	useEffect(() => {
		if (!videoRef.current) return;
		videoRef.current.onplay = () => {
			bridge.send<MessageId>("widgets:media:playing.send", messageId);
		};

		videoRef.current.onended = () => {
			bridge.send<MessageId>("widgets:media:end.send", messageId);
		};
		videoRef.current.onpause = () => {
			bridge.send<MessageId>("widgets:media:paused.send", messageId);
		};
		videoRef.current.onerror = () => {
			bridge.send<MessageId>("widgets:media:error.send", messageId);
		};

		return () => {
			if (!videoRef.current) return;
			videoRef.current.onplay = null;
			videoRef.current.onended = null;
			videoRef.current.onpause = null;
			videoRef.current.onerror = null;
		};
	}, [messageId, bridge]);

	useWidgetSubscription("widgets:media:pause.subscription", (id) => {
		if (messageId === id && videoRef.current) {
			videoRef.current.pause();
		}
	});
	useWidgetSubscription("widgets:media:play.subscription", (id) => {
		if (messageId === id && videoRef.current) {
			videoRef.current.play();
		}
	});

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
