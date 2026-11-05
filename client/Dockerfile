# Use the official Bun image, version 1.
# Bun provides the JavaScript runtime and package manager.
FROM oven/bun:1

# Set the working directory inside the container.
WORKDIR /app

# Copy package.json and bun.lock into the container.
# These files describe the project and its dependencies.
COPY package.json bun.lock ./

# Install dependencies.
# --frozen-lockfile ensures the installed dependencies match bun.lock.
# It will fail rather than silently changing the lockfile.
RUN bun install --frozen-lockfile

# Copy the frontend source code into the container.
COPY src ./src

# Set the Node.js environment to production.
ENV NODE_ENV=production

# Tell the frontend application to listen on port 3000.
ENV PORT=3000

# Run the application as the non-root bun user.
USER bun

# Document that the application uses port 3000.
EXPOSE 3000

# Start the frontend application.
CMD ["bun", "src/index.ts"]
