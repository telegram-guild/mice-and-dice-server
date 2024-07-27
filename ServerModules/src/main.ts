const dummyUserTelegramId = "52953379";
const dummyUserTelegramUsername = "smhmayboudi";
const globalLeaderboard = "leaderboard_global";
const leaderboardIds = [globalLeaderboard];

const InitModule: nkruntime.InitModule = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
) {
  // Add at least one user to the system.
  nk.authenticateCustom(dummyUserTelegramId, dummyUserTelegramUsername, true);
  // Set up leaderboards.
  const authoritative = false;
  const metadata = {};
  const scoreOperator = nkruntime.Operator.INCREMENTAL;
  const sortOrder = nkruntime.SortOrder.DESCENDING;
  const resetSchedule = null;
  leaderboardIds.forEach((id) => {
    nk.leaderboardCreate(
      id,
      authoritative,
      sortOrder,
      scoreOperator,
      resetSchedule,
      metadata
    );
    logger.info("leaderboard %q created", id);
  });
  // Set up hooks.
  initializer.registerAfterAuthenticateCustom(afterAuthenticateCustom);
  initializer.registerBeforeJoinGroup(beforeJoinGroupFn);
  initializer.registerBeforeDeleteGroup(beforeDeleteGroupFn);
  // Set up RPCs: For Pirate Panic
  initializer.registerRpc("match_get_score", rpcMatchGetScore);
  initializer.registerRpc("match_handle_end", rpcMatchHandleEnd);
  initializer.registerRpc("search_username", rpcSearchUsernameFn);
  logger.warn("Pirate Panic TypeScript loaded.");
};

const afterAuthenticateCustom: nkruntime.AfterHookFunction<
  nkruntime.Session,
  nkruntime.AuthenticateCustomRequest
> = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  data: nkruntime.Session,
  req: nkruntime.AuthenticateCustomRequest
) {
  afterAuthenticate(ctx, logger, nk, data);
};

function afterAuthenticate(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  data: nkruntime.Session
) {
  if (!data.created) {
    // Account already exists.
    return;
  }
  const initialState = {
    experiencePoint: 0,
    diceLevels: [1, 1, 1, 1, 1],
    level: 0,
    gameStats: {
      gamesLost: 0,
      gamesPlayed: 0,
      gamesWon: 0,
    },
  };
  const writeStats: nkruntime.StorageWriteRequest = {
    collection: "collection_user_state",
    key: "user_state",
    permissionRead: 2,
    permissionWrite: 1,
    value: initialState,
    userId: ctx.userId,
  };

  // TODO: add this userId to the invitee list.
  // Retrieve the collection from user
  // Append to list
  // Save

  // const writeAddFriendQuest = addFriendQuestInit(ctx.userId);
  // const writeCards: nkruntime.StorageWriteRequest = {
  //   collection: DeckCollectionName,
  //   key: DeckCollectionKey,
  //   permissionRead: DeckPermissionRead,
  //   permissionWrite: DeckPermissionWrite,
  //   value: defaultCardCollection(nk, logger, ctx.userId),
  //   userId: ctx.userId,
  // };
  try {
    nk.storageWrite([writeStats /*writeAddFriendQuest, writeCards*/]);
  } catch (error) {
    logger.error("storageWrite error: %q", error);
    throw error;
  }
  logger.debug("new user id: %s account data initialised", ctx.userId);
}

const rpcSearchUsernameFn: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  const input: any = JSON.parse(payload);
  const query = `
    SELECT id, username FROM users WHERE username ILIKE concat($1, '%')
    `;
  const result = nk.sqlQuery(query, [input.username]);
  return JSON.stringify(result);
};
