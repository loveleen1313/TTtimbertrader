


function calculateSubtotal() {
  // Get all the input elements with name="amount[]"
  var amountInputs = document.getElementsByName("amount[]");
  console.log(amountInputs.length);

  // Initialize total amount
  var totalAmount = 0;

  // Loop through each input and add its value to totalAmount
  for (var i = 0; i < amountInputs.length; i++) {
    var amountValue = parseFloat(amountInputs[i].value) || 0; // Parse value to a float or default to 0
    totalAmount += amountValue;
  }

  // Display the total amount in the subtotal div
  console.log(totalAmount.toFixed(2)); // Displaying with 2 decimal places
}

    let rowCounter = 1; // Counter for unique IDs

    function handleAutocompleteInputEvent(itemInput, row) {
      itemInput.addEventListener("input", function () {
        handleAutocomplete(itemInput, row);
      });
    }

    document.addEventListener("DOMContentLoaded", function () {
      // Set default value for the initial row
      const firstDatetimeInput = document.querySelector('input[name="datetime[]"]');
      setDefaultDatetime(firstDatetimeInput);

      const firstItemInput = document.querySelector('input[name="item[]"]');
      const firstRow = document.querySelector('.form-row');
      handleAutocompleteInputEvent(firstItemInput, firstRow);
    });

    function addRow() {
      const formRows = document.getElementById('form-rows');
      const newRow = document.createElement('tr');
      newRow.className = 'form-row';

      // Get the current date and time
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const hours = String(currentDate.getHours()).padStart(2, '0');
      const minutes = String(currentDate.getMinutes()).padStart(2, '0');

      const currentDatetime = `${year}-${month}-${day}T${hours}:${minutes}`;

      newRow.innerHTML = `
      <td class="serial-number border-gray-300 p-2 rounded-md focus:outline-none focus:border-blue-500">${++rowCounter}</td>
<td>
<input
type="datetime-local"
name="datetime[]"
required
class="border border-gray-300 p-2 rounded-md focus:outline-none focus:border-blue-500"
value="${currentDatetime}" 
>
</td>

<td>
<input class="border border-gray-300 p-2 rounded-md focus:outline-none focus:border-blue-500" type="text" name="item[]" placeholder="SELECT ITEM" required>
<div id="newAutocompleteDropdown" class="new-autocomplete-dropdown absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-md">
<!-- Change the id and class name above -->
</td>


<td>
<input
type="text"
name="quantity[]"
required
placeholder="Quantity"
class="border border-gray-300 p-2 rounded-md focus:outline-none focus:border-blue-500"
>
</td>

<td>
<input
type="text"
name="rent[]"
placeholder="RATE"
class="border border-gray-300 p-2 rounded-md focus:outline-none focus:border-blue-500"

>
</td>

<td>
<input
type="text"
name="amount[]"
placeholder="TOTAL"
class="border border-gray-300 p-2 rounded-md focus:outline-none focus:border-blue-500"
>
</td>

<td>
<button type="button" class="delete-button" onclick="deleteRow(this)">
<i class="fa-solid fa-trash-can"></i> Delete
</button>
</td>

      `;
      formRows.appendChild(newRow);

      // Update the new item input value
      const newItemInput = newRow.querySelector('input[name="item[]"]');
      handleAutocompleteInputEvent(newItemInput, newRow);
    }
    
    function deleteRow(button) {
      const formRows = document.getElementById('form-rows');
      const rows = formRows.getElementsByClassName('form-row');
      const row = button.closest('.form-row');
      const serialNumberCell = row.querySelector('.serial-number');

      // Update the serial numbers after deleting a row
      for (let i = Array.from(rows).indexOf(row) + 1; i < rows.length; i++) {
        const serialNumberCell = rows[i].querySelector('.serial-number');
        serialNumberCell.textContent = i;
      }

      rowCounter--;

      formRows.removeChild(row);
    }

    function handleAutocomplete(autocompleteInput, row) {
      const autocompleteDropdown = row.querySelector('.new-autocomplete-dropdown');
  const rentInput = row.querySelector('input[name="rent[]"]');
  const amountInput = row.querySelector('input[name="amount[]"]');
  const quantityInput = row.querySelector('input[name="quantity[]"]');
  console.log(autocompleteDropdown);

  const inputValue = autocompleteInput.value.trim();
  if (inputValue === "") {
    autocompleteDropdown.innerHTML = "";
    rentInput.value = ""; // Clear rent if item name is empty
    amountInput.value = ""; // Clear amount if item name is empty
    return;
  }

  const timestamp = new Date().getTime();
  const url = `/itemname/${inputValue}?_=${timestamp}`;

  axios.get(url)
    .then(function (response) {
      const data = response.data;
      
      const autocompleteItems = data.map(item => `
        <div class="autocomplete-item">
          <span class="autocomplete-name">${item.itemName}</span>
          <span class="autocomplete-address">${item.totalQuantity ? `(${item.totalQuantity} in stock)` : '(No stock)'}</span>
        </div>`
      ).join("");

      autocompleteDropdown.innerHTML = autocompleteItems;

      const autocompleteItemElements = document.querySelectorAll(".autocomplete-item");
      autocompleteItemElements.forEach(itemElement => {
        itemElement.addEventListener("click", function () {
          const selecteditemName = itemElement.querySelector('.autocomplete-name').innerText;
          const selecteditem = data.find(client => client.itemName === selecteditemName);

          if (selecteditem) {
            autocompleteInput.value = selecteditem.itemName + (selecteditem.totalQuantity ? ` (${selecteditem.totalQuantity} in stock)` : '');
            rentInput.value = selecteditem.rentPrice;
            if (selecteditem.itemCategory == 1) {
    // Assuming you want to set quantity to 1 if itemCategory is 1
    quantityInput.value = 1;
  }
            amountInput.value = calculateAmount(row);
            autocompleteDropdown.innerHTML = "";
          } else {
            console.warn("Item not found for selected name:", selecteditemName);
          }
        });
      });
    })
    .catch(function (error) {
      console.error("Error fetching data:", error);
    });
}


    function calculateAmount(row) {
      const quantity = parseFloat(row.querySelector('input[name="quantity[]"]').value) || 0;
      const rent = parseFloat(row.querySelector('input[name="rent[]"]').value) || 0;
      return (quantity * rent).toFixed(2);
    }

    function setDefaultDatetime(datetimeInput) {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const hours = String(currentDate.getHours()).padStart(2, '0');
      const minutes = String(currentDate.getMinutes()).padStart(2, '0');

      const currentDatetime = `${year}-${month}-${day}T${hours}:${minutes}`;
      datetimeInput.value = currentDatetime;
    }

    document.addEventListener("click", function (event) {
      const autocompleteInputs = document.querySelectorAll('input[name="item[]"]');
      const autocompleteDropdowns = document.querySelectorAll('.autocomplete-dropdown');

      for (let i = 0; i < autocompleteInputs.length; i++) {
        if (!autocompleteInputs[i].contains(event.target) && !autocompleteDropdowns[i].contains(event.target)) {
          autocompleteDropdowns[i].innerHTML = "";
        }
      }
    });

    // Event listener for dynamically updating amount on input change
    document.addEventListener("input", function (event) {
      const inputName = event.target.name;
      if (inputName === "quantity[]" || inputName === "rent[]") {
        const row = event.target.closest('.form-row');
        const amountInput = row.querySelector('input[name="amount[]"]');
        amountInput.value = calculateAmount(row);
      }
    });
    var a = ['','one ','two ','three ','four ', 'five ','six ','seven ','eight ','nine ','ten ','eleven ','twelve ','thirteen ','fourteen ','fifteen ','sixteen ','seventeen ','eighteen ','nineteen '];
var b = ['', '', 'twenty','thirty','forty','fifty', 'sixty','seventy','eighty','ninety'];

function inWords(num) {
    if ((num = num.toString()).length > 9) return 'overflow';
    n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return; 
    var str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])  : '';
    return str.trim();
}

document.getElementById('advanceVariable').oninput = function () {
    var inputValue = document.getElementById('advanceVariable').value;
    console.log(inputValue);
    if (inputValue == 0) {
   document.getElementById('result').textContent = ' Zero rupees only/NIL';
} else if (inputValue.trim() === '') {
        // Check for an empty string after trimming whitespace
        document.getElementById('result').textContent = ' '; // 
} else {
   document.getElementById('result').textContent = inWords(inputValue) + ' rupees only ';
}

};




