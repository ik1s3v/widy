import { Button, type SxProps, type Theme } from "@mui/material";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AppEvent, ServiceType, WidyNetwork } from "../../../../shared/enums";
import useWebSocket from "../../../../shared/hooks/useWebSocket";
import type { IDeepLinkQueryParams } from "../../../../shared/types";
import {
	useGetServicesQuery,
	useGetServiceWithAuthByIdQuery,
} from "../../../api/servicesApi";
import { useGetWidyNonceMutation } from "../../../api/widyApi";
import getCreateDonationAccountUrl from "../../../helpers/getCreateDonationAccountUrl";

const CreateDonationAccount = ({
	isNavigate = true,
	network,
	sx,
}: {
	isNavigate?: boolean;
	network: WidyNetwork;
	sx?: SxProps<Theme>;
}) => {
	const { t } = useTranslation();
	const [isPending, setIsPending] = useState(false);
	const [getWidyNonce] = useGetWidyNonceMutation();
	const websocketService = useWebSocket();
	const navigate = useNavigate();
	const { refetch } = useGetServicesQuery();
	const { refetch: refetchWidySolService } = useGetServiceWithAuthByIdQuery({
		id: ServiceType.WidySol,
	});
	const { refetch: refetchWidyTonService } = useGetServiceWithAuthByIdQuery({
		id: ServiceType.WidyTon,
	});

	useEffect(() => {
		const unsubscribe = websocketService.subscribe<IDeepLinkQueryParams>(
			AppEvent.CreateDonationAccount,
			async (params) => {
				await refetch().unwrap();
				switch (params.network) {
					case WidyNetwork.Sol:
						await refetchWidySolService().unwrap();
						break;
					case WidyNetwork.Ton:
						await refetchWidyTonService().unwrap();
						break;
				}
				if (isNavigate) {
					navigate(-1);
				}
			},
		);
		return () => unsubscribe();
	}, [
		websocketService,
		navigate,
		refetch,
		isNavigate,
		refetchWidySolService,
		refetchWidyTonService,
	]);
	return (
		<Button
			sx={sx}
			variant="contained"
			disabled={isPending}
			onClick={async () => {
				setIsPending(true);
				const nonce = await getWidyNonce({ network }).unwrap();
				openUrl(getCreateDonationAccountUrl({ nonce, network }));
			}}
		>
			{isPending
				? t("widy.create_donation_account_pending")
				: t("widy.create_donation_account")}
		</Button>
	);
};
export default CreateDonationAccount;
