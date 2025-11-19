using System;

namespace Api.Services
{
    public interface ICurrentUserService
    {
        bool IsAuthenticated { get; }
        Guid? UserId { get; }
        string? Role { get; }
    }
}
