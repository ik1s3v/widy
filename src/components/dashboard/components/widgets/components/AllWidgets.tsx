import { Box } from "@mui/material";
import type { IManifest } from "@widy/sdk";
import { useEffect, useState } from "react";
import { useGetWidgetsQuery } from "../../../../../api/widgetApi";
import WidgetCard from "./WidgetCard";

const AllWidgets = () => {
	const [widgets, setWidgets] = useState<Record<string, IManifest>>();
	const { data } = useGetWidgetsQuery();
	useEffect(() => {
		fetch(
			"https://raw.githubusercontent.com/widy-fun/widgets/refs/heads/master/widgets.json",
		)
			.then((res) => res.json())
			.then(setWidgets);
	}, []);

	return (
		<>
			{data && widgets && (
				<Box>
					{Object.entries(widgets).map(([id, manifest]) => (
						<WidgetCard
							key={id}
							manifest={manifest}
							installed={!!data.find((w) => w.manifest.id === id)}
						/>
					))}
				</Box>
			)}
		</>
	);
};
export default AllWidgets;
