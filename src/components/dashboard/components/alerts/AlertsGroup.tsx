import { Card } from "@mui/material";
import type { IAlertsGroup } from "@widy/sdk";
import { useTranslation } from "react-i18next";
import AddNewAlertVariantButton from "./components/AddNewAlertVariantButton";
import AlertCard from "./components/AlertCard";
import WidgetUrl from "./components/WidgetUrl";

const AlertsGroup = ({ alertsGroup }: { alertsGroup: IAlertsGroup }) => {
	const widgetUrl = `http://localhost:12553/alert?group_id=${alertsGroup.group_id}`;
	const { t } = useTranslation();

	return (
		<Card
			sx={{
				padding: "20px",
				display: "grid",
				gap: "5px",
				position: "relative",
				marginBottom: "10px",
			}}
		>
			<h3>
				{t("alerts.group")} {alertsGroup.group_id.toUpperCase()}
			</h3>

			<WidgetUrl widgetUrl={widgetUrl} text={t("widget.url")} />
			<div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
				{alertsGroup.items.map((alert) => (
					<AlertCard alert={alert} key={alert.id} />
				))}
				<AddNewAlertVariantButton group_id={alertsGroup.group_id} />
			</div>
		</Card>
	);
};
export default AlertsGroup;
