using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Data;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly KarajakDbContext _context;

        public ReviewsController(KarajakDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewDto dto, [FromQuery] int buyerId)
        {
            var buyer = await _context.Users.FindAsync(buyerId);
            var seller = await _context.Users.FindAsync(dto.SellerId);

            if (buyer == null || seller == null)
            {
                return BadRequest(new { message = "Invalid buyer or seller ID." });
            }

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
            return Ok(new { success = true, reviewId = review.Id, message = "Review submitted successfully!" });
        }

        [HttpGet("seller/{sellerId}")]
        public async Task<IActionResult> GetSellerReviews(int sellerId)
        {
            var reviews = await _context.Reviews
                .Include(r => r.Buyer)
                .Include(r => r.Car)
                .Where(r => r.SellerId == sellerId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            var avgRating = reviews.Any() ? Math.Round(reviews.Average(r => r.Rating), 1) : 5.0;

            return Ok(new
            {
                AverageRating = avgRating,
                TotalReviews = reviews.Count,
                Reviews = reviews
            });
        }
    }
}
