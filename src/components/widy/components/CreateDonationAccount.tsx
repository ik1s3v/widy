import { Button } from "@mui/material";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { AppEvent, ServiceType } from "../../../../shared/enums";
import useWebSocket from "../../../../shared/hooks/useWebSocket";
import {
	useGetServicesQuery,
	useGetServiceWithAuthByIdQuery,
} from "../../../api/servicesApi";
import { useGetWidySolNonceMutation } from "../../../api/widyApi";

const CreateDonationAccount = ({
	isNavigate = true,
}: {
	isNavigate?: boolean;
}) => {
	const { t } = useTranslation();
	const [isPending, setIsPending] = useState(false);
	const [getWidyNonce] = useGetWidySolNonceMutation();
	const websocketService = useWebSocket();
	const navigate = useNavigate();
	const { refetch } = useGetServicesQuery();
	const { refetch: refetchWidyService } = useGetServiceWithAuthByIdQuery({
		id: ServiceType.WidySol,
	});

	useEffect(() => {
		const unsubscribe = websocketService.subscribe<string>(
			AppEvent.CreateDonationAccount,
			async (_) => {
				await refetch().unwrap();
				await refetchWidyService().unwrap();
				if (isNavigate) {
					navigate(-1);
				}
			},
		);
		return () => unsubscribe();
	}, [websocketService, navigate, refetch, isNavigate, refetchWidyService]);
	return (
		<Button
			variant="contained"
			disabled={isPending}
			onClick={async () => {
				setIsPending(true);
				const nonce = await getWidyNonce().unwrap();
				openUrl(
					`${import.meta.env.VITE_WIDY_BASE_URL}/create-donation-account?nonce=${nonce}`,
				);
			}}
		>
			{isPending
				? t("widy.create_donation_account_pending")
				: t("widy.create_donation_account")}
		</Button>
	);
};
export default CreateDonationAccount;
