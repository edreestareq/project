using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Data
{
    public class KarajakDbContext : DbContext
    {
        public KarajakDbContext(DbContextOptions<KarajakDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Car> Cars => Set<Car>();
        public DbSet<CarImage> CarImages => Set<CarImage>();
        public DbSet<Booking> Bookings => Set<Booking>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<Review> Reviews => Set<Review>();
        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<Report> Reports => Set<Report>();
        public DbSet<AdminLog> AdminLogs => Set<AdminLog>();
        public DbSet<PlatformSettings> PlatformSettings => Set<PlatformSettings>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User Email Unique Index
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Car relationships
            modelBuilder.Entity<Car>()
                .HasOne(c => c.Seller)
                .WithMany(u => u.Listings)
                .HasForeignKey(c => c.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Car>()
                .HasMany(c => c.Images)
                .WithOne()
                .HasForeignKey(img => img.CarId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Car>()
                .HasMany(c => c.Reviews)
                .WithOne(r => r.Car)
                .HasForeignKey(r => r.CarId)
                .OnDelete(DeleteBehavior.Cascade);

            // Booking relationships
            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Buyer)
                .WithMany(u => u.Bookings)
                .HasForeignKey(b => b.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Car)
                .WithMany()
                .HasForeignKey(b => b.CarId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Payment)
                .WithOne(p => p.Booking)
                .HasForeignKey<Payment>(p => p.BookingId)
                .OnDelete(DeleteBehavior.Cascade);

            // Review relationships
            modelBuilder.Entity<Review>()
                .HasOne(r => r.Buyer)
                .WithMany(u => u.GivenReviews)
                .HasForeignKey(r => r.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Review>()
                .HasOne(r => r.Seller)
                .WithMany(u => u.ReceivedReviews)
                .HasForeignKey(r => r.SellerId)
                .OnDelete(DeleteBehavior.Restrict);

            // ChatMessage relationships
            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ChatMessage>()
                .HasOne(m => m.Car)
                .WithMany()
                .HasForeignKey(m => m.CarId)
                .OnDelete(DeleteBehavior.SetNull);

            // Notification relationships
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Report relationships
            modelBuilder.Entity<Report>()
                .HasOne(r => r.Reporter)
                .WithMany()
                .HasForeignKey(r => r.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);

            // AdminLog relationships
            modelBuilder.Entity<AdminLog>()
                .HasOne(l => l.Admin)
                .WithMany()
                .HasForeignKey(l => l.AdminId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
