import { useTranslation } from "react-i18next";
import InfiniteMessages from "../../../../../shared/components/InfiniteMessages";
import { ServiceType, WidyNetwork } from "../../../../../shared/enums";
import type { IWidySolAuth } from "../../../../../shared/types";
import { useGetMessagesInfiniteQuery } from "../../../../api/messagesApi";
import { useGetServiceWithAuthByIdQuery } from "../../../../api/servicesApi";
import getDonationUrl from "../../../../helpers/getDonationUrl";
import CreateDonationAccount from "../../../widy/components/CreateDonationAccount";
import WidgetUrl from "../alerts/components/WidgetUrl";

const Messages = () => {
	const { t } = useTranslation();
	const { data } = useGetServiceWithAuthByIdQuery({ id: ServiceType.WidySol });
	const auth = data?.auth as IWidySolAuth;

	return (
		<>
			<h1>{t("messages.title")}</h1>
			<WidgetUrl
				widgetUrl={"http://localhost:12553/obs-dock-messages"}
				text={t("widget.obs_dock_url")}
			/>
			{data?.authorized && auth ? (
				<WidgetUrl
					widgetUrl={getDonationUrl({
						network: WidyNetwork.Sol,
						donation_account_name: auth.donation_account_name,
					})}
					text={t("widy.donation_url")}
				/>
			) : (
				<CreateDonationAccount isNavigate={false} network={WidyNetwork.Sol} />
			)}

			<div>{t("skip_alert")} - ctrl+F1</div>
			<div>{t("skip_media")} - ctrl+F2</div>

			<InfiniteMessages
				useGetMessagesInfiniteQuery={useGetMessagesInfiniteQuery}
			></InfiniteMessages>
		</>
	);
};
export default Messages;
