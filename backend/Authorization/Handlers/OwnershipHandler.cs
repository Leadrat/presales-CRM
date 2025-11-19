using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Api.Authorization.Requirements;
using Api.Authorization.Attributes;
using Api.Services;
using Microsoft.EntityFrameworkCore;
using Api;

namespace Api.Authorization.Handlers
{
    public sealed class OwnershipHandler : AuthorizationHandler<OwnershipRequirement>
    {
        private readonly AppDbContext _db;
        private readonly ICurrentUserService _current;
        private readonly ILogger<OwnershipHandler> _logger;

        public OwnershipHandler(AppDbContext db, ICurrentUserService current, ILogger<OwnershipHandler> logger)
        {
            _db = db;
            _current = current;
            _logger = logger;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, OwnershipRequirement requirement)
        {
            var httpContext = GetHttpContext(context.Resource);
            if (httpContext is null)
            {
                context.Fail();
                return;
            }

            if (!_current.IsAuthenticated || _current.UserId is null)
            {
                _logger.LogWarning("RBAC deny: unauthenticated or invalid sub. Path: {Path}", httpContext.Request.Path);
                context.Fail();
                return;
            }

            if (string.Equals(_current.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                context.Succeed(requirement);
                return;
            }

            var endpoint = httpContext.GetEndpoint();
            var ownedAttr = endpoint?.Metadata.GetMetadata<OwnedByAttribute>();
            if (ownedAttr is null)
            {
                _logger.LogWarning("RBAC deny: OwnedByAttribute missing on endpoint {Path}", httpContext.Request.Path);
                context.Fail();
                return;
            }

            // Parse id from route
            if (!httpContext.Request.RouteValues.TryGetValue(ownedAttr.IdParam, out var rawId) || rawId is null)
            {
                _logger.LogWarning("RBAC deny: route id param '{Param}' not found on {Path}", ownedAttr.IdParam, httpContext.Request.Path);
                context.Fail();
                return;
            }

            if (!Guid.TryParse(Convert.ToString(rawId), out var id))
            {
                _logger.LogWarning("RBAC deny: route id not a GUID. Value={Value} Path={Path}", rawId, httpContext.Request.Path);
                context.Fail();
                return;
            }

            // Load entity dynamically and check ownership
            var entity = await _db.FindAsync(ownedAttr.EntityType, new object[] { id });
            if (entity is null)
            {
                // mark not found for result handler to translate to 404
                httpContext.Items[Policies.FailureReasonNotFound] = true;
                _logger.LogInformation("RBAC not-found: {Entity} {Id} Path={Path}", ownedAttr.EntityType.Name, id, httpContext.Request.Path);
                context.Fail();
                return;
            }

            if (entity is not Api.Models.Interfaces.IOwnedEntity owned)
            {
                _logger.LogWarning("RBAC deny: entity type {Type} does not implement IOwnedEntity", ownedAttr.EntityType.FullName);
                context.Fail();
                return;
            }

            if (owned.CreatedBy == _current.UserId!.Value)
            {
                context.Succeed(requirement);
            }
            else
            {
                _logger.LogInformation("RBAC forbidden: user {UserId} tried to access {Type} {Id} owned by {Owner}", _current.UserId, ownedAttr.EntityType.Name, id, owned.CreatedBy);
                context.Fail();
            }
        }

        private static HttpContext? GetHttpContext(object? resource)
        {
            if (resource is HttpContext http)
                return http;

            if (resource is Microsoft.AspNetCore.Mvc.Filters.AuthorizationFilterContext mvc)
                return mvc.HttpContext;

            return null;
        }
    }
}
