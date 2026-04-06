import SettingsIcon from "@mui/icons-material/Settings";
import {
	Card,
	IconButton,
	Menu,
	MenuItem,
	Switch,
	useTheme,
} from "@mui/material";
import type { SerializedError } from "@reduxjs/toolkit";
import type { AlertId, IAlert } from "@widy/sdk";
import { AlertSeverity, AppEvent } from "@widy/sdk";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import useAppEvents from "../../../../../../shared/hooks/useAppEvents";
import { showSnackBar } from "../../../../../../shared/slices/snackBarSlice";
import getColorByMessageType from "../../../../../../shared/utils/getColorByMessageType";
import {
	useDeleteAlertByIdMutation,
	useUpdateAlertSettingsMutation,
} from "../../../../../api/alertsApi";
import WarningDialog from "../../../../WarningDialog";

const AlertCard = ({ alert }: { alert: IAlert }) => {
	const [status, setStatus] = useState(alert.status);
	const [updateAlertSettings] = useUpdateAlertSettingsMutation();
	const [dialogOpen, setDialogOpen] = useState(false);
	const isDefault = alert.id === "default";
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};
	const eventsService = useAppEvents();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const theme = useTheme();
	const handleTestAlert = () => {
		eventsService.send<AlertId>({
			event: AppEvent.TestAlert,
			data: alert.id,
		});
	};
	const [deleteAlertById] = useDeleteAlertByIdMutation();
	const dispatch = useDispatch();

	return (
		<>
			<WarningDialog
				open={dialogOpen}
				setOpen={setDialogOpen}
				title={t("alert.delete")}
				warning={t("alert.sure_delete")}
				onClick={async () => {
					try {
						await deleteAlertById({ id: alert.id }).unwrap();
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
					setDialogOpen(true);
				}}
			/>
			<Card
				sx={{
					display: "flex",
					border: "1px solid",
					borderRadius: 3,
					borderColor: theme.palette.background.default,
					minWidth: 200,
					minHeight: "5.3rem",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						display: "flex",
						placeItems: "center",
						width: "3rem",
						background: getColorByMessageType(alert.type),
						minHeight: "100%",
					}}
				></div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
						paddingLeft: 10,
					}}
				>
					<span>{alert.name}</span>

					<div style={{ alignSelf: "center", justifySelf: "end" }}>
						{!isDefault && (
							<Switch
								checked={status}
								onChange={async (_, value) => {
									setStatus(value);
									await updateAlertSettings({
										alert: { ...alert, status: value },
									}).unwrap();
								}}
							></Switch>
						)}
						<IconButton onClick={handleClick}>
							<SettingsIcon />
						</IconButton>
						<Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
							<MenuItem
								onClick={() => {
									navigate(`/dashboard/alerts/${alert.id}`);
								}}
							>
								{t("alert.configure")}
							</MenuItem>
							<MenuItem onClick={handleTestAlert}>{t("alert.test")}</MenuItem>
							{!isDefault && (
								<MenuItem
									onClick={() => {
										setDialogOpen(true);
									}}
								>
									{t("alert.delete")}
								</MenuItem>
							)}
						</Menu>
					</div>
				</div>
			</Card>
		</>
	);
};
export default AlertCard;
