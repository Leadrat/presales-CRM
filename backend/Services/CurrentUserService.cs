using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Api.Services
{
    public sealed class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;

        public Guid? UserId
        {
            get
            {
                var sub = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier) 
                          ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("sub");
                if (Guid.TryParse(sub, out var id)) return id;
                return null;
            }
        }

        public string? Role => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Role)
                               ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("role");
    }
}
