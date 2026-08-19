# Build context is the repo root (see docker-compose.yml) so we can bake the
# reference data files (price cache + ticker mapping) that live at the root.
FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DATABASE_URL=sqlite:///./data/insidervn.db \
    SOURCE_DIR=/app/reference

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/
COPY backend/docker-entrypoint.sh /app/docker-entrypoint.sh
RUN mkdir -p /app/reference data && chmod +x /app/docker-entrypoint.sh

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://localhost:8000/health').status==200 else 1)"

# Railway injects $PORT; fall back to 8000. APP_MODE=worker runs the
# pipeline scheduler instead of (or in addition to) the API.
ENTRYPOINT ["sh", "/app/docker-entrypoint.sh"]
