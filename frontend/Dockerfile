FROM nginx:latest

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy all frontend files (HTML, CSS, JS)
COPY . /usr/share/nginx/html

# Important: ensure images are included
COPY images/ /usr/share/nginx/html/images/

EXPOSE 80
