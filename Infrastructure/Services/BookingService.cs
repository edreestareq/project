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
    public class BookingService : IBookingService
    {
        private readonly KarajakDbContext _context;

        public BookingService(KarajakDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> CreateBookingAsync(BookingCreateDto dto, int buyerId)
        {
            var buyer = await _context.Users.FindAsync(buyerId);
            if (buyer == null) return ServiceResult.Unauthorized("Valid buyer account required.");
            if (buyer.Role != "Buyer") return ServiceResult.Forbidden("Only Buyer accounts can book or purchase vehicles.");

            var car = await _context.Cars.Include(c => c.Seller).FirstOrDefaultAsync(c => c.Id == dto.CarId);
            if (car == null) return ServiceResult.NotFound("Vehicle not found.");
            if (car.Status != "Available") return ServiceResult.BadRequest("Vehicle is no longer available for booking.");

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
            _context.Notifications.Add(new Notification
            {
                UserId = car.SellerId,
                Title = "New Booking Request Received",
                Content = $"{buyer.FullName} submitted a booking request for your {car.Year} {car.Brand} {car.Model}.",
                Type = "Booking"
            });

            await _context.SaveChangesAsync();
            return ServiceResult.Ok(new { success = true, bookingId = booking.Id, booking });
        }

        public async Task<ServiceResult> GetMyBookingsAsync(int buyerId)
        {
            var bookings = await _context.Bookings
                .Include(b => b.Car).ThenInclude(c => c!.Images)
                .Include(b => b.Car).ThenInclude(c => c!.Seller)
                .Include(b => b.Payment)
                .Where(b => b.BuyerId == buyerId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            return ServiceResult.Ok(bookings);
        }

        public async Task<ServiceResult> GetSellerBookingsAsync(int sellerId)
        {
            var requests = await _context.Bookings
                .Include(b => b.Car).ThenInclude(c => c!.Images)
                .Include(b => b.Buyer)
                .Include(b => b.Payment)
                .Where(b => b.Car != null && b.Car.SellerId == sellerId)
                .OrderByDescending(b => b.BookingDate)
                .ToListAsync();

            return ServiceResult.Ok(requests);
        }

        public async Task<ServiceResult> UpdateBookingStatusAsync(int id, BookingStatusUpdateDto dto)
        {
            var booking = await _context.Bookings
                .Include(b => b.Car)
                .Include(b => b.Buyer)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null) return ServiceResult.NotFound("Booking not found.");

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
            return ServiceResult.Ok(new { success = true, bookingStatus = booking.BookingStatus });
        }

        public async Task<ServiceResult> GetInvoiceAsync(int id)
        {
            var booking = await _context.Bookings
                .Include(b => b.Car).ThenInclude(c => c!.Seller)
                .Include(b => b.Buyer)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null) return ServiceResult.NotFound("Booking not found.");

            var subtotal = booking.OfferAmount > 0 ? booking.OfferAmount : (booking.Car?.Price ?? 0);
            var processingFee = 450.00m;
            var taxes = Math.Round(subtotal * 0.06m, 2);
            var total = subtotal + processingFee + taxes;

            return ServiceResult.Ok(new
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
}
