import { Button, TextField } from "@mui/material";
import type { SerializedError } from "@reduxjs/toolkit";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { AlertSeverity, ServiceType } from "../../../../shared/enums";
import { showSnackBar } from "../../../../shared/slices/snackBarSlice";
import { useDonationAlertsConnectMutation } from "../../../api/donationAlertsApi";
import {
	useGetServiceByIdQuery,
	useUpdateServiceAuthMutation,
} from "../../../api/servicesApi";

const Token = () => {
	const { t } = useTranslation();
	const { data } = useGetServiceByIdQuery({ id: ServiceType.DonationAlerts });
	const [updateServiceAuth] = useUpdateServiceAuthMutation();
	const [donationAlertsConnect] = useDonationAlertsConnectMutation();
	const [token, setToken] = useState("");
	const dispatch = useDispatch();
	const navigate = useNavigate();

	return (
		<>
			{data && (
				<>
					<TextField
						placeholder="Token"
						value={token}
						type="password"
						onChange={(e) => setToken(e.target.value)}
					/>
					<Button
						variant="contained"
						onClick={async () => {
							try {
								if (!token) {
									return;
								}
								await updateServiceAuth({
									id: ServiceType.DonationAlerts,
									auth: { token },
									authorized: false,
								}).unwrap();
								await donationAlertsConnect().unwrap();
								navigate(-1);
							} catch (error) {
								const err = error as SerializedError;
								dispatch(
									showSnackBar({
										message: err.message as string,
										alertSeverity: AlertSeverity.error,
									}),
								);
							}
						}}
					>
						{t("save")}
					</Button>
				</>
			)}
		</>
	);
};
export default Token;
