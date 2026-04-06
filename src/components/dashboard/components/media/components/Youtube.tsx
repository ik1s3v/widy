import type { IMediaSettings } from "@widy/sdk";
import { setYoutubeSettings } from "../../../../../../shared/slices/mediaSlice";
import MediaPlatformSettings from "./MediaPlatformSettings";

const Youtube = ({ mediaSettings }: { mediaSettings: IMediaSettings }) => {
	return (
		<MediaPlatformSettings
			mediaPlatformSettings={mediaSettings.youtube}
			setMediaPlatformSettings={setYoutubeSettings}
		/>
	);
};
export default Youtube;
