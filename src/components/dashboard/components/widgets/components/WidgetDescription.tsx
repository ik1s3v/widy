import GitHubIcon from "@mui/icons-material/GitHub";
import LogoDevIcon from "@mui/icons-material/LogoDev";
import { Box, CardContent, IconButton, Typography } from "@mui/material";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { IManifest } from "@widy/sdk";
import Authors from "./Authors";

const WidgetDescription = ({
	manifest,
	isDev = false,
}: {
	manifest: IManifest;
	isDev?: boolean;
}) => {
	return (
		<CardContent sx={{ padding: 0 }}>
			<Box>
				<Box>
					<Box sx={{ display: "flex", justifyContent: "space-between" }}>
						<Box sx={{ display: "flex", gap: 1 }}>
							<Typography
								variant="h6"
								component="div"
								sx={{ marginBottom: "8px" }}
							>
								{manifest.name} v{manifest.version}
							</Typography>
							{isDev && <LogoDevIcon />}
						</Box>
						<IconButton onClick={() => openUrl(manifest.repository)}>
							<GitHubIcon />
						</IconButton>
					</Box>
					<Typography
						variant="body2"
						color="textSecondary"
						sx={{ marginBottom: "8px" }}
					>
						{manifest.description}
					</Typography>
				</Box>
			</Box>
			<Authors manifest={manifest} />
		</CardContent>
	);
};
export default WidgetDescription;
