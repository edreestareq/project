using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface IReviewService
    {
        Task<ServiceResult> SubmitReviewAsync(SubmitReviewDto dto, int buyerId);
        Task<ServiceResult> GetSellerReviewsAsync(int sellerId);
    }
}
