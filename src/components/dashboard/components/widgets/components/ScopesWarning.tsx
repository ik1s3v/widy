import WarningIcon from "@mui/icons-material/Warning";
import { Box } from "@mui/material";
import type { IManifest } from "@widy/sdk";
import { useTranslation } from "react-i18next";

const ScopesWarning = ({ manifest }: { manifest: IManifest }) => {
	const { t } = useTranslation();

	return (
		<Box>
			{t("widgets.add_confirm", { widget_name: manifest.name })}
			{manifest.scopes.map((scope) => (
				<Box
					key={scope}
					sx={(theme) => ({
						display: "flex",
						alignItems: "center",
						color: theme.palette.warning.main,
						fontSize: 14,
						gap: 0.5,
					})}
				>
					<WarningIcon sx={{ fontSize: 14 }} />
					{t(`scopes.${scope}`)}
				</Box>
			))}
		</Box>
	);
};
export default ScopesWarning;
