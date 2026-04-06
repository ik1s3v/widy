import AppsIcon from "@mui/icons-material/Apps";
import InstallDesktopIcon from "@mui/icons-material/InstallDesktop";
import { Box, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import TabPanel from "../../../TabPanel";
import AllWidgets from "./components/AllWidgets";
import InstalledWidgets from "./components/InstalledWidgets";

const Widgets = () => {
	const { t } = useTranslation();
	const [value, setValue] = useState(0);

	return (
		<>
			<h1>{t("widgets.title")}</h1>
			<Box
				sx={{
					borderBottom: 1,
					borderColor: "divider",
					background: "wh",
					display: "grid",
					placeContent: "center",
				}}
			>
				<Tabs
					value={value}
					variant="scrollable"
					allowScrollButtonsMobile
					onChange={(_, value) => setValue(value)}
					slotProps={{
						indicator: { style: { transition: "none" } },
					}}
				>
					<Tab
						icon={<InstallDesktopIcon />}
						iconPosition="start"
						label={t("widgets.installed")}
					/>
					<Tab
						icon={<AppsIcon />}
						iconPosition="start"
						label={t("widgets.all")}
					/>
				</Tabs>
			</Box>
			<div style={{ marginTop: 20 }}>
				<TabPanel index={0} value={value}>
					<InstalledWidgets />
				</TabPanel>
				<TabPanel index={1} value={value}>
					<AllWidgets />
				</TabPanel>
			</div>
		</>
	);
};
export default Widgets;
