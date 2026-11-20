using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Domain.Entities;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface IAdminService
    {
        Task<ServiceResult> GetDashboardStatsAsync();
        Task<ServiceResult> GetUsersAsync(string? search, string? role, string? status);
        Task<ServiceResult> ToggleUserStatusAsync(int id);
        Task<ServiceResult> VerifySellerAsync(int id);
        Task<ServiceResult> GetListingsAsync(string? status);
        Task<ServiceResult> ModerateListingAsync(int id, ListingModerationDto dto);
        Task<ServiceResult> GetTransactionsAsync(string? status);
        Task<ServiceResult> GetReportsAsync();
        Task<ServiceResult> ActionReportAsync(int id, ReportActionDto dto);
        Task<ServiceResult> GetSettingsAsync();
        Task<ServiceResult> UpdateSettingsAsync(PlatformSettings newSettings);
        Task<byte[]> ExportTransactionsCsvAsync();
    }
}
