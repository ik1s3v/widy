import { Box } from "@mui/material";
import InfiniteMessages from "../../../shared/components/InfiniteMessages";
import { useGetMessagesInfiniteQuery } from "./api";

const DockMessages = () => {
	return (
		<Box
			sx={{
				background: (theme) => theme.palette.background.default,
				padding: "5px",
				minHeight: "100vh",
			}}
		>
			<InfiniteMessages
				useGetMessagesInfiniteQuery={useGetMessagesInfiniteQuery}
			></InfiniteMessages>
		</Box>
	);
};
export default DockMessages;
