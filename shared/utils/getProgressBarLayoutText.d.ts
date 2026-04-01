import { Currency, GoalProgressLayout } from "@widy/sdk";

declare const getProgressBarLayoutText: ({
	layout,
	currentAmount,
	amountRaise,
	currentAmountPercent,
	currency,
}: {
	layout: GoalProgressLayout;
	currentAmount: number;
	amountRaise: number;
	currentAmountPercent: number;
	currency?: Currency;
}) => string;
export default getProgressBarLayoutText;
//# sourceMappingURL=getProgressBarLayoutText.d.ts.map
