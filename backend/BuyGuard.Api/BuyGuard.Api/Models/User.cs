namespace BuyGuard.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "employee"; // admin, manager, employee
    public decimal? ManagerLimitPLN { get; set; }

    // Requesty, które użytkownik utworzył
    public ICollection<Request> RequestsAuthored { get; set; } = new List<Request>();

    // Requesty, które użytkownik zarządza (jako manager)
    public ICollection<Request> RequestsManaged { get; set; } = new List<Request>();
}
