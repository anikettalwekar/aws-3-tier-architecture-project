FROM nginx:latest

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy all frontend files (HTML, CSS, JS, IMAGES)
COPY . /usr/share/nginx/html/

EXPOSE 80
