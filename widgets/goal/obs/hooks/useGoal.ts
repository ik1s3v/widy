import { useBridge, useWidgetSubscription } from "@widy/react";
import { GoalType, type IGoal, type ISettings } from "@widy/sdk";
import { useEffect, useState } from "react";

const useGoal = () => {
	const bridge = useBridge();
	const [goal, setGoal] = useState<IGoal>();
	const urlParams = new URLSearchParams(window.location.search);
	const type = urlParams.get("type") as GoalType;
	const [settings, setSettings] = useState<ISettings>();

	useWidgetSubscription<IGoal>("widgets:goal.subscription", (g: IGoal) => {
		if (goal && goal.id === g.id) {
			setGoal(g);
		}
	});

	useWidgetSubscription<ISettings>(
		"widgets:settings.subscription",
		(settings) => {
			setSettings(settings);
		},
	);

	useEffect(() => {
		if (type) {
			bridge
				.action<{ type: string }, IGoal>("widgets:goals.read", {
					type,
				})
				.then(setGoal);
		}
	}, [type]);

	useEffect(() => {
		bridge.action<void, ISettings>("widgets:settings.read").then((settings) => {
			setSettings(settings);
		});
	}, []);

	return {
		goal,
		settings,
	};
};
export default useGoal;
