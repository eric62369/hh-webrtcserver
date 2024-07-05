function rpcHealthCheck(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string) {
    logger.info('healthcheck RPC called');
    return JSON.stringify({ success: true });
}