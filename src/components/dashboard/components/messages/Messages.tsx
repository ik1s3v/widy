import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import InfiniteMessages from "../../../../../shared/components/InfiniteMessages";
import { ServiceType, WidyNetwork } from "../../../../../shared/enums";
import type { IWidyAuth } from "../../../../../shared/types";
import { useGetMessagesInfiniteQuery } from "../../../../api/messagesApi";
import { useGetServiceWithAuthByIdQuery } from "../../../../api/servicesApi";
import getDonationUrl from "../../../../helpers/getDonationUrl";
import type { AppState } from "../../../../store";
import CreateDonationAccount from "../../../widy/components/CreateDonationAccount";
import WidgetUrl from "../alerts/components/WidgetUrl";

const Messages = () => {
	const { t } = useTranslation();
	const { data: widySol } = useGetServiceWithAuthByIdQuery({
		id: ServiceType.WidySol,
	});
	const { data: widyTon } = useGetServiceWithAuthByIdQuery({
		id: ServiceType.WidyTon,
	});
	const { services } = useSelector((state: AppState) => state.servicesState);

	return (
		<>
			<h1>{t("messages.title")}</h1>
			<WidgetUrl
				widgetUrl={"http://localhost:12553/obs-dock-messages"}
				text={t("widget.obs_dock_url")}
			/>
			<div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
				<div>
					{widySol?.auth ? (
						<WidgetUrl
							widgetUrl={getDonationUrl({
								network: WidyNetwork.Sol,
								donation_account_name: (widySol.auth as IWidyAuth)
									.donation_account_name,
							})}
							text={t("widy.donation_url")}
						/>
					) : (
						<CreateDonationAccount
							sx={{ backgroundColor: services.WidySol.color }}
							isNavigate={false}
							network={WidyNetwork.Sol}
						/>
					)}
				</div>

				<div>
					{widyTon?.auth ? (
						<WidgetUrl
							widgetUrl={getDonationUrl({
								network: WidyNetwork.Sol,
								donation_account_name: (widyTon.auth as IWidyAuth)
									.donation_account_name,
							})}
							text={t("widy.donation_url")}
						/>
					) : (
						<CreateDonationAccount
							sx={{ backgroundColor: services.WidySol.color }}
							isNavigate={false}
							network={WidyNetwork.Sol}
						/>
					)}
				</div>
			</div>

			<div>{t("skip_alert")} - ctrl+F1</div>
			<div>{t("skip_media")} - ctrl+F2</div>

			<InfiniteMessages
				useGetMessagesInfiniteQuery={useGetMessagesInfiniteQuery}
			></InfiniteMessages>
		</>
	);
};
export default Messages;
