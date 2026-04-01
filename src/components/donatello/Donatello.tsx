import { ServiceType } from "@widy/sdk";
import AuthorizationWithStreamElements from "../AuthorizationWithStreamElements";

const Donatello = () => {
	return (
		<AuthorizationWithStreamElements
			service={ServiceType.Donatello}
			url="https://donatello.to/panel/settings?tab=integrations"
		/>
	);
};
export default Donatello;
