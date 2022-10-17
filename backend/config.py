import os
import json

TOGGL_API_KEY = os.getenv("TOGGL_API_KEY")
TOGGL_CLIENTS = json.loads(os.getenv("TOGGL_CLIENTS"))
TOGGL_WORKSPACE_ID = os.getenv("TOGGL_WORKSPACE_ID")

# END_OF_NIGHT_HOUR is used if night work should be added to previous day
# e.g. if night work ends at 4am, END_OF_NIGHT_HOUR should be set to 4
END_OF_NIGHT_HOUR = int(os.getenv("END_OF_NIGHT_HOUR", 0))

# START_DATE defines minimum allowed toggl query date (optional)
START_DATE = os.getenv("START_DATE")
