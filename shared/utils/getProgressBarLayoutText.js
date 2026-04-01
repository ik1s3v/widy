import { GoalProgressLayout } from "@widy/sdk";

const getProgressBarLayoutText = ({
	layout,
	currentAmount,
	amountRaise,
	currentAmountPercent,
	currency,
}) => {
	switch (layout) {
		case GoalProgressLayout.Percent:
			return `${currentAmountPercent}%`;
		case GoalProgressLayout.CurrentAmount:
			return `${currentAmount} ${currency !== null && currency !== void 0 ? currency : ""}`;
		case GoalProgressLayout.CurrentAmountPercent:
			return `${currentAmount} ${currency !== null && currency !== void 0 ? currency : ""} (${currentAmountPercent}%)`;
		case GoalProgressLayout.CurrentAmountRemainingAmount:
			return `${currentAmount}/${amountRaise} ${currency !== null && currency !== void 0 ? currency : ""}`;
		case GoalProgressLayout.CurrentAmountRemainingAmountPercent:
			return `${currentAmount}/${amountRaise} ${currency !== null && currency !== void 0 ? currency : ""} (${currentAmountPercent}%)`;
	}
};
export default getProgressBarLayoutText;
//# sourceMappingURL=getProgressBarLayoutText.js.map
