using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface ICarService
    {
        Task<ServiceResult> GetCarsAsync(CarFilterDto filter);
        Task<ServiceResult> GetCarByIdAsync(int id);
        Task<ServiceResult> GetMyListingsAsync(int sellerId);
        Task<ServiceResult> UploadImageAsync(IFormFile file, string webRootPath);
        Task<ServiceResult> CreateListingAsync(CarUpsertDto dto, int sellerId);
        Task<ServiceResult> UpdateListingAsync(int id, CarUpsertDto dto, int sellerId);
        Task<ServiceResult> DeleteListingAsync(int id, int sellerId);
    }
}
