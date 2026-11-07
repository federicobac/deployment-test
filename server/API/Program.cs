var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

// Health-check endpoint for Nginx and deployment monitoring.
app.MapGet("/healthz", () =>
{
    return Results.Ok(new { status = "Healthy" });
});

// Basic API endpoint.
app.MapGet("/", () =>
{
    return Results.Ok(new
    {
        message = "Hello from the .NET API!",
        application = "Deployment Exercise",
        status = "Running"
    });
});

app.Run();