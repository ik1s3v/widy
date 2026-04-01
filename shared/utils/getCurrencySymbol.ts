import { Currency } from "@widy/sdk";

const getCurrencySymbol = (currency: Currency) => {
	switch (currency) {
		case Currency.UAH:
			return "₴";
		case Currency.EUR:
			return "€";
		case Currency.RUB:
			return "₽";
		case Currency.USD:
			return "$";
		case Currency.NONE:
			return "";
	}
};
export default getCurrencySymbol;
