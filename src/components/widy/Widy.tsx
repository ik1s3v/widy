import { Route, Routes } from "react-router";
import AuthorizationView from "../AuthorizationView";
import CreateDonationAccount from "./components/CreateDonationAccount";

const Widy = () => {
	return (
		<AuthorizationView>
			<Routes>
				<Route
					path="create-donation-account"
					element={<CreateDonationAccount />}
				/>
			</Routes>
		</AuthorizationView>
	);
};
export default Widy;
