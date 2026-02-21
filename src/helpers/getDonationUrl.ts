import { WidyNetwork } from "../../shared/enums";

const getDonationUrl = ({
	network,
	donation_account_name,
}: {
	network: WidyNetwork;
	donation_account_name: string;
}) => {
	const url = import.meta.env.DEV
		? `http://${import.meta.env.VITE_WIDY_BASE_DOMAINE}/d/${donation_account_name}?network=${network}`
		: `https://${network}.${import.meta.env.VITE_WIDY_BASE_DOMAINE}/d/${donation_account_name}`;
	return url;
};
export default getDonationUrl;
