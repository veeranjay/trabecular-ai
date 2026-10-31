"""Report presence/configuration only. Never print credentials."""
import json
from settings import configuration
if __name__=='__main__':print(json.dumps(configuration(),indent=2))
