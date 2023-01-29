from flask import Flask, jsonify, abort, request, render_template
import requests
from requests.auth import HTTPBasicAuth
from config import (
    TOGGL_CLIENTS,
    TOGGL_API_KEY,
    TOGGL_WORKSPACE_ID,
    END_OF_NIGHT_HOUR,
    START_DATE,
)
from datetime import datetime, timedelta
import math
import pytz

app = Flask(__name__)


# loads time entries from the api
def get_time_entries(client_id, since, until):
    # add 1 day to `until` parameter to include night work
    until = datetime.fromisoformat(until)
    until += timedelta(days=1, hours=END_OF_NIGHT_HOUR)
    until = until.date().isoformat()

    result = []
    # get the current time entry
    now = datetime.now().isoformat()
    auth = HTTPBasicAuth(TOGGL_API_KEY, "api_token")
    if now < until:
        url = "https://api.track.toggl.com/api/v9/me/time_entries/current"
        current_entry = requests.get(url, auth=auth).json()
        if current_entry is not None:
            current_entry["end"] = datetime.now(pytz.utc).isoformat()
            # fix api inconsistency
            if current_entry["tags"] is None:
                current_entry["tags"] = []
            url = f"https://api.track.toggl.com/api/v9/workspaces/{TOGGL_WORKSPACE_ID}/projects/{current_entry['pid']}"
            project = requests.get(url, auth=auth).json()
            if project["client_id"] == client_id:
                current_entry["project"] = project["name"]
                result.append(current_entry)

    url = "https://api.track.toggl.com/reports/api/v2/details"
    params = {
        "user_agent": "tracker_ui",
        "client_ids": client_id,
        "workspace_id": TOGGL_WORKSPACE_ID,
        "since": since,
        "until": until,
        "page": 1,
    }
    response = requests.get(url, params=params, auth=auth).json()

    if "data" not in response:
        abort(400)

    result.extend(response["data"])
    per_page = response["per_page"]
    total_count = response["total_count"]

    if total_count > per_page:
        last_page = math.ceil(total_count / per_page) + 1
        for page in range(2, last_page):
            params["page"] = page
            response = requests.get(url, params=params, auth=auth).json()
            result.extend(response["data"])

    return result


# returns the total amount of work on the task during the given day
# the task is specified by its description and project name, which allows to avoid description collisions
def get_duration(time_entries, date, description, project):
    total_duration = 0
    original_row = time_entries[0]
    original_row_end = datetime.fromisoformat(original_row["end"])

    # is_night_work is set to true if the time entry we are calculating duration for
    # ended between midnight and `END_OF_NIGHT_HOUR`
    is_night_work = original_row_end.hour < END_OF_NIGHT_HOUR

    for row in time_entries:
        # skip rows with another description or another project
        if row["description"] != description or row["project"] != project:
            continue

        start_time = datetime.fromisoformat(row["start"])
        end_time = datetime.fromisoformat(row["end"])

        # break the loop when the previous day is reached
        end_date = end_time.date()
        if end_date < date:
            break

        # if not is_night_work, break the loop when the first time entry from the previous work night was reached
        if not is_night_work and end_time.hour < END_OF_NIGHT_HOUR:
            break

        # if is_night_work, break the loop when the first time entry from the previous work night was reached
        if is_night_work and end_date == date and end_time.hour < END_OF_NIGHT_HOUR:
            break

        total_duration += (end_time - start_time).seconds / 60

    # return the total number of minutes spent rounded to the nearest 10
    return int(round(total_duration, -1))


# prepares time entries to be displayed
def process_time_entries(time_entries, hourly_rate, since, until):
    result = []

    processed_tasks = {}

    for index, row in enumerate(time_entries):
        end_time = datetime.fromisoformat(row["end"])
        date = end_time.date()

        # use the previous date for work made at night
        if end_time.hour < END_OF_NIGHT_HOUR:
            date = (end_time - timedelta(days=1)).date()

        date_str = date.isoformat()

        # skip rows that are out of the date range
        # i.e. made later than END_OF_NIGHT_HOUR of the next day after `until`
        if date_str > until and end_time.hour >= END_OF_NIGHT_HOUR:
            continue

        # also ignore rows made earlier than `since`
        if date_str < since:
            continue

        # ignore the row if it has been already processed
        if (
            date_str in processed_tasks
            and row["description"] in processed_tasks[date_str]
        ):
            continue

        duration = get_duration(
            time_entries[index:], date, row["description"], row["project"]
        )
        processed_tasks.setdefault(date_str, [])
        processed_tasks[date_str].append(row["description"])

        billed_amount = round(hourly_rate / 60 * duration, 2)

        # skip zero-length rows that appear when a task took less than 5 minutes
        if duration == 0:
            continue

        result.append(
            {
                "date": date_str,
                "project": row["project"],
                "description": row["description"],
                "duration": duration,
                "billed_amount": billed_amount,
                "due_amount": 0 if "paid" in row["tags"] else billed_amount,
            }
        )

    return result


# update_time_entries marks a time entries as paid
def update_time_entries(ids):
    joined_ids = ",".join(map(str, ids))
    url = f"https://api.track.toggl.com/api/v8/time_entries/{joined_ids}"
    auth = HTTPBasicAuth(TOGGL_API_KEY, "api_token")
    response = requests.put(
        url, json={"time_entry": {"tags": ["paid"], "tag_action": "add"}}, auth=auth
    )
    import logging

    logging.error(response.json())


@app.route("/api/<int:toggl_client_id>/<string:client_name>")
@app.route(
    "/api/<int:toggl_client_id>/<string:client_name>/<string:action>", methods=["POST"]
)
def api(toggl_client_id=None, client_name=None, action=None):
    # client name and toggl client id must be passed
    if toggl_client_id is None or client_name is None:
        abort(404)

    # client name must exist in the config
    if client_name not in TOGGL_CLIENTS:
        abort(404)

    # client name must match toggl client_id
    if TOGGL_CLIENTS[client_name]["id"] != toggl_client_id:
        abort(404)

    # get date range from the query
    since = request.args.get("since")
    until = request.args.get("until")

    # since and until can not be greater than START_DATE
    if START_DATE:
        since = max(since, START_DATE)
        until = max(until, START_DATE)

    if since is None or until is None:
        abort(400, description="Parameters must be passed in the URL: since, until")

    # get client id from config and load time entries from toggl api
    time_entries = get_time_entries(toggl_client_id, since, until)

    if action == "set_paid":
        ids = [time_entry["id"] for time_entry in time_entries]
        update_time_entries(ids)

        return jsonify({"success": True})

    hourly_rate = TOGGL_CLIENTS[client_name]["hourly_rate"]
    processed_time_entries = process_time_entries(
        time_entries, hourly_rate, since, until
    )

    return jsonify(processed_time_entries)


@app.route("/<int:toggl_client_id>/<string:client_name>")
def index(**_):
    return render_template("index.html")
