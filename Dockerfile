# Use the official lightweight Nginx image.
FROM nginx:1.29-alpine

# Copy our Nginx configuration template.
# Nginx automatically processes templates in this directory
# and replaces environment variables when the container starts.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Document that Nginx listens on port 8080.
EXPOSE 8080
