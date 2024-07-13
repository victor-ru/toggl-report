FROM --platform=linux/amd64 python:3.9-slim-buster
# EXPOSE is ignored by heroku
EXPOSE $PORT
WORKDIR /usr/src/app
# Download latest listing of available packages:
RUN apt-get -y update
# Upgrade already installed packages:
RUN apt-get -y upgrade
# Install the necessary libraries
RUN apt-get install -y curl gcc make python3-dev libffi-dev musl-dev
COPY . .
RUN pip install --no-cache-dir -r ./requirements.txt
RUN pip install uwsgi
CMD [ "uwsgi", "--http-socket", ":$(PORT)", \
    "--protocol", "uwsgi", \
    "--wsgi", "app:app" ]