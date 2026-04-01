import AlertView from "../../../shared/components/AlertView";
import usePlayAlert from "./hooks/usePlayAlert";

const Alert = () => {
	const { currentAlert, currentMessage } = usePlayAlert();
	const BASE_URL = import.meta.env.PUBLIC_BASE_URL;

	return (
		currentMessage &&
		currentAlert && (
			<AlertView
				alert={currentAlert}
				message={currentMessage}
				width={window.innerWidth}
				height={window.innerHeight}
				imageSrc={`${BASE_URL}/static/${currentAlert.image}`}
			/>
		)
	);
};

export default Alert;
