import { Button } from "@mui/material";
import { AppEvent } from "@widy/sdk";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { AutoSizer, List } from "react-virtualized";
import useAppEvents from "../../../../../../shared/hooks/useAppEvents";
import fighterGameFromLots from "../../../../../helpers/fighterGameFromLots";
import type { AppState } from "../../../../../store";
import {
	setAucFighterGame,
	setGameWinner,
	setIsGameStarted,
} from "../../../../../store/slices/aucFighterSlice";
import type { IAucFighterMatch, MatchId } from "../@widy/sdk";
import GameWinner from "./GameWinner";
import MatchCard from "./MatchCard";

const AucFighter = () => {
	const eventsService = useAppEvents();
	const { lots } = useSelector((state: AppState) => state.lotsState);
	const { game, pausedMatchId, playingMatchId, isGameStarted, gameWinner } =
		useSelector((state: AppState) => state.aucFighterState);

	const dispatch = useDispatch();
	const { t } = useTranslation();
	const lotsWithAmount = lots.filter((lot) => lot.amount);
	const playingMatchIndex = useMemo(() => {
		return game?.matches.findIndex((match) => match.id === playingMatchId);
	}, [game, playingMatchId]);

	return (
		<div
			style={{ display: "flex", placeItems: "center", flexDirection: "column" }}
		>
			<div>
				<Button
					disabled={isGameStarted || lotsWithAmount.length < 2}
					onClick={() => {
						const game = fighterGameFromLots(lotsWithAmount);
						dispatch(setAucFighterGame(game));
					}}
				>
					{t("fighter.create_game")}
				</Button>
				{game && !isGameStarted && (
					<Button
						onClick={() => {
							dispatch(setIsGameStarted(true));
							eventsService.send<IAucFighterMatch>({
								event: AppEvent.StartAucFighterMatch,
								data: game.matches[0],
							});
						}}
					>
						{t("fighter.start")}
					</Button>
				)}
				{isGameStarted && (
					<Button
						onClick={() => {
							eventsService.send<MatchId>({
								event: AppEvent.CancelAucFighterMatch,
								data: playingMatchId,
							});
							dispatch(setIsGameStarted(false));
							dispatch(setAucFighterGame(null));
							dispatch(setGameWinner(null));
						}}
					>
						{t("fighter.cancel")}
					</Button>
				)}
				<Button
					disabled={!isGameStarted}
					onClick={() => {
						eventsService.send<MatchId>({
							event: AppEvent.PauseAucFighterMatch,
							data: playingMatchId,
						});
					}}
				>
					{t("fighter.pause")}
				</Button>

				<Button
					disabled={!isGameStarted}
					onClick={() => {
						eventsService.send<MatchId>({
							event: AppEvent.ResumeAucFighterMatch,
							data: pausedMatchId,
						});
					}}
				>
					{t("fighter.resume")}
				</Button>
			</div>
			<GameWinner gameWinner={gameWinner} />
			{game && (
				<div
					style={{
						height: `calc(100vh - 345px)`,
						width: "620px",
					}}
				>
					<AutoSizer>
						{({ height, width }) => (
							<List
								width={width}
								height={height}
								rowCount={game.matches.length}
								rowHeight={152}
								scrollToIndex={playingMatchIndex}
								rowRenderer={({ key, index, style }) => {
									return (
										<div key={key} style={style}>
											<MatchCard
												match={game.matches[index]}
												matchNumber={index + 1}
												isAucFighterPlaying={
													game.matches[index].id === playingMatchId
												}
											/>
										</div>
									);
								}}
							/>
						)}
					</AutoSizer>
				</div>
			)}
		</div>
	);
};
export default AucFighter;
