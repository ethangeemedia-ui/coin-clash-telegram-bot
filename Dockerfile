FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm config set registry https://registry.npmjs.org/
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
