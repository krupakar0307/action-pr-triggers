FROM python:3.9-slim

# Install dependencies
COPY requirements.txt /requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src /src

# Set the entrypoint
ENTRYPOINT ["python", "/src/main.py"] 