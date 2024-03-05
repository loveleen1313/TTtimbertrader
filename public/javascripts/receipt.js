
    document.addEventListener("DOMContentLoaded", function () {
      const inp = document.querySelector("#inputusername");
      console.log(inp);
      const dropdown = document.getElementById("autocompleteDropdown");
      const inputAddress = document.getElementById("inputAddress");
      const inputPhone = document.getElementById("inputPhone");
      const inputcomment = document.getElementById("inputcomment");

      inp.addEventListener("input", function () {
        const inputValue = inp.value.trim();
        if (inputValue === "") {
          dropdown.innerHTML = "";
          inputAddress.value = "";
          inputPhone.value = "";
          inputcomment.value = "";
          return;
        }

        const timestamp = new Date().getTime();
        const url = `/username/${inputValue}?_=${timestamp}`;

        axios.get(url)
          .then(function (response) {
            const data = response.data;
            console.log(data);
            const autocompleteItems = data.map(item => `
              <div class="autocomplete-item">
                <span class="autocomplete-name">${item.clientName}</span>
                <span class="autocomplete-address">${item.address || 'No address'}</span>
              </div>`
            ).join("");

            dropdown.innerHTML = autocompleteItems;

            const autocompleteItemElements = document.querySelectorAll(".autocomplete-item");
            autocompleteItemElements.forEach(item => {
              item.addEventListener("click", function () {
  const selectedClientName = item.querySelector('.autocomplete-name').innerText;
  const selectedClient = data.find(client => client.clientName === selectedClientName);

  if (selectedClient) {
    inp.value = selectedClient.clientName;
    inputAddress.value = selectedClient.address || "";
    inputPhone.value = selectedClient.phone || "";
    inputcomment.value = selectedClient.comment || "";
    console.log("Updated values:", inputAddress.value, inputPhone.value, inputcomment.value);
    dropdown.innerHTML = "";
  } else {
    console.warn("Client not found for selected name:", selectedClientName);
  }
});

            });
          })
          .catch(function (error) {
            console.error("Error fetching data:", error);
          });
      });

      inp.addEventListener("keydown", function (event) {
        const autocompleteItemElements = document.querySelectorAll(".autocomplete-item");
        if (event.key === "ArrowDown" && autocompleteItemElements.length > 0) {
          autocompleteItemElements[0].focus();
        } else if (event.key === "ArrowUp" && autocompleteItemElements.length > 0) {
          autocompleteItemElements[autocompleteItemElements.length - 1].focus();
        }
      });

      document.addEventListener("click", function (event) {
        if (!inp.contains(event.target) && !dropdown.contains(event.target)) {
          dropdown.innerHTML = "";
        }
      });
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Get the current date and time in the format expected by datetime-local input
        function getCurrentDateTime() {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        // Set the current date and time to the input field
        const datetimeInput = document.getElementById('datetimereceipt');
        datetimeInput.value = getCurrentDateTime();
    });
 