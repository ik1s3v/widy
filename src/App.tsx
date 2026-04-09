import { CircularProgress } from "@mui/material";
import { AlertSeverity } from "@widy/sdk";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Route, Routes, useNavigate } from "react-router";
import useAppEvents from "../shared/hooks/useAppEvents";
import { showSnackBar } from "../shared/slices/snackBarSlice";
import { useInitMutation } from "./api";
import { useGetSettingsQuery } from "./api/settingsApi";
import { AppSnackBar } from "./components/AppSnackBar";
import WidgetControl from "./components/dashboard/components/widgets/components/WidgetControl";
import Dashboard from "./components/dashboard/Dashboard";
import Donatello from "./components/donatello/Donatello";
import Donatik from "./components/donatik/Donatik";
import DonationAlerts from "./components/donationalerts/DonationAlerts";
import ServicesSettings from "./components/services/ServicesSettings";
import StreamElements from "./components/streamelements/StreamElements";
import StreamLabs from "./components/streamlabs/StreamLabs";
import TelegramAuthorization from "./components/telegram-authorization/TelegramAuthorization";
import Twitch from "./components/twitch/Twitch";
import UpdaterDialog from "./components/UpdaterDialog";
import Widy from "./components/widy/Widy";
import { setSettings } from "./store/slices/settingsSlice";

function App() {
	const eventsService = useAppEvents();
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { i18n } = useTranslation();
	const hasNavigated = useRef(false);

	const [
		init,
		{ error: initError, isSuccess: initIsSuccess, isLoading: initIsLoading },
	] = useInitMutation();

	const {
		data: settings,
		error: settingsError,
		isLoading: settingsIsLoading,
	} = useGetSettingsQuery(undefined, {
		skip: !initIsSuccess,
	});

	useEffect(() => {
		init();
	}, [init]);

	useEffect(() => {
		if (initIsSuccess) {
			eventsService.connect();
		}
	}, [initIsSuccess, eventsService]);

	useEffect(() => {
		if (settings) {
			i18n.changeLanguage(settings.language);
			dispatch(setSettings(settings));
		}
	}, [i18n, settings, dispatch]);

	useEffect(() => {
		if (settingsError) {
			dispatch(
				showSnackBar({
					message: settingsError.message as string,
					alertSeverity: AlertSeverity.error,
				}),
			);
		}
	}, [dispatch, settingsError]);

	useEffect(() => {
		if (initError) {
			dispatch(
				showSnackBar({
					message: initError.message as string,
					alertSeverity: AlertSeverity.error,
				}),
			);
		}
	}, [dispatch, initError]);

	useEffect(() => {
		if (!hasNavigated.current) {
			hasNavigated.current = true;
			navigate("/dashboard/messages");
		}
	}, [navigate]);

	return (
		<main style={{ display: "grid", height: "100dvh" }}>
			{settings && <UpdaterDialog />}
			<AppSnackBar />
			{settingsIsLoading || initIsLoading ? (
				<CircularProgress sx={{ placeSelf: "center" }} />
			) : (
				<Routes>
					<Route
						path="/telegram-authorization/*"
						element={<TelegramAuthorization />}
					/>
					<Route path="/streamelements/*" element={<StreamElements />} />
					<Route path="/streamlabs/*" element={<StreamLabs />} />
					<Route path="/twitch/*" element={<Twitch />} />
					<Route path="/widy/*" element={<Widy />} />
					<Route path="/donationalerts/*" element={<DonationAlerts />} />
					<Route path="/donatello/*" element={<Donatello />} />
					<Route path="/donatik/*" element={<Donatik />} />
					<Route path="/dashboard/*" element={<Dashboard />} />
					<Route path="/services-settings/*" element={<ServicesSettings />} />
					<Route path="/widget/:widgetId" element={<WidgetControl />} />
				</Routes>
			)}
		</main>
	);
}

export default App;
