import { Box } from "@mui/material";
import { useGetWidgetsQuery } from "../../../../../api/widgetApi";
import AddWidget from "./AddWidget";
import InstalledWidgetCard from "./InstalledWidgetCard";

const InstalledWidgets = () => {
	const { data } = useGetWidgetsQuery();

	return (
		<Box sx={{ display: "grid", gap: 1 }}>
			<AddWidget />

			{data?.map((widget) => (
				<InstalledWidgetCard key={widget.id} widget={widget} />
			))}
		</Box>
	);
};
export default InstalledWidgets;
