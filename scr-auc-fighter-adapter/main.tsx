import type {
	IAucFighterMatch,
	IAucFighterMatchWinner,
	IAucFighterSettings,
	MatchId,
} from "@widy/sdk";
import { AppEvent } from "@widy/sdk";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { WebsocketEventsService } from "../shared/services/websocketEventsService";
import { fighterTimerSlice } from "../shared/slices/timerSlice";
import App from "./App";
import updatePlayersEnergybar from "./helpers/updatePlayersEnergybar";
import updatePlayersHealthbar from "./helpers/updatePlayersHealthbar";
import updateRoundWinnerIndex from "./helpers/updateRoundWinnerIndex";
import updateTeamsPlayers from "./helpers/updateTeamsPlayers";
import { type AppState, store } from "./store";
import {
	setAucFighterMatch,
	setAucFighterSettings,
	setIsGameStarted,
	setIsNewRoundStart,
	setIsShowAnnouncer,
	updateAucFighterMatch,
} from "./store/slices/mainSlice";
import type { HitDetails } from "./types/types";

const STAGES = [
	"ryu",
	"ken",
	"guy",
	"chunli",
	"dramatic_battle",
	"dramatic_battle",
	"mbison",
	"akuma",
	"sodom",
	"sagat",
] as const;

const eventsService = new WebsocketEventsService("ws://127.0.0.1:12553/ws");

eventsService.connect();

const { setTime, subtractTime, setCurrentIntervalId } =
	fighterTimerSlice.actions;

const originalHitSystemRegister = HitSystem.prototype.register;

HitSystem.prototype.register = function (details: HitDetails) {
	const match = game_.getMatch();
	if (!match) return;
	const state = store.getState() as AppState;
	const winnerIndex = state.mainState.winnerIndex;
	const teamAPlayer = match.getTeamA().getPlayers()[0];
	const teamBPlayer = match.getTeamB().getPlayers()[0];
	const winnerId = winnerIndex === 1 ? teamAPlayer.Id : teamBPlayer.Id;
	originalHitSystemRegister.call(this, details);

	if (state.fighterTimerState.time === 0 && details.PlayerID === winnerId) {
		if (winnerIndex === 0) {
			match.getTeamB().getHealthbar().change(1000);
		} else {
			match.getTeamA().getHealthbar().change(1000);
		}
	}
};

const setTimer = () => {
	const intervalId = setInterval(() => {
		store.dispatch(subtractTime(10));
	}, 10);
	store.dispatch(setCurrentIntervalId(intervalId));
};

const clearTimer = () => {
	const state = store.getState() as AppState;
	clearInterval(state.fighterTimerState.currentIntervalId);
};

$$init();

eventsService.subscribe<IAucFighterMatch>(
	AppEvent.StartAucFighterMatch,
	(match: IAucFighterMatch) => {
		store.dispatch(setIsShowAnnouncer(true));
		const teamA = match.teams[0];
		const teamB = match.teams[1];
		const randomStage =
			stages_[STAGES[Math.floor(Math.random() * STAGES.length)]];
		store.dispatch(setAucFighterMatch(match));
		game_.end();
		__noDamage = true;

		user1_.resetChar(teamA.character, false, true);
		user2_.resetChar(teamB.character, true, true);
		game_.startMatch(0, [0], [1], randomStage, () => {
			eventsService.send<MatchId>({
				event: AppEvent.AucFighterMatchPlaying,
				data: match.id,
			});
		});
	},
);

announcer_.onNewRoundAnnounced = () => {
	const state = store.getState() as AppState;
	const { match, aucFighterSettings } = state.mainState;
	if (match && aucFighterSettings) {
		updatePlayersHealthbar({ match });
		updateRoundWinnerIndex(match);
		clearTimer();
		store.dispatch(setIsGameStarted(true));
		store.dispatch(setTime(aucFighterSettings.round_duration));
		store.dispatch(setIsNewRoundStart(true));
		store.dispatch(setIsShowAnnouncer(false));
		setTimer();
	}
};

game_.onMatchEnd = () => {
	const state = store.getState() as AppState;
	const { winnerIndex, isGameStarted, match } = state.mainState;
	if (match && isGameStarted && winnerIndex !== null) {
		store.dispatch(setIsGameStarted(false));
		store.dispatch(setIsNewRoundStart(false));
		store.dispatch(setIsShowAnnouncer(false));
		eventsService.send<IAucFighterMatchWinner>({
			event: AppEvent.AucFighterMatchEnd,
			data: {
				matchId: match.id,
				winnerIndex: winnerIndex,
			},
		});
	}
};

eventsService.subscribe<string>(AppEvent.PauseAucFighterMatch, () => {
	const state = store.getState() as AppState;
	const { match } = state.mainState;
	game_.pause();
	clearTimer();
	if (match) {
		eventsService.send<MatchId>({
			event: AppEvent.AucFighterMatchPaused,
			data: match.id,
		});
	}
});

eventsService.subscribe<string>(AppEvent.ResumeAucFighterMatch, () => {
	game_.resume();
	setTimer();
});

eventsService.subscribe<string>(AppEvent.CancelAucFighterMatch, () => {
	store.dispatch(setIsGameStarted(false));
	store.dispatch(setIsNewRoundStart(false));
	store.dispatch(setIsShowAnnouncer(false));

	game_.end();
});

eventsService.subscribe<IAucFighterMatch>(
	AppEvent.UpdateAucFighterMatch,
	(match: IAucFighterMatch) => {
		const state = store.getState() as AppState;
		const { match: oldMatch, aucFighterSettings } = state.mainState;
		if (aucFighterSettings && oldMatch && oldMatch.id === match.id) {
			updatePlayersHealthbar({ match, oldMatch });
			updatePlayersEnergybar({ match, oldMatch });
			if (aucFighterSettings.is_add_players) {
				updateTeamsPlayers({ match, oldMatch });
			}
			updateRoundWinnerIndex(match);
			store.dispatch(updateAucFighterMatch(match));
		}
	},
);

eventsService.subscribe<IAucFighterSettings>(
	AppEvent.AucFighterSettings,
	(aucFighterSettings: IAucFighterSettings) => {
		store.dispatch(setAucFighterSettings(aucFighterSettings));
	},
);

document.addEventListener("keydown", (event) => {
	if (event.ctrlKey && event.key === "1") {
		event.preventDefault();
		game_.getMatch()?.getTeamA().getPlayer(0).Ai.release();
	}
});
document.addEventListener("keydown", (event) => {
	if (event.ctrlKey && event.key === "2") {
		event.preventDefault();
		game_.getMatch()?.getTeamA().getPlayer(0).enableAI();
	}
});

ReactDOM.createRoot(
	document.getElementById("auc-fighter-adapter") as HTMLElement,
).render(
	<StrictMode>
		<Provider store={store}>
			<App />
		</Provider>
	</StrictMode>,
);
