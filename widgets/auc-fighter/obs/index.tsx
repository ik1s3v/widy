import {
	type IAucFighterMatch,
	type IAucFighterMatchWinner,
	type IAucFighterSettings,
	type MatchId,
	WidgetOutboundBridge,
} from "@widy/sdk";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { fighterTimerSlice } from "../../../shared/slices/timerSlice";
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

const bridge = new WidgetOutboundBridge();

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

bridge
	.action<void, IAucFighterSettings>("widgets:auc-fighter:settings.read")
	.then((aucFighterSettings) => {
		store.dispatch(setAucFighterSettings(aucFighterSettings));
	});

bridge.subscribe<IAucFighterMatch>(
	"widgets:auc-fighter:start-match.subscription",
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
			bridge.send<MatchId>("widgets:auc-fighter:match-playing.send", match.id);
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
		bridge.send<IAucFighterMatchWinner>(
			"widgets:auc-fighter:match-winner.send",
			{
				matchId: match.id,
				winnerIndex: winnerIndex,
			},
		);
	}
};

bridge.subscribe<string>("widgets:auc-fighter:pause-match.subscription", () => {
	const state = store.getState() as AppState;
	const { match } = state.mainState;
	game_.pause();
	clearTimer();
	if (match) {
		bridge.send<MatchId>("widgets:auc-fighter:match-paused.send", match.id);
	}
});

bridge.subscribe<string>(
	"widgets:auc-fighter:resume-match.subscription",
	() => {
		game_.resume();
		setTimer();
	},
);

bridge.subscribe<string>(
	"widgets:auc-fighter:cancel-match.subscription",
	() => {
		store.dispatch(setIsGameStarted(false));
		store.dispatch(setIsNewRoundStart(false));
		store.dispatch(setIsShowAnnouncer(false));

		game_.end();
	},
);

bridge.subscribe<IAucFighterMatch>(
	"widgets:auc-fighter:update-match.subscription",
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

bridge.subscribe<IAucFighterSettings>(
	"widgets:auc-fighter:settings.subscription",
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
