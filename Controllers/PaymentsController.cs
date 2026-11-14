using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Data;
using AspnetStarterApp.Models;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly KarajakDbContext _context;

        public PaymentsController(KarajakDbContext context)
        {
            _context = context;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutDto dto)
        {
            var booking = await _context.Bookings
                .Include(b => b.Car)
                    .ThenInclude(c => c!.Seller)
                .Include(b => b.Buyer)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == dto.BookingId);

            if (booking == null) return NotFound(new { message = "Booking not found." });

            var car = booking.Car;
            if (car == null) return BadRequest(new { message = "Associated vehicle not found." });

            var totalAmount = (booking.OfferAmount > 0 ? booking.OfferAmount : car.Price) + 450.00m; // fee
            var txnCode = $"TXN-{Guid.NewGuid().ToString("N")[..10].ToUpper()}";

            var payment = booking.Payment ?? new Payment
            {
                BookingId = booking.Id
            };

            payment.Amount = totalAmount;
            payment.PaymentMethod = dto.PaymentMethod ?? "Credit Card";
            payment.PaymentStatus = "Successful";
            payment.TransactionCode = txnCode;
            payment.TransactionDate = DateTime.UtcNow;
            payment.ReceiptUrl = $"/api/bookings/{booking.Id}/invoice";

            if (booking.Payment == null)
            {
                _context.Payments.Add(payment);
            }

            booking.BookingStatus = "Completed";
            car.Status = "Sold";

            // Add buyer confirmation notification
            _context.Notifications.Add(new Notification
            {
                UserId = booking.BuyerId,
                Title = "Payment Successful!",
                Content = $"Your payment of {totalAmount:C2} for {car.Year} {car.Brand} {car.Model} was processed successfully (Ref: {txnCode}).",
                Type = "Payment"
            });

            // Add seller notification
            _context.Notifications.Add(new Notification
            {
                UserId = car.SellerId,
                Title = "Vehicle Sold & Payment Received!",
                Content = $"{booking.Buyer?.FullName} completed full payment for {car.Year} {car.Brand} {car.Model}. Funds will be transferred according to your payout settings.",
                Type = "Payment"
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                transactionCode = txnCode,
                totalAmount = totalAmount,
                paymentMethod = payment.PaymentMethod,
                bookingId = booking.Id,
                receiptUrl = payment.ReceiptUrl,
                message = "Payment completed successfully! Vehicle handover confirmed."
            });
        }
    }
}
