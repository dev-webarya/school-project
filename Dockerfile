# Stage 1: Build the React App
FROM node:20-alpine as build
WORKDIR /app

# Copy root package.json (frontend dependencies)
COPY package*.json ./
RUN npm install

# Copy frontend source code
COPY . .

# Build the app (outputs to /dist)
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
