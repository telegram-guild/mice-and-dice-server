const winnerBonus = 1;
const winReward = 5;
const loseReward = 3;

function calculateScore(isWinner: boolean): number {
  let score = isWinner ? winnerBonus : 0;
  return Math.round(score);
}

function rpcMatchGetScore(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  let matchId = JSON.parse(payload)["match_id"];
  if (!matchId) {
    throw Error("missing match_id from payload");
  }
  let items = nk.walletLedgerList(ctx.userId, 100);
  while (items.cursor) {
    items = nk.walletLedgerList(ctx.userId, 100, items.cursor);
  }
  let lastMatchReward = {} as nkruntime.WalletLedgerResult;
  for (let update of items.items) {
    if (
      update.metadata.source === "match_reward" &&
      update.metadata.match_id === matchId
    ) {
      lastMatchReward = update;
    }
  }
  return JSON.stringify(lastMatchReward);
}

enum MatchEndPlacement {
  Loser = 0,
  Winner = 1,
}

interface MatchEndRequest {
  matchId: string;
  placement: MatchEndPlacement;
}

interface MatchEndResponse {
  tokens: number;
  score: number;
}

const rpcMatchHandleEnd: nkruntime.RpcFunction = function (
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  payload: string
): string {
  if (!payload) {
    throw Error("no data found in rpc payload");
  }
  let request: MatchEndRequest = JSON.parse(payload);
  let score = calculateScore(request.placement == MatchEndPlacement.Winner);
  let metadata = {
    source: "match_reward",
    match_id: request.matchId,
  };
  updateWallet(nk, ctx.userId, score, metadata);
  nk.leaderboardRecordWrite(globalLeaderboard, ctx.userId, ctx.username, score);
  let response: MatchEndResponse = {
    tokens:
      request.placement == MatchEndPlacement.Winner ? winReward : loseReward,
    score: score,
  };
  logger.debug("match %s ended", ctx.matchId);
  return JSON.stringify(response);
};
