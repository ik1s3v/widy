import { useParams, useSearchParams } from "react-router";
import { useGetWidgetByIdQuery } from "../../src-widget/api/widgetsApi";
import useInboundBridge from "../../src-widget/hooks/useInboundBridge";

const Widget = ({ type }: { type: "view" | "control" }) => {
	const { id } = useParams();
	const [urlParams] = useSearchParams();
	const { data } = useGetWidgetByIdQuery({ id });
	const iframeRef = useInboundBridge(data);

	return (
		<>
			{data && (
				<iframe
					ref={iframeRef}
					src={`http://localhost:12553/widgets/${data.id}/${type}/index.html?${urlParams.toString()}`}
					title="Widget"
					sandbox="allow-scripts"
					style={{
						width: "100%",
						height: "100dvh",
						border: "none",
						display: "block",
					}}
				/>
			)}
		</>
	);
};

export default Widget;
