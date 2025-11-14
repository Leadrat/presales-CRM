using Microsoft.EntityFrameworkCore;
using Api.Models;

namespace Api;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<ActivityType> ActivityTypes => Set<ActivityType>();
    public DbSet<Role> Roles => Set<Role>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("Users");
            e.HasKey(x => x.Id);
            // Index and uniqueness on lower(Email) for non-deleted users will be created via migration SQL
            e.Property(x => x.Email).IsRequired().HasMaxLength(100);
            e.Property(x => x.PasswordHash).IsRequired().HasMaxLength(255);
            e.Property(x => x.FullName).HasMaxLength(100);
            e.Property(x => x.Phone).HasMaxLength(15);
            e.HasOne<Role>().WithMany().HasForeignKey(x => x.RoleId);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.ToTable("RefreshTokens");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.UserId);
            e.HasIndex(x => x.ExpiresAt);
            e.HasOne<User>().WithMany().HasForeignKey(x => x.UserId);
        });

        modelBuilder.Entity<ActivityType>(e =>
        {
            e.ToTable("ActivityTypes");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Name).IsUnique();
        });

        modelBuilder.Entity<ActivityLog>(e =>
        {
            e.ToTable("ActivityLogs");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ActivityTypeId);
            e.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<Role>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.Name).IsRequired().HasMaxLength(50);
        });
    }
}

