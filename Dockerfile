FROM nginx:1.27-alpine

# Copy static app files into Nginx web root
COPY index.html /usr/share/nginx/html/index.html
COPY home.html /usr/share/nginx/html/home.html
COPY style.css /usr/share/nginx/html/style.css
COPY script.js /usr/share/nginx/html/script.js

EXPOSE 80
