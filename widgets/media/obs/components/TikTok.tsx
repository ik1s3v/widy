import { useBridge, useWidgetSubscription } from "@widy/react";
import type { IMedia, IMediaPlatformSettings, MessageId } from "@widy/sdk";
import { useCallback, useEffect, useRef } from "react";

const TikTok = ({
	mediaPlatformSettings,
	media,
	messageId,
}: {
	mediaPlatformSettings: IMediaPlatformSettings;
	media: IMedia;
	messageId: string;
}) => {
	const bridge = useBridge();
	const tiktokRef = useRef<HTMLIFrameElement>(null);
	const tiktokListener = useCallback(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		(event: MessageEvent<any>) => {
			switch (event.data.type) {
				case "onStateChange":
					switch (event.data.value) {
						case 0:
							bridge.send<MessageId>("widgets:media:end.send", messageId);
							break;
						case 1:
							bridge.send<MessageId>("widgets:media:playing.send", messageId);
							break;
						case 2:
							bridge.send<MessageId>("widgets:media:paused.send", messageId);
							break;

						default:
							break;
					}

					break;
				case "onPlayerReady":
					tiktokRef.current?.contentWindow?.postMessage(
						{ type: "unMute", value: 0, "x-tiktok-player": true },
						"*",
					);
					tiktokRef.current?.contentWindow?.postMessage(
						{
							type: "changeVolume",
							value: mediaPlatformSettings.video_volume,
							"x-tiktok-player": true,
						},
						"*",
					);

					break;
				case "onError":
					bridge.send<MessageId>("widgets:media:error.send", messageId);
					break;

				default:
					break;
			}
		},
		[messageId, mediaPlatformSettings, bridge],
	);
	useEffect(() => {
		window.addEventListener("message", tiktokListener);

		return () => {
			window.removeEventListener("message", tiktokListener);
		};
	}, [tiktokListener]);

	useWidgetSubscription("widgets:media:pause.subscription", (id) => {
		if (messageId === id && tiktokRef.current) {
			tiktokRef.current?.contentWindow?.postMessage(
				{ type: "pause", value: null, "x-tiktok-player": true },
				"*",
			);
		}
	});
	useWidgetSubscription("widgets:media:play.subscription", (id) => {
		if (messageId === id && tiktokRef.current) {
			tiktokRef.current?.contentWindow?.postMessage(
				{ type: "play", value: null, "x-tiktok-player": true },
				"*",
			);
		}
	});

	return (
		<iframe
			ref={tiktokRef}
			height="100%"
			width="100%"
			src={`https://www.tiktok.com/player/v1/${media.temporary_src}?controls=0&progress_bar=0&play_button=0&volume_control=0&music_info=0&autoplay=1&timestamp=0&fullscreen_button=0&description=0&rel=0&native_context_menu=0&closed_caption=0`}
			allow="fullscreen"
			title="widget"
		/>
	);
};
export default TikTok;
