# STAGE 1: BUILD

# Use the .NET SDK image.
# The SDK contains the tools needed to restore, compile and publish .NET applications.
# AS build gives this stage the name "build".
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

# Set the working directory inside the container.
# All subsequent relative paths are based on /src.
WORKDIR /src

# Copy the project files into the container.
# This copies the project definitions before the source code.
COPY API/API.csproj API/
COPY Service/Service.csproj Service/
COPY Infra/Infra.csproj Infra/

# Restore NuGet dependencies for the API project.
# Dependencies declared in the project files are downloaded.
RUN dotnet restore API/API.csproj

# Copy the rest of the source code into the container.
COPY . .

# Compile and publish the API in Release configuration.
# Output the published application to /out.
# --no-restore avoids restoring dependencies a second time.
RUN dotnet publish API/API.csproj -c Release -o /out --no-restore


# STAGE 2: RUNTIME

# Use the smaller ASP.NET Core runtime image.
# It can run the published application but does not contain the full SDK.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime

# Set the working directory for the running application.
WORKDIR /app

# Copy the published output from the build stage into this stage.
COPY --from=build /out ./

# Set the ASP.NET Core environment to Production.
ENV ASPNETCORE_ENVIRONMENT=Production

# Configure ASP.NET Core to listen on port 4000.
ENV ASPNETCORE_HTTP_PORTS=4000

# Run the application as the non-root "app" user.
USER app

# Document that the application uses port 4000.
EXPOSE 4000

# Start the API when the container starts.
CMD ["dotnet", "API.dll"]
