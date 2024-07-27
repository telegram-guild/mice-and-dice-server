const currencyKeyName = "tokens";

function updateWallet(
  nk: nkruntime.Nakama,
  userId: string,
  amount: number,
  metadata: { [key: string]: any }
): nkruntime.WalletUpdateResult {
  const changeset = {
    [currencyKeyName]: amount,
  };
  let result = nk.walletUpdate(userId, changeset, metadata, true);

  return result;
}
