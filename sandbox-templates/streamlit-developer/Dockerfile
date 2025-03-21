# You can use most Debian-based base images
FROM python:3.9-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY start_server.sh /start_server.sh
COPY ping_server.sh /ping_server.sh
RUN chmod +x /start_server.sh
RUN chmod +x /ping_server.sh

# Install dependencies and customize sandbox
RUN pip3 install --no-cache-dir streamlit pandas numpy matplotlib requests seaborn plotly

# Copy the code to the container
WORKDIR /home/user
COPY . /home/user
