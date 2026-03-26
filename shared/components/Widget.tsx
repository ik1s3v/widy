import { useRef } from "react";

const Widget = () => {
	const widgetName = window.location.pathname.split("/")[2];
	const urlParams = new URLSearchParams(window.location.search);
	const iframeRef = useRef<HTMLIFrameElement>(null);

	return (
		<iframe
			ref={iframeRef}
			src={`/widgets/${widgetName}/obs/index.html?${urlParams.toString()}`}
			title="Widget"
			sandbox="allow-scripts"
			style={{
				width: "100%",
				height: "100%",
				border: "none",
				display: "block",
			}}
		/>
	);
};
export default Widget;
