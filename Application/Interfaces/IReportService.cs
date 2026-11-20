using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface IReportService
    {
        Task<ServiceResult> CreateReportAsync(CreateReportDto dto, int reporterId);
    }
}
