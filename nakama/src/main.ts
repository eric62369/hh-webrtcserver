// https://heroiclabs.com/docs/nakama/guides/concepts/lobby/

const tickRate = 10;
const maxEmptyTicks = tickRate * 10;// tickRate * seconds

enum MatchOpCode {
	WEBRTC_PEER_METHOD = 9001,
	JOIN_SUCCESS = 9002,
	JOIN_ERROR = 9003,
	CHALLENGE = 9004,
	CHALLENGE_ACCEPT = 9005,
	SEND_GAME_ID = 9006,
	SPECTATE_REQUEST = 9007,
	SPECTATE_SEND_GAME_ID = 9008,
	SPECTATE_DISCONNECT_REQUEST = 9009,
	SPECTATE_REQUEST_ACCEPT = 9010,
	CHALLENGE_DISCONNECT = 9011,
	STATUS_UPDATE = 9012,
}

// const READY_OP_CODE = 1;
// const GAME_STARTING_OP_CODE = 2;


interface LobbyMatchState extends nkruntime.MatchState {
    players: { [userId: string]: PlayerState },
    playerCount: number,
    requiredPlayerCount: number,
    isPrivate: boolean,
    battleEngineVersion: string,
    nextPeerId: number
    // gameState: GameState,
    emptyTicks: number
  }
  
  interface PlayerState {
    presence: nkruntime.Presence,
    session_id: string,
    username: string,
    peer_id: number,
    isReady: boolean,
  }
  
// enum GameState { WaitingForPlayers, WaitingForPlayersReady, InProgress }


let InitModule: nkruntime.InitModule =
        function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    // This happens inside the InitModule function
  initializer.registerMatch("LobbyMatch", {
    matchInit: MatchInit,
    matchJoinAttempt: MatchJoinAttempt,
    matchJoin: MatchJoin,
    matchLeave: MatchLeave,
    matchLoop: MatchLoop,
    matchSignal: MatchSignal,
    matchTerminate: MatchTerminate
  });

  // This happens inside the InitModule function
  initializer.registerMatchmakerMatched(OnRegisterMatchmakerMatched);

  // This happens inside the InitModule function
  initializer.registerRpc("create-match", CreateMatchRpc);
  initializer.registerRpc("healthcheck", rpcHealthCheck);
  logger.info('Javascript module loaded');
}

const OnRegisterMatchmakerMatched: nkruntime.MatchmakerMatchedFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, matches: nkruntime.MatchmakerResult[]) {
  // Create a public match and return it's match ID
  var matchId = nk.matchCreate("LobbyMatch", { isPrivate: false });
  logger.debug(`Created LobbyMatch with ID: ${matchId}`);

  return matchId;
};

const CreateMatchRpc: nkruntime.RpcFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
  // Assume the match will be public by default
  let isPrivate = false;
  let battleEngineVersion = "???";

  // Get the isPrivate value from the payload if it exists
  if (payload) {
    const data = JSON.parse(payload);
    if (data.isPrivate) {
      isPrivate = data.isPrivate;
    }
    if (data.battleEngineVersion) {
      battleEngineVersion = data.battleEngineVersion;
    }
  }
  
  // Create the match and return the match ID to the player
  const matchId = nk.matchCreate("LobbyMatch", { isPrivate, battleEngineVersion });
  return JSON.stringify({ matchId });
};


const MatchInit: nkruntime.MatchInitFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, params: {[key: string]: string}) {
  // Determine if the match should be private based on the passed in params
  const isPrivate = params.isPrivate === "true";
  const battleEngineVersion = params.battleEngineVersion;

  // Define the match state
  const state: LobbyMatchState= {
    players: {},
    isPrivate,
    battleEngineVersion,
    playerCount: 0,
    requiredPlayerCount: 250,
    nextPeerId: 2,
    // gameState: GameState.WaitingForPlayers,
    emptyTicks: 0
  };

  // Update the match label to surface important information for players who are searching for a match
  const label = JSON.stringify({ isPrivate: state.isPrivate.toString(), battleEngineVersion: state.battleEngineVersion, playerCount: state.playerCount, requiredPlayerCount: state.requiredPlayerCount });

  return {
      state,
      tickRate,
      label
  };
};
  

const MatchJoinAttempt: nkruntime.MatchJoinAttemptFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presence: nkruntime.Presence, metadata: {[key: string]: any }) {
  // Accept new players unless the required amount has been fulfilled
  let accept = true;
  if (Object.keys(state.players).length >= state.requiredPlayerCount) {
    accept = false;
  } else if ("battleEngineVersion" in metadata) {
    if (state.battleEngineVersion !== metadata["battleEngineVersion"]){
      accept = false;
    }
  }
  
  // Reserve the spot in the match
  state.players[presence.sessionId] = { presence: null, isReady: false };
  
  return {
      state,
      accept
  };
};

const MatchJoin: nkruntime.MatchJoinFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) {
  // Populate the presence property for each player
  presences.forEach(function (presence) {
    state.players[presence.sessionId].presence = presence;
    state.players[presence.sessionId].peer_id = state.nextPeerId;
    state.players[presence.sessionId].username = presence.username;
    state.players[presence.sessionId].session_id = presence.sessionId;
    state.playerCount++;
    state.nextPeerId++;
  });
  
  // If the match is full then update the state
  // if (state.playerCount === state.requiredPlayerCount) {
  //   state.gameState = GameState.WaitingForPlayersReady;
  // }

  // Update the match label
  const label = JSON.stringify({ isPrivate: state.isPrivate.toString(), battleEngineVersion: state.battleEngineVersion, playerCount: state.playerCount, requiredPlayerCount: state.requiredPlayerCount });
  dispatcher.matchLabelUpdate(label);

  // For each "ready" player, let the joining players know about their status
  Object.keys(state.players).forEach(function (key) {
    const player = state.players[key];
    dispatcher.broadcastMessage(MatchOpCode.JOIN_SUCCESS, JSON.stringify({ client_version: state.battleEngineVersion, players: state.players }));
  });

  return {
      state
  };
};

const MatchLeave: nkruntime.MatchLeaveFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, presences: nkruntime.Presence[]) {
  // Remove the player from match state
  presences.forEach(function (presence) {
    delete(state.players[presence.sessionId]);
    state.playerCount--;
  });

  return {
      state
  };
};


const MatchLoop: nkruntime.MatchLoopFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, messages: nkruntime.MatchMessage[]) {
  messages.forEach(function (message) {
    // If the message is a Ready message, update the player's isReady status and broadcast it to other players
    // if (message.opCode === READY_OP_CODE) {
    //   state.players[message.sender.userId].isReady = true;
    //   dispatcher.broadcastMessage(READY_OP_CODE, JSON.stringify({ userId: message.sender.userId }));
  
    //   // Check to see if all players are now ready
    //   var allReady = true;
    //   Object.keys(state.players).forEach(function (userId) {
    //     if (!state.players[userId].isReady) {
    //       allReady = false;
    //     }
    //   });
  
    //   // If all players are ready, transition to InProgress state and broadcast the game starting event
    //   if (allReady && Object.keys(state.players).length === state.requiredPlayerCount) {
    //     state.gameState = GameState.InProgress;
    //     dispatcher.broadcastMessage(GAME_STARTING_OP_CODE);
    //   }
    // }
    // logger.info("------------------------------------------")
    
    // logger.info(nk.binaryToString(message.data))
    
    let message_deserial = JSON.parse(nk.binaryToString(message.data))
    // logger.info(message_deserial.toString())
    dispatcher.broadcastMessage(message.opCode, JSON.stringify(message_deserial));
  });

  // If the match is empty, increment the empty ticks
  if (state.playerCount === 0) {
    state.emptyTicks++;
  } else {
    state.emptyTicks = 0;
  }

  // If the match has been empty for too long, end it
  if (state.emptyTicks >= maxEmptyTicks) {
    return null;
  }

  return {
      state
  };
};

const MatchTerminate: nkruntime.MatchTerminateFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, graceSeconds: number) {
  return {
      state
  };
};

const MatchSignal: nkruntime.MatchSignalFunction = function (ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, dispatcher: nkruntime.MatchDispatcher, tick: number, state: nkruntime.MatchState, data: string) {
  return {
      state,
      data
  };
};
