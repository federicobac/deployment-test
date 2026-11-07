var builder = WebApplication.CreateBuilder(args);

// Allow the deployed frontend to communicate with this API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "https://deployment-test.fly.dev",
                "http://localhost:3500"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Enable the CORS policy.
app.UseCors("Frontend");

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