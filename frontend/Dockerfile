FROM nginx:latest

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy all frontend files
COPY . .

# Optional: list files (debug)
RUN ls -R /usr/share/nginx/html

EXPOSE 80
