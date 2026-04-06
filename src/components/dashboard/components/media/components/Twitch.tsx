import type { IMediaSettings } from "@widy/sdk";
import { setTwitchSettings } from "../../../../../../shared/slices/mediaSlice";
import MediaPlatformSettings from "./MediaPlatformSettings";

const Twitch = ({ mediaSettings }: { mediaSettings: IMediaSettings }) => {
	return (
		<MediaPlatformSettings
			mediaPlatformSettings={mediaSettings.twitch}
			setMediaPlatformSettings={setTwitchSettings}
		/>
	);
};
export default Twitch;
