import { Box, Button } from "@mui/material";
import { ServiceType } from "@widy/sdk";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { useGetServiceByIdQuery } from "../api/servicesApi";
import type { AppState } from "../store";
import NavigateBackButton from "./NavigateBackButton";
import YouCanFindByUrl from "./YouCanFindByUrl";

const AuthorizationWithStreamElements = ({
	service,
	url,
}: {
	service: ServiceType;
	url: string;
}) => {
	const { t } = useTranslation();
	const { data } = useGetServiceByIdQuery({ id: ServiceType.Streamelements });
	const { services } = useSelector((state: AppState) => state.servicesState);
	const navigate = useNavigate();

	return (
		<>
			<NavigateBackButton />
			<Box
				sx={{
					display: "grid",
					placeItems: "center",
					textAlign: "center",
					padding: "20px",
				}}
			>
				{!data?.authorized ? (
					<Box>
						<h2>{t("authorization.streamelements")}</h2>
						<Button
							variant="contained"
							onClick={() => {
								navigate(services[ServiceType.Streamelements].authPath);
							}}
						>
							{t("services.connect")}
						</Button>
					</Box>
				) : (
					<Box>
						<h2>{t("authorization.set_id_and_jwt", { service })}</h2>
						<h2>{url}</h2>
						<YouCanFindByUrl url="https://streamelements.com/dashboard/account/channels" />
					</Box>
				)}
			</Box>
		</>
	);
};
export default AuthorizationWithStreamElements;
