import React from "react";
import ReactDOM from "react-dom/client";
import Alert from "./Alert";
import "../../../shared/i18n/i18n";
import { BridgeContext } from "@widy/react";
import { WidgetOutboundBridge } from "@widy/sdk";

const bridge = new WidgetOutboundBridge();
const rootEl = document.getElementById("root");
if (rootEl) {
	const root = ReactDOM.createRoot(rootEl);
	root.render(
		<React.StrictMode>
			<BridgeContext.Provider value={bridge}>
				<Alert />
			</BridgeContext.Provider>
		</React.StrictMode>,
	);
}
