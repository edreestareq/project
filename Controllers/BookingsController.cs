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
    public class BookingsController : ControllerBase
    {
        private readonly KarajakDbContext _context;

        public BookingsController(KarajakDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] BookingCreateDto dto, [FromQuery] int buyerId)
        {
            var buyer = await _context.Users.FindAsync(buyerId);
            if (buyer == null) return Unauthorized(new { message = "Valid buyer account required." });
            if (buyer.Role != "Buyer") return StatusCode(403, new { message = "Only Buyer accounts can book or purchase vehicles." });

            var car = await _context.Cars.Include(c => c.Seller).FirstOrDefaultAsync(c => c.Id == dto.CarId);
            if (car == null) return NotFound(new { message = "Vehicle not found." });

            if (car.Status != "Available")
            {
                return BadRequest(new { message = "Vehicle is no longer available for booking." });
            }

            var booking = new Booking
            {
                BuyerId = buyerId,
                CarId = dto.CarId,
                BookingDate = DateTime.UtcNow,
                ScheduledHandoverDate = dto.ScheduledHandoverDate,
                ScheduledTimeSlot = dto.ScheduledTimeSlot,
                DeliveryLocation = dto.DeliveryLocation,
                OfferAmount = dto.OfferAmount > 0 ? dto.OfferAmount : car.Price,
                BookingStatus = "Pending",
                Notes = dto.Notes
            };

            _context.Bookings.Add(booking);

            // Notify seller
            _context.Notifications.Add(new Notification
            {
                UserId = car.SellerId,
                Title = "New Booking Request Received",
                Content = $"{buyer.FullName} submitted a booking request for your {car.Year} {car.Brand} {car.Model}.",
                Type = "Booking"
            });

            await _context.SaveChangesAsync();
            return Ok(new { success = true, bookingId = booking.Id, message = "Booking created successfully." });
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyBookings([FromQuery] int buyerId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Car)
                    .ThenInclude(c => c!.Images)
                .Include(b => b.Car)
                    .ThenInclude(c => c!.Seller)
                .Include(b => b.Payment)
                .Where(b => b.BuyerId == buyerId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            return Ok(bookings);
        }

        [HttpGet("seller")]
        public async Task<IActionResult> GetSellerBookings([FromQuery] int sellerId)
        {
            var requests = await _context.Bookings
                .Include(b => b.Car)
                    .ThenInclude(c => c!.Images)
                .Include(b => b.Buyer)
                .Include(b => b.Payment)
                .Where(b => b.Car != null && b.Car.SellerId == sellerId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateBookingStatus(int id, [FromBody] BookingStatusUpdateDto dto)
        {
            var booking = await _context.Bookings
                .Include(b => b.Car)
                .Include(b => b.Buyer)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null) return NotFound(new { message = "Booking not found." });

            booking.BookingStatus = dto.Status;

            if (dto.Status == "Approved")
            {
                booking.BookingStatus = "Approved";
                _context.Notifications.Add(new Notification
                {
                    UserId = booking.BuyerId,
                    Title = "Booking Approved!",
                    Content = $"Your reservation for {booking.Car?.Brand} {booking.Car?.Model} has been approved by the seller. You can now complete checkout.",
                    Type = "Booking"
                });
            }
            else if (dto.Status == "Cancelled" || dto.Status == "Declined")
            {
                booking.BookingStatus = "Cancelled";
                if (booking.Car != null && booking.Car.Status == "Reserved")
                {
                    booking.Car.Status = "Available";
                }

                _context.Notifications.Add(new Notification
                {
                    UserId = booking.BuyerId,
                    Title = "Booking Status Update",
                    Content = $"Your booking request #{booking.Id} was not accepted: {dto.Reason ?? "Seller unavailable."}",
                    Type = "Booking"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true, bookingStatus = booking.BookingStatus });
        }

        [HttpGet("{id}/invoice")]
        public async Task<IActionResult> GetInvoice(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.Car)
                    .ThenInclude(c => c!.Seller)
                .Include(b => b.Buyer)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null) return NotFound(new { message = "Booking not found." });

            var subtotal = booking.OfferAmount > 0 ? booking.OfferAmount : (booking.Car?.Price ?? 0);
            var processingFee = 450.00m;
            var taxes = Math.Round(subtotal * 0.06m, 2);
            var total = subtotal + processingFee + taxes;

            return Ok(new
            {
                InvoiceNumber = $"INV-KJ-{booking.Id:D5}",
                OrderCode = $"#KJ-{booking.Id + 88400}",
                IssueDate = booking.BookingDate.ToString("MMMM dd, yyyy"),
                BuyerName = booking.Buyer?.FullName,
                BuyerEmail = booking.Buyer?.Email,
                BuyerPhone = booking.Buyer?.PhoneNumber,
                SellerName = booking.Car?.Seller?.FullName,
                Vehicle = $"{booking.Car?.Year} {booking.Car?.Brand} {booking.Car?.Model}",
                Vin = $"KJ-{booking.CarId * 9874}-AMMAN",
                Subtotal = subtotal,
                ProcessingFee = processingFee,
                DeliveryHandover = "Included",
                Taxes = taxes,
                TotalAmount = total,
                Status = booking.BookingStatus,
                HandoverDate = booking.ScheduledHandoverDate?.ToString("MMMM dd, yyyy") ?? "Pending Schedule",
                HandoverTimeSlot = booking.ScheduledTimeSlot ?? "09:00 AM",
                Location = booking.DeliveryLocation ?? "KARAJAK Delivery Center - Amman",
                PaymentMethod = booking.Payment?.PaymentMethod ?? "Pending Payment",
                TransactionCode = booking.Payment?.TransactionCode ?? "N/A"
            });
        }
    }

    public class BookingStatusUpdateDto
    {
        public string Status { get; set; } = "Approved";
        public string? Reason { get; set; }
    }
}
