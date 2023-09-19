// octoprint_chromatofore/static/js/filaments.js

class Filaments {
    constructor() {
        if (!Filaments.instance) {
            this.filamentList = ko.observableArray([]);
            this.isLoaded = ko.observable(false);

            Filaments.instance = this;
        }
        return Filaments.instance;
    }

    fetch() {
        OctoPrint.simpleApiCommand('chromatofore', 'fetch_filaments')
            .done((response) => {
                console.info("Got response for fetch_filaments call: ", response);
                if (response.success) {
                    const filamentArray = Object.values(response.filaments);
                    console.info("filamentArray ", filamentArray);
                    this.filamentList(filamentArray);
                    this.isLoaded(true);
                    console.info("this.filamentList()", this.filamentList());
                } else {
                    console.error("Failed to fetch filaments", response);
                }
            })
            .fail((xhr, status, error) => {
                console.error(`Failed to fetch filaments. Status: ${status}, Error: ${error}`);
            });
    }

    sortedByDisplayName() {
        const filamentArray = Object.values(this.filamentList());
        const sortedList = filamentArray.sort((a, b) => a.displayName.localeCompare(b.displayName));
        console.info(`sorted list: ${sortedList}`);
        return ko.observableArray(sortedList);
    }
    

    getFilamentById(id) {
        const filamentArray = Object.values(this.filamentList());
        return filamentArray.find(filament => filament.databaseId === id);
    }

}

// const filamentsInstance = new Filaments();
// export default filamentsInstance;

