/**
 * Knockout Custom Binding: bitCheckboxes
 * 
 * Description:
 * This custom binding is designed to represent the least significant bits of an observable integer
 * as a series of checkboxes. When a checkbox is toggled by the user, it updates the corresponding
 * bit in the observable integer. Similarly, any updates to the observable integer will reflect 
 * changes in the state of the checkboxes.
 * 
 * Usage:
 * To use the custom binding, bind an element in the following manner:
 * 
 * <div data-bind="bitCheckboxes: yourObservableInteger, numBits: numberOfBitsToShow"></div>
 * 
 * - `yourObservableInteger`: An observable containing an integer value whose bits you want to represent as checkboxes.
 * - `numberOfBitsToShow`: An optional attribute specifying the number of least significant bits to display as checkboxes.
 *                          Defaults to 3 if not provided.
 * 
 * CSS Styling:
 * Each checkbox created by the custom binding is assigned the CSS class "bits-checkbox". This allows for
 * targeted styling of these checkboxes in your CSS:
 * 
 * .bits-checkbox {
 *     // your custom styles here
 * }
 * 
 * Example:
 * If the observable holds the integer value 5 (which is represented as '101' in binary) and `numBits` is set to 3,
 * the custom binding will generate three checkboxes with the first and third checkboxes being checked (corresponding to the '1's).
 */




ko.bindingHandlers.bitCheckboxes = {
    init: function(element, valueAccessor, allBindings) {
        // Get the integer value and the number of bits to display
        const value = ko.unwrap(valueAccessor());
        const numBits = allBindings.get('numberOfBitsToShow') || 3;

        // Convert the integer value to a binary string and slice to keep the lower bits
        const binaryStr = value.toString(2).padStart(numBits, '0').slice(-numBits);
        console.log("In bitCheckboxes init value:", toI2cAddress(value), "bits:", value.toString(2), "binaryStr", binaryStr);

        // Create checkboxes based on the bit values
        for(let i = 0; i < numBits; i++) {
            const checkbox = document.createElement('input');
            checkbox.type = "checkbox";
            checkbox.className = "bits-checkbox";  // Adding the CSS class
            
            // Set checkbox to checked if the corresponding bit is 1
            checkbox.checked = binaryStr[i] === '1';

            const bitIndex = numBits - 1 - i;
            
            // Event listener to handle checkbox changes
            checkbox.addEventListener('change', function() {
                const currentValue = ko.unwrap(valueAccessor());
                console.log("In bitCheckboxes change event listener, currentValue:", toI2cAddress(currentValue), "bits:", currentValue.toString(2));
                var newValue;
                if (checkbox.checked) {
                    console.log("Checkbox is checked for bitIndex", bitIndex);
                    newValue = currentValue | (1 << bitIndex);
                } else {
                    console.log("Checkbox is not checked for bitIndex", bitIndex);
                    newValue = currentValue & ~(1 << bitIndex);
                }
                console.log("In bitCheckboxes change event listener, newValue:", toI2cAddress(newValue), "bits:", newValue.toString(2));
                valueAccessor()(newValue);
            });

            element.appendChild(checkbox);
        }
    },
    update: function(element, valueAccessor, allBindings) {
        console.log("In bitCheckboxes update valueAccessor():", toI2cAddress(valueAccessor()), "bits:", valueAccessor().toString(2));
        // Clear the existing checkboxes
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
        // Reinitialize with the new value
        ko.bindingHandlers.bitCheckboxes.init(element, valueAccessor, allBindings);
    }
};


