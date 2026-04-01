import Widget from "../../shared/components/Widget";
import useInboundBridge from "../hooks/useInboundBridge";

const ObsWidget = () => {
	const iframeRef = useInboundBridge();

	return <Widget type="obs" ref={iframeRef} />;
};
export default ObsWidget;
