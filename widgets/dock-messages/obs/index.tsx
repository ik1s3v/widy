import React from "react";
import ReactDOM from "react-dom/client";
import DockMessages from "./DockMessages";
import "../../../shared/i18n/i18n";
import { CssBaseline, createTheme, ThemeProvider } from "@mui/material";
import { BridgeContext } from "@widy/react";
import { WidgetOutboundBridge } from "@widy/sdk";
import { Provider } from "react-redux";
import { dark } from "../../../src/theme/default";
import { store } from "./store";

export const bridge = new WidgetOutboundBridge();

const rootEl = document.getElementById("root");
if (rootEl) {
	const root = ReactDOM.createRoot(rootEl);
	root.render(
		<React.StrictMode>
			<BridgeContext.Provider value={bridge}>
				<ThemeProvider theme={createTheme(dark)}>
					<Provider store={store}>
						<CssBaseline />
						<DockMessages />
					</Provider>
				</ThemeProvider>
			</BridgeContext.Provider>
		</React.StrictMode>,
	);
}
