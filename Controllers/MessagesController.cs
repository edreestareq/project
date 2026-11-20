using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using AspnetStarterApp.Application.DTOs;
using AspnetStarterApp.Application.Interfaces;

namespace AspnetStarterApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessagesController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations([FromQuery] int userId)
        {
            var res = await _messageService.GetConversationsAsync(userId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpGet("thread")]
        public async Task<IActionResult> GetThread([FromQuery] int userId, [FromQuery] int otherUserId, [FromQuery] int? carId)
        {
            var res = await _messageService.GetThreadAsync(userId, otherUserId, carId);
            return StatusCode(res.StatusCode, res.Data);
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto dto, [FromQuery] int senderId)
        {
            var res = await _messageService.SendMessageAsync(dto, senderId);
            return StatusCode(res.StatusCode, res.Data);
        }
    }
}
