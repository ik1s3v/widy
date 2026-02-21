import { WidyNetwork } from "../../shared/enums";

const getCreateDonationAccountUrl = ({
	network,
	nonce,
}: {
	network: WidyNetwork;
	nonce: string;
}) => {
	const url = import.meta.env.DEV
		? `http://${import.meta.env.VITE_WIDY_BASE_DOMAINE}/create-donation-account?nonce=${nonce}&network=${network}`
		: `https://${network}.${import.meta.env.VITE_WIDY_BASE_DOMAINE}/create-donation-account?nonce=${nonce}`;
	return url;
};
export default getCreateDonationAccountUrl;
