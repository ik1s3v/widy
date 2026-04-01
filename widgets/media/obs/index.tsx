import { BridgeContext } from "@widy/react";
import { WidgetOutboundBridge } from "@widy/sdk";
import React from "react";
import ReactDOM from "react-dom/client";
import Media from "./components/Media";

const bridge = new WidgetOutboundBridge();

const rootEl = document.getElementById("root");
if (rootEl) {
	const root = ReactDOM.createRoot(rootEl);
	root.render(
		<React.StrictMode>
			<BridgeContext.Provider value={bridge}>
				<Media />
			</BridgeContext.Provider>
		</React.StrictMode>,
	);
}
