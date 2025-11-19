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
    public DbSet<ActivityStatus> ActivityStatuses => Set<ActivityStatus>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<AccountType> AccountTypes => Set<AccountType>();
    public DbSet<AccountSize> AccountSizes => Set<AccountSize>();
    public DbSet<CrmProvider> CrmProviders => Set<CrmProvider>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Opportunity> Opportunities => Set<Opportunity>();
    public DbSet<OpportunityStage> OpportunityStages => Set<OpportunityStage>();
    public DbSet<Activity> Activities => Set<Activity>();

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

        modelBuilder.Entity<ActivityStatus>(e =>
        {
            e.ToTable("ActivityStatuses");
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

        modelBuilder.Entity<Note>(e =>
        {
            e.ToTable("Notes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Title).IsRequired().HasMaxLength(200);
            e.HasIndex(x => x.CreatedBy);
        });

        modelBuilder.Entity<AccountType>(e =>
        {
            e.ToTable("AccountTypes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.DisplayOrder).IsRequired();
        });

        modelBuilder.Entity<AccountSize>(e =>
        {
            e.ToTable("AccountSizes");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.DisplayOrder).IsRequired();
        });

        modelBuilder.Entity<CrmProvider>(e =>
        {
            e.ToTable("CrmProviders");
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.DisplayOrder).IsRequired();
        });

        modelBuilder.Entity<Account>(e =>
        {
            e.ToTable("Accounts");
            e.HasKey(x => x.Id);

            e.Property(x => x.CompanyName).IsRequired();
            e.Property(x => x.CrmExpiry).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();
            e.Property(x => x.UpdatedAt).IsRequired();
            e.Property(x => x.IsDeleted).IsRequired();

            e.HasOne(x => x.AccountType)
                .WithMany()
                .HasForeignKey(x => x.AccountTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.AccountSize)
                .WithMany()
                .HasForeignKey(x => x.AccountSizeId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.CurrentCrm)
                .WithMany()
                .HasForeignKey(x => x.CurrentCrmId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.CreatedByUserId);
            e.HasIndex(x => x.AccountTypeId);
            e.HasIndex(x => x.AccountSizeId);
            e.HasIndex(x => x.CurrentCrmId);
        });

        modelBuilder.Entity<Contact>(e =>
        {
            e.ToTable("Contacts");
            e.HasKey(x => x.Id);

            e.Property(x => x.Name).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();
            e.Property(x => x.UpdatedAt).IsRequired();
            e.Property(x => x.IsDeleted).IsRequired();

            e.HasOne(x => x.Account)
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.AccountId);
            e.HasIndex(x => x.CreatedByUserId);
        });

        modelBuilder.Entity<Opportunity>(e =>
        {
            e.ToTable("Opportunities");
            e.HasKey(x => x.Id);

            e.Property(x => x.Title).IsRequired();
            e.Property(x => x.Amount).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();
            e.Property(x => x.UpdatedAt).IsRequired();
            e.Property(x => x.IsDeleted).IsRequired();

            e.HasOne(x => x.Account)
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Stage)
                .WithMany()
                .HasForeignKey(x => x.StageId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.AccountId);
            e.HasIndex(x => x.CreatedByUserId);
            e.HasIndex(x => x.StageId);
        });

        modelBuilder.Entity<Activity>(e =>
        {
            e.ToTable("Activities");
            e.HasKey(x => x.Id);

            e.Property(x => x.Description).IsRequired();
            e.Property(x => x.CreatedAt).IsRequired();
            e.Property(x => x.UpdatedAt).IsRequired();
            e.Property(x => x.IsDeleted).IsRequired();

            e.HasOne(x => x.Account)
                .WithMany()
                .HasForeignKey(x => x.AccountId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.CreatedByUser)
                .WithMany()
                .HasForeignKey(x => x.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.ActivityType)
                .WithMany()
                .HasForeignKey(x => x.ActivityTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasOne(x => x.Status)
                .WithMany()
                .HasForeignKey(x => x.StatusId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasIndex(x => x.AccountId);
            e.HasIndex(x => x.CreatedByUserId);
            e.HasIndex(x => x.ActivityTypeId);
            e.HasIndex(x => x.StatusId);
        });

        modelBuilder.Entity<OpportunityStage>(e =>
        {
            e.ToTable("OpportunityStages");
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Name).IsUnique();
            e.Property(x => x.DisplayOrder).IsRequired();
        });
    }
}
