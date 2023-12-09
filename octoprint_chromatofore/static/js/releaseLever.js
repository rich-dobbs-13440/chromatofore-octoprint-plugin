
releaseLeverCommand = function(command) {
    console.log("In releaseLeverCommand");

    $('#extruderReleaseButton').prop('disabled', true);
    $('#extruderEngageButton').prop('disabled', true);    

    const context_message = `Context: command: ${command}`;
    console.log("In releaseLeverCommand", context_message);
    var data = {};

    OctoPrint.simpleApiCommand("chromatofore", command, data)
    .done(function(response) {
        if (response.success) {    
            console.log("Got response from simpleApiCommand that succeeded", response, context_message);
            new PNotify({
                title: 'Release Lever Command Succeed',
                text: context_message,
                type: 'success' // can be 'info', 'success', 'error', or 'notice'
            });
            if (command == "release_extruder_lever") {
                $('#extruderEngageButton').prop('disabled', false);
            } else if (command == 'engage_extruder_lever') {
                $('#extruderReleaseButton').prop('disabled', false);
            } else {
                console.error(`Internal error.  Unhandled command ${command}`);
            }
        } else {
            console.log("Got response from simpleApiCommand that did not succeed", response, context_message);
            new PNotify({
                title: 'Release Lever Command Succeed',
                text: context_message,
                type: 'error' // can be 'info', 'success', 'error', or 'notice'
            });
            $('#extruderReleaseButton').prop('disabled', false);
            $('#extruderEngageButton').prop('disabled', false);             
        }
    })
    .fail(function() {
        new PNotify({
            title: 'Release Lever Command Succeed',
            text: context_message,
            type: 'error' // can be 'info', 'success', 'error', or 'notice'
        }); 
        $('#releaseButton').prop('disabled', false);
        $('#engageButton').prop('disabled', false);              
    });
}



function ReleaseLever(data) {
    var self = this;
    console.log('In ReleaseLever');
    console.log("data:", data);
    // The release lever has a single servo:
    self.servo = new Servo(data.servo);    
}
