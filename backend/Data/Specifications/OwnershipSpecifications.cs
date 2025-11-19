using System;
using System.Linq;
using Api.Models.Interfaces;

namespace Api.Data.Specifications
{
    public static class OwnershipSpecifications
    {
        public static IQueryable<T> ApplyOwnershipFilter<T>(this IQueryable<T> query, Guid? userId, string? role)
            where T : class, IOwnedEntity
        {
            if (string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                return query; // Admin sees all
            }

            if (userId is null)
            {
                // No user id available – return empty to be safe; caller can choose how to handle
                return query.Where(_ => false);
            }

            return query.Where(e => e.CreatedBy == userId.Value);
        }
    }
}
