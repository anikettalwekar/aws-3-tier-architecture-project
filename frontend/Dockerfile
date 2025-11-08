# Use official Apache image
FROM httpd:2.4

# Copy all website files to Apache's web root
COPY . /usr/local/apache2/htdocs/

# Expose port 80
EXPOSE 80

# Start Apache server automatically
CMD ["httpd-foreground"]
