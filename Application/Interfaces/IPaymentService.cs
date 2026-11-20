using System.Threading.Tasks;
using AspnetStarterApp.Application.Common;
using AspnetStarterApp.Application.DTOs;

namespace AspnetStarterApp.Application.Interfaces
{
    public interface IPaymentService
    {
        Task<ServiceResult> CheckoutAsync(CheckoutDto dto);
    }
}
