using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Domain.Entities;
using AspnetStarterApp.Infrastructure.Data;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class ReviewService : IReviewService
    {
        private readonly KarajakDbContext _context;

        public ReviewService(KarajakDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> SubmitReviewAsync(SubmitReviewDto dto, int buyerId)
        {
            var buyer = await _context.Users.FindAsync(buyerId);
            var seller = await _context.Users.FindAsync(dto.SellerId);

            if (buyer == null || seller == null)
                return ServiceResult.BadRequest("Invalid buyer or seller ID.");

            var review = new Review
            {
                BuyerId = buyerId,
                SellerId = dto.SellerId,
                CarId = dto.CarId,
                Rating = Math.Clamp(dto.Rating, 1, 5),
                Comment = dto.Comment.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Reviews.Add(review);
            _context.Notifications.Add(new Notification
            {
                UserId = dto.SellerId,
                Title = "New Review Received",
                Content = $"{buyer.FullName} left a {dto.Rating}-star review: \"{dto.Comment}\"",
                Type = "General"
            });

            await _context.SaveChangesAsync();
            return ServiceResult.Ok(new { success = true, reviewId = review.Id, message = "Review submitted successfully!" });
        }

        public async Task<ServiceResult> GetSellerReviewsAsync(int sellerId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Buyer)
                .Include(r => r.Car)
                .Where(r => r.SellerId == sellerId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var avgRating = reviews.Any() ? Math.Round(reviews.Average(r => r.Rating), 1) : 0.0;

            return ServiceResult.Ok(new
            {
                AverageRating = avgRating,
                TotalReviews = reviews.Count,
                Reviews = reviews
            });
        }
    }
}
