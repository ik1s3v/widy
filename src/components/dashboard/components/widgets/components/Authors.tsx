import PersonIcon from "@mui/icons-material/Person";
import { Box, Typography } from "@mui/material";
import type { IManifest } from "@widy/sdk";

const Authors = ({ manifest }: { manifest: IManifest }) => {
	const authors = manifest.authors.join(",");
	return (
		<Box
			sx={{ display: "flex", gap: 1, marginTop: 1, placeItems: "flex-start" }}
		>
			<PersonIcon sx={{ fontSize: 19 }} />
			<Typography
				variant="body2"
				color="textSecondary"
				sx={{ marginBottom: "8px" }}
			>
				{authors}
			</Typography>
		</Box>
	);
};
export default Authors;
