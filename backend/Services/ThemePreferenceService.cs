using System;
using System.Threading.Tasks;
using Api.Models;

namespace Api.Services
{
    public class ThemePreferenceService
    {
        private readonly AppDbContext _db;
        private readonly ICurrentUserService _currentUser;

        public ThemePreferenceService(AppDbContext db, ICurrentUserService currentUser)
        {
            _db = db;
            _currentUser = currentUser;
        }

        public async Task<string?> GetThemeAsync()
        {
            if (!_currentUser.IsAuthenticated || _currentUser.UserId == null)
            {
                return null;
            }

            var user = await _db.Users.FindAsync(_currentUser.UserId.Value);
            if (user == null || user.IsDeleted || !user.IsActive)
            {
                return null;
            }

            return user.ThemePreference;
        }

        public async Task<string?> SetThemeAsync(string theme)
        {
            if (!_currentUser.IsAuthenticated || _currentUser.UserId == null)
            {
                return null;
            }

            var user = await _db.Users.FindAsync(_currentUser.UserId.Value);
            if (user == null || user.IsDeleted || !user.IsActive)
            {
                return null;
            }

            user.ThemePreference = theme;
            user.UpdatedAt = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync();

            return user.ThemePreference;
        }
    }
}
