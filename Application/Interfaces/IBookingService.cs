using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface IBookingService
    {
        Task<ServiceResult> CreateBookingAsync(BookingCreateDto dto, int buyerId);
        Task<ServiceResult> GetMyBookingsAsync(int buyerId);
        Task<ServiceResult> GetSellerBookingsAsync(int sellerId);
        Task<ServiceResult> UpdateBookingStatusAsync(int id, BookingStatusUpdateDto dto);
        Task<ServiceResult> GetInvoiceAsync(int id);
    }
}
