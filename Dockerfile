FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json .npmrc ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
