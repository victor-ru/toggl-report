import os
import json

TOGGL_API_KEY = os.getenv("TOGGL_API_KEY")
TOGGL_CLIENT_IDS = json.loads(os.getenv("TOGGL_CLIENT_IDS"))
TOGGL_WORKSPACE_ID = os.getenv("TOGGL_WORKSPACE_ID")

# END_OF_NIGHT_HOUR is used if night work should be added to previous day
# e.g. if night work ends at 4am, END_OF_NIGHT_HOUR should be set to 4
END_OF_NIGHT_HOUR = int(os.getenv("END_OF_NIGHT_HOUR", 0))

# HOURLY_RATE is used to calculate billed amounts
HOURLY_RATE = int(os.getenv("HOURLY_RATE"))
