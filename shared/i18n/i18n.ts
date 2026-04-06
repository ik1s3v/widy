import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "../translation/de.json";
import en from "../translation/en.json";
import es from "../translation/es.json";
import fr from "../translation/fr.json";
import hi from "../translation/hi.json";
import pt from "../translation/pt.json";
import ru from "../translation/ru.json";
import ua from "../translation/ua.json";
import zh from "../translation/zh.json";

i18n.use(initReactI18next).init({
	resources: {
		en: {
			translation: en,
		},
		ua: {
			translation: ua,
		},
		ru: {
			translation: ru,
		},
		de: {
			translation: de,
		},
		es: {
			translation: es,
		},
		fr: {
			translation: fr,
		},
		hi: {
			translation: hi,
		},
		pt: {
			translation: pt,
		},
		zh: {
			translation: zh,
		},
	},
	lng: "en",
	fallbackLng: "en",
	nsSeparator: false,
});
export default i18n;
