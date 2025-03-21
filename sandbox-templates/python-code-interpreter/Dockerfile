# You can use most Debian-based base images
FROM python:3.9-slim
# Install dependencies and customize sandbox
RUN pip3 install --no-cache-dir numpy pandas matplotlib seaborn plotly

# Copy the code to the container
WORKDIR /home/user
COPY . /home/user
