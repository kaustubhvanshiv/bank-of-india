# Used in CI/CD pipeline for build validation
FROM nginx:1.27-alpine

# Copy static app files into Nginx web root
COPY app/index.html /usr/share/nginx/html/index.html
COPY app/home.html /usr/share/nginx/html/home.html
COPY app/style.css /usr/share/nginx/html/style.css
COPY app/script.js /usr/share/nginx/html/script.js

EXPOSE 80

# Health check for Docker container validation
HEALTHCHECK CMD curl -f http://localhost/index.html || exit 1
