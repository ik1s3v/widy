import DownloadIcon from "@mui/icons-material/Download";
import { Box, Button, Card } from "@mui/material";
import type { SerializedError } from "@reduxjs/toolkit";
import { AlertSeverity, type IManifest } from "@widy/sdk";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { showSnackBar } from "../../../../../../shared/slices/snackBarSlice";
import { useInstallWidgetMutation } from "../../../../../api/widgetApi";
import WarningDialog from "../../../../WarningDialog";
import ScopesWarning from "./ScopesWarning";
import WidgetDescription from "./WidgetDescription";

const WidgetCard = ({
	manifest,
	installed,
}: {
	manifest: IManifest;
	installed: boolean;
}) => {
	const { t } = useTranslation();
	const [installWidget, { isLoading }] = useInstallWidgetMutation();
	const dispatch = useDispatch();
	const [warningOpen, setWarningOpen] = useState(false);

	const handleInstall = async () => {
		setWarningOpen(false);
		try {
			await installWidget({ manifest }).unwrap();
			dispatch(
				showSnackBar({
					message: t("success"),
					alertSeverity: AlertSeverity.success,
				}),
			);
		} catch (error) {
			const err = error as SerializedError;
			dispatch(
				showSnackBar({
					message: err.message as string,
					alertSeverity: AlertSeverity.error,
				}),
			);
		}
	};

	return (
		<>
			<WarningDialog
				open={warningOpen}
				setOpen={setWarningOpen}
				title={t("widgets.install")}
				warning={<ScopesWarning manifest={manifest} />}
				onClick={handleInstall}
			/>
			<Card
				sx={{
					display: "flex",
					flexDirection: "column",
					marginBottom: "16px",
					padding: "16px",
					boxSizing: "border-box",
					minHeight: 150,
				}}
			>
				<WidgetDescription manifest={manifest} />

				<Box sx={{ display: "flex", gap: "8px", marginTop: "12px" }}>
					<Button
						disabled={installed || isLoading}
						variant="contained"
						size="small"
						startIcon={<DownloadIcon />}
						onClick={() => {
							setWarningOpen(true);
						}}
					>
						{isLoading ? t("widgets.installing") : t("widgets.install")}
					</Button>
				</Box>
			</Card>
		</>
	);
};
export default WidgetCard;
