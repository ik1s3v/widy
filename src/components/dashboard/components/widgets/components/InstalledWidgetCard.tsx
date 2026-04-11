import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Card, IconButton } from "@mui/material";
import type { IWidget } from "@widy/sdk";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useDeleteWidgetMutation } from "../../../../../api/widgetApi";
import WarningDialog from "../../../../WarningDialog";
import WidgetUrl from "../../alerts/components/WidgetUrl";
import WidgetDescription from "./WidgetDescription";

const InstalledWidgetCard = ({ widget }: { widget: IWidget }) => {
	const { t } = useTranslation();
	const [deleteWidget] = useDeleteWidgetMutation();
	const navigate = useNavigate();
	const [warningOpen, setWarningOpen] = useState(false);
	const widgetUrl = `http://localhost:12553/widget/${widget.id}`;

	const handleDelete = () => {
		deleteWidget({ widget }).unwrap();
		setWarningOpen(false);
	};

	return (
		<>
			<WarningDialog
				open={warningOpen}
				setOpen={setWarningOpen}
				title={t("widgets.delete")}
				warning={t("widgets.delete_confirm")}
				onClick={handleDelete}
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
				<WidgetDescription
					manifest={widget.manifest}
					isDev={!!widget.dev_path}
				/>
				<WidgetUrl widgetUrl={widgetUrl} text={t("widgets.view_url")} />
				<Box
					sx={{
						display: "flex",
						marginTop: "12px",
						justifyContent: "space-between",
					}}
				>
					<Button
						variant="contained"
						size="small"
						onClick={() => {
							navigate(`/widget/${widget.id}`);
						}}
					>
						{t("widgets.control")}
					</Button>
					<Box>
						<IconButton
							size="small"
							onClick={() => {
								setWarningOpen(true);
							}}
							color="error"
						>
							<DeleteIcon fontSize="small" />
						</IconButton>
					</Box>
				</Box>
			</Card>
		</>
	);
};
export default InstalledWidgetCard;
