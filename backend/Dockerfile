# ----------- Base Image -----------
FROM python:3.11-slim

# ----------- Environment -----------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ----------- Working Directory -----------
WORKDIR /app

# ----------- Install Dependencies -----------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ----------- Copy Application Code -----------
COPY . .

# ----------- Expose Port -----------
EXPOSE 8000

# ----------- Run Application -----------
# CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}