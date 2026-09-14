FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM python:3.11-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FRONTEND_DIST=/app/dist
WORKDIR /app
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY cloud_server.py ./cloud_server.py
COPY --from=frontend-build /app/dist /app/dist
CMD ["sh", "-c", "uvicorn cloud_server:app --host 0.0.0.0 --port ${PORT:-10000}"]
