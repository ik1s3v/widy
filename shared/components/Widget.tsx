import { forwardRef } from "react";

const Widget = forwardRef<HTMLIFrameElement | null, { type: "obs" | "app" }>(
	(props, ref) => {
		const widgetName = window.location.pathname.split("/")[2];
		const urlParams = new URLSearchParams(window.location.search);

		return (
			<iframe
				ref={ref}
				src={`/widgets/${widgetName}/${props.type}/index.html?${urlParams.toString()}`}
				title="Widget"
				sandbox="allow-scripts"
				style={{
					width: "100%",
					height: "100dvh",
					border: "none",
					display: "block",
				}}
			/>
		);
	},
);
export default Widget;
