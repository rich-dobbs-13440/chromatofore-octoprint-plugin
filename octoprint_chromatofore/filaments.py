import requests
import json


class Filament:
    def __init__(self, databaseId, displayName, vendor, material, colorName, color):
        self.databaseId = databaseId
        self.displayName = displayName
        self.vendor = vendor
        self.material = material
        self.colorName = colorName
        self.color = color

    def __repr__(self):
        return f"<Filament(databaseId={self.databaseId}, displayName={self.displayName}, vendor={self.vendor}, material={self.material}, colorName={self.colorName}, color={self.color})>"
    
    def to_dict(self):
        return {
            "databaseId": self.databaseId,
            "displayName": self.displayName,
            "vendor": self.vendor,
            "material": self.material,
            "colorName": self.colorName,
            "color": self.color
        }


class Filaments:
# Initial catalog specified as JSON string
    initial_catalog_json = """
    [
        {"databaseId": 1, "displayName": "Sunlu PLA Black", "vendor": "Sunlu", "material": "PLA", "colorName": "Black", "color": "#000000"},
        {"databaseId": 2, "displayName": "Sunlu PLA Shiny Gold", "vendor": "Sunlu", "material": "PLA", "colorName": "Gold", "color": "#D4AF37"},
        {"databaseId": 3, "displayName": "Sunlu PLA Shiny Copper", "vendor": "Sunlu", "material": "PLA", "colorName": "Copper", "color": "#B87333"},
        {"databaseId": 4, "displayName": "Cut-Rate PLA Red", "vendor": "Cut-Rate", "material": "PLA", "colorName": "Red", "color": "#FF0000"},
        {"databaseId": 5, "displayName": "Sunlu PLA White", "vendor": "Sunlu", "material": "PLA", "colorName": "White", "color": "#FFFFFF"}
    ]
    """  

    def __init__(self):
        self.filaments = {}
        initial_catalog_dict = json.loads(self.initial_catalog_json)
        self.load_from_dict(initial_catalog_dict)

    def add_filament(self, filament):
        self.filaments[filament.databaseId] = filament

    def __repr__(self):
        return str(self.filaments)
    
    def load_from_dict(self, data):
        for entry in data:
            filament = Filament(**entry)
            self.add_filament(filament)

    def to_dict(self):
        return {db_id: filament.to_dict() for db_id, filament in self.filaments.items()}



def fetch_spool_data_from_spool_manager_plugin(base_url, api_key):
    """
    Fetch spool data from SpoolManager's API endpoint.

    :param base_url: Base URL of the OctoPrint server (e.g., 'http://localhost:5000')
    :param api_key: OctoPrint API key for authorization
    :return: allSpools, selectedSpools
    """

    # Define the API endpoint
    endpoint_url = f"{base_url}/plugin/SpoolManager/loadSpoolsByQuery"

    # Set headers (including API key for authorization)
    headers = {
        "X-Api-Key": api_key,
        "Content-Type": "application/json"
    }

    # Make the GET request
    response = requests.get(endpoint_url, headers=headers)

    # Check if the request was successful
    if response.status_code == 200:
        data = response.json()
        """
		catalogs = {
			"vendors": vendors,
			"materials": materials,
			"colors": colors,
			"labels": labels
		}           
        """
     
        allSpools = data.get('allSpools', [])
        selectedSpools = data.get('selectedSpools', [])
        return allSpools, selectedSpools

    # Handle potential errors
    else:
        print(f"Error: Received status code {response.status_code}")
        return None, None

# # Sample usage:
# base_url = "http://YOUR_OCTOPRINT_IP:YOUR_PORT"
# api_key = "YOUR_API_KEY"
# all_spools, selected_spools = fetch_spool_data(base_url, api_key)
# print("All Spools:", all_spools)
# print("Selected Spools:", selected_spools)


""" 		if (self._getValueFromJSONOrNone("databaseId", jsonData) != None):
			spoolModel.databaseId = self._getValueFromJSONOrNone("databaseId", jsonData)

		spoolModel.displayName = self._getValueFromJSONOrNone("displayName", jsonData)
		spoolModel.vendor = self._getValueFromJSONOrNone("vendor", jsonData)

		spoolModel.material = self._getValueFromJSONOrNone("material", jsonData)


		spoolModel.colorName = self._getValueFromJSONOrNone("colorName", jsonData)
		spoolModel.color = self._getValueFromJSONOrNone("color", jsonData)
"""