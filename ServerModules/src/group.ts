const beforeJoinGroupFn: nkruntime.BeforeHookFunction<nkruntime.JoinGroupRequest> =
  function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    request: nkruntime.JoinGroupRequest
  ) {
    const maxGroupMembersCount = 2;
    const memberState = 2;
    const members = nk.groupUsersList(
      request.groupId!,
      maxGroupMembersCount,
      memberState
    );
    if ((members.groupUsers?.length ?? 0) === maxGroupMembersCount) {
      throw new Error("you can not join the group.");
    }
  };

const beforeDeleteGroupFn: nkruntime.BeforeHookFunction<nkruntime.DeleteGroupRequest> =
  function (
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    request: nkruntime.DeleteGroupRequest
  ): nkruntime.DeleteGroupRequest {
    const maxGroupMembersCount = 100;
    const adminState = 1;
    const members = nk.groupUsersList(
      request.groupId!,
      maxGroupMembersCount,
      adminState
    );

    // Check delete request user is a superadmin in the group.
    members.groupUsers?.every((user) => {
      if (user.user.userId == ctx.userId) {
        return false;
      }
      return true;
    });

    return request;
  };
