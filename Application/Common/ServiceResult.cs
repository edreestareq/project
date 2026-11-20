namespace AspnetStarterApp.Application.Common
{
    public class ServiceResult
    {
        public int StatusCode { get; init; }
        public object? Data { get; init; }

        public static ServiceResult Ok(object? data = null) => new() { StatusCode = 200, Data = data };
        public static ServiceResult Created(object? data = null) => new() { StatusCode = 201, Data = data };
        public static ServiceResult BadRequest(string message) => new() { StatusCode = 400, Data = new { message } };
        public static ServiceResult Unauthorized(string message) => new() { StatusCode = 401, Data = new { message } };
        public static ServiceResult Forbidden(string message) => new() { StatusCode = 403, Data = new { message } };
        public static ServiceResult NotFound(string message) => new() { StatusCode = 404, Data = new { message } };
    }
}
