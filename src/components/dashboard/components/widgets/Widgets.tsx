import { Button } from "@mui/material";
import { open } from "@tauri-apps/plugin-dialog";
import { readFile } from "@tauri-apps/plugin-fs";
import { useUploadWidgetMutation } from "../../../../api/widgetApi";

const Widgets = () => {
	const [uploadWidget] = useUploadWidgetMutation();

	return (
		<Button
			onClick={() => {
				open({
					multiple: false,
					directory: true,
				}).then((path) => {
					if (!path) return;
					readFile(`${path}/manifest.json`).then((data) => {
						const manifest = JSON.parse(new TextDecoder().decode(data));
						uploadWidget({ devPath: path, manifest }).unwrap();
					});
				});
			}}
		>
			Widget folder
		</Button>
	);
};
export default Widgets;
