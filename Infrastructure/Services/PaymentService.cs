using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;
using AspnetStarterApp.Domain.Entities;
using AspnetStarterApp.Infrastructure.Data;

namespace AspnetStarterApp.Infrastructure.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly KarajakDbContext _context;

        public PaymentService(KarajakDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> CheckoutAsync(CheckoutDto dto)
        {
            var booking = await _context.Bookings
                .Include(b => b.Car).ThenInclude(c => c!.Seller)
                .Include(b => b.Buyer)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == dto.BookingId);

            if (booking == null) return ServiceResult.NotFound("Booking not found.");
            if (booking.Buyer == null || booking.Buyer.Role != "Buyer")
                return ServiceResult.Forbidden("Only Buyer accounts can complete vehicle payments.");
            if (booking.BookingStatus == "Completed")
                return ServiceResult.BadRequest("تم دفع قيمة هذا الحجز مسبقاً.");
            if (booking.BookingStatus == "Cancelled")
                return ServiceResult.BadRequest("لا يمكن إتمام الدفع لحجز ملغى.");

            var car = booking.Car;
            if (car == null) return ServiceResult.BadRequest("Associated vehicle not found.");
            if (car.Status == "Sold") return ServiceResult.BadRequest("هذه المركبة مباعة بالفعل.");

            var totalAmount = (booking.OfferAmount > 0 ? booking.OfferAmount : car.Price) + 450.00m;
            var txnCode = $"TXN-{Guid.NewGuid().ToString("N")[..10].ToUpper()}";

            var payment = booking.Payment ?? new Payment { BookingId = booking.Id };
            payment.Amount = totalAmount;
            payment.PaymentMethod = dto.PaymentMethod ?? "Credit Card";
            payment.PaymentStatus = "Successful";
            payment.TransactionCode = txnCode;
            payment.TransactionDate = DateTime.UtcNow;
            payment.ReceiptUrl = $"/api/bookings/{booking.Id}/invoice";

            if (booking.Payment == null) _context.Payments.Add(payment);

            booking.BookingStatus = "Completed";
            car.Status = "Sold";

            _context.Notifications.Add(new Notification
            {
                UserId = booking.BuyerId,
                Title = "Payment Successful!",
                Content = $"Your payment of {totalAmount:C2} for {car.Year} {car.Brand} {car.Model} was processed successfully (Ref: {txnCode}).",
                Type = "Payment"
            });

            _context.Notifications.Add(new Notification
            {
                UserId = car.SellerId,
                Title = "Vehicle Sold & Payment Received!",
                Content = $"{booking.Buyer?.FullName} completed full payment for {car.Year} {car.Brand} {car.Model}. Funds will be transferred according to your payout settings.",
                Type = "Payment"
            });

            await _context.SaveChangesAsync();

            return ServiceResult.Ok(new
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
