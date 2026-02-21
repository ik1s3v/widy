import { Route, Routes } from "react-router";
import { WidyNetwork } from "../../../shared/enums";
import AuthorizationView from "../AuthorizationView";
import CreateDonationAccount from "./components/CreateDonationAccount";

const Widy = () => {
	return (
		<AuthorizationView>
			<Routes>
				<Route
					path={`create-donation-account/${WidyNetwork.Sol}`}
					element={<CreateDonationAccount network={WidyNetwork.Sol} />}
				/>
				<Route
					path={`create-donation-account/${WidyNetwork.Ton}`}
					element={<CreateDonationAccount network={WidyNetwork.Ton} />}
				/>
			</Routes>
		</AuthorizationView>
	);
};
export default Widy;
