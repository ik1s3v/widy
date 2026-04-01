import { Button, TextField } from "@mui/material";
import type { SerializedError } from "@reduxjs/toolkit";
import { AlertSeverity, ServiceType } from "@widy/sdk";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";
import { showSnackBar } from "../../../../shared/slices/snackBarSlice";
import {
	useGetServiceByIdQuery,
	useUpdateServiceAuthMutation,
} from "../../../api/servicesApi";
import { useStreamLabsConnectMutation } from "../../../api/streamLabsApi";

const Token = () => {
	const { t } = useTranslation();
	const { data } = useGetServiceByIdQuery({ id: ServiceType.StreamLabs });
	const [updateServiceAuth] = useUpdateServiceAuthMutation();
	const [streamLabsConnect] = useStreamLabsConnectMutation();
	const [jwt, setJwt] = useState("");
	const dispatch = useDispatch();
	const navigate = useNavigate();

	return (
		<>
			{data && (
				<>
					<TextField
						placeholder="JWT"
						value={jwt}
						type="password"
						onChange={(e) => setJwt(e.target.value)}
					/>
					<Button
						variant="contained"
						onClick={async () => {
							try {
								if (!jwt) {
									return;
								}
								await updateServiceAuth({
									id: ServiceType.StreamLabs,
									auth: { jwt },
									authorized: false,
								}).unwrap();
								await streamLabsConnect().unwrap();
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
