using System.Diagnostics;
using Microsoft.AspNetCore.Http;

namespace Api.Middleware;

public class CorrelationIdMiddleware
{
    private const string HeaderName = "Correlation-Id";
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        if (!context.Request.Headers.TryGetValue(HeaderName, out var cid) || string.IsNullOrWhiteSpace(cid))
        {
            cid = Guid.NewGuid().ToString();
            context.Request.Headers[HeaderName] = cid;
        }
        context.Response.Headers[HeaderName] = cid.ToString();
        using var activity = new Activity("http");
        activity.AddTag(HeaderName, cid!);
        await _next(context);
    }
}
