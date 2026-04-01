import type { IMedia, IMediaSettings } from "@widy/sdk";
import { MediaType } from "@widy/sdk";
import TikTok from "../components/TikTok";
import Twitch from "../components/Twitch";
import Youtube from "../components/Youtube";

const getElementByMediaType = ({
	messageId,
	mediaSettings,
	media,
}: {
	messageId: string;
	mediaSettings: IMediaSettings;
	media: IMedia;
}) => {
	switch (media.media_type) {
		case MediaType.Twitch:
			return (
				<Twitch
					media={media}
					messageId={messageId}
					mediaPlatformSettings={mediaSettings.twitch}
				/>
			);
		case MediaType.Youtube:
			return (
				<Youtube
					media={media}
					messageId={messageId}
					mediaPlatformSettings={mediaSettings.youtube}
				/>
			);
		case MediaType.TikTok:
			return (
				<TikTok
					media={media}
					messageId={messageId}
					mediaPlatformSettings={mediaSettings.tiktok}
				/>
			);
	}
};
export default getElementByMediaType;
