
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @media print {
              .print-hidden {
                display: none;
              }
            }
            
            .print-button {
              background-color: #4CAF50; /* Green */
              border: none;
              color: white;
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 4px 2px;
              cursor: pointer;
            }
          </style>
          
          <button onclick="window.print()" class="print-hidden" id="print-button">Print</button>
          <button onclick="window.location.href='/ttreceiptall'" class="print-hidden" id="receipt-button">All receipt</button>
          <button onclick="window.location.href='/receipt1234'" class="print-hidden" id="receipt-button">Create New receipt</button>
        
           
          
          <script>
            // Automatically trigger the print function when the page loads
            window.onload = function() {
              document.getElementById('print-button').click();
            };
          </script>
        <style>
            body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 20px;
        }
        img {
            width: 70px;
            height: auto; 
        }
        .receipt {
            border: 1px solid #1f1f1f;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            font-size: 28px;
            margin-bottom: 20px;
            margin-top: 10px;
        }

     

        .info {
            margin-bottom: 20px;
            display: flex;
            font-size: 20px;
        }
        .serialinfo {
          margin-left: 240px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th, td {
            border: 1px solid #000000;
            padding: 10px;
            text-align: left;
            font-size: 20px;
        }

       

        .total {
            margin-top: 20px;
            text-align: right;
            font-weight: bold;
            font-size: 20px;
        }
        @media print {
            button {
                display: none;
            }
        }
    </style>
    <title>Construction Material Rental Receipt</title>
</head>
<body>

    <div class="receipt">
        <div class="logo">

        </div>
        <div class="header1">
            <img src="/images/TT-remove.png" alt="">
            <div id="billToggle" style="font-size: 24px; cursor: pointer;">Running Bill</div>

            <script>
              document.getElementById("billToggle").addEventListener("click", function() {
                const billText = this;
                billText.textContent = billText.textContent === "Running Bill" ? "Final Bill" : "Running Bill";
              });
            </script>
            
            

            <div>
                <div>Mob : 9971238816</div>
                <div>Mob : 9315792003</div>
            </div>
        </div>
        <style>
            .header1 {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .address {
        text-align: center;
    }
            
        </style>
        <div class="header">
             T.T. TIMBER & SCAFFOLDING TRADERS
        </div>
        <hr>
        <div class="address">
            Deals In: Scaffolding,Construction machine's , Farma , Monkey lift machine etc
          </div>
        <div class="address">
          Office :  J-324 Adarsh Colony opp.Hanuman mandir, N.I.T Faridabad
        </div>
        <div class="info">
            <% if (receiptEdit.receiptclientsitename) { %>
                <div>
                    <p>Customer's Name: <%= receiptEdit.receiptclientname.clientName %> / <%= receiptEdit.receiptclientsitename.clientNamesite %></p>
                    <p>Phone no: <%= receiptEdit.receiptclientname.phone %> / <%= receiptEdit.receiptclientsitename.phonesite %></p>
                    <p>Address: <%= receiptEdit.receiptclientname.address %> / <%= receiptEdit.receiptclientsitename.addresssite %></p>
                  
                </div>
            <% } else { %>
                <div>
                    <p>Customer's Name: <%= receiptEdit.receiptclientname.clientName %></p>
                    <p>Phone no: <%= receiptEdit.receiptclientname.phone %></p>
                    <p>Address: <%= receiptEdit.receiptclientname.address %></p>
                </div>
            <% } %>
            
        
        
        <div class="serialinfo">
            <p>Serial no: <strong><%= receiptEdit.receiptChallannumber %></p></strong>
            <p>Bill Date:
                <% 
                  // Get the current date
                  const today = new Date();
              
                  // Define the formatting options
                  const options = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };
              
                  // Format today's date
                  const formattedDate = today.toLocaleDateString('en-US', options);
                %>
                <%= formattedDate %>
              </p>
              
              
              
              </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>Start date</th>
                    <th>End date</th>
                    <th>Total days</th> 
                    <th>Quantity</th> 
                    <th>Rate</th> 
                    <th>Total</th>
                  </tr>
                  <% var final = 0; %>
            </thead>
            <tbody id="form-rows">
              <% let b = 1 %>
              <% receiptEdit.generalitemreceipt.forEach(item => { %>
                  <% let totalin = 0; %>
                  <% item.onngoing.forEach(itemm => { %>
                      <% totalin += parseInt(itemm.quantity, 10); %> 
                  <% }); %>
              
                  <% if (totalin == 0) { %>
                      <tr>
                          <td>
                              <%= b %><% b++ %>
                          </td>
                          <td>
                              <%= item.itemoutname %>
                          </td>
                          <td>
                            <%
                              // Format and set time components to 00:00:00 for the given date
                              const dateString1 = item.Dateandtime;
                              const dateObject1 = new Date(dateString1);
                              dateObject1.setUTCHours(0, 0, 0, 0);
                          
                              const formattedDateTime = dateObject1.toLocaleString('en-GB', {
                                timeZone: 'UTC',
                                day: 'numeric',
                                month: 'numeric',
                                year: 'numeric',
                                
                                hour12: false
                              });
                            %>
                            <%= formattedDateTime %>
                          </td>
                         
                              <td>
                                <%
                                  // Get the current date in IST
                                  const currentDate = new Date();
                                  const formattedDate = currentDate.toLocaleString('en-GB', {
                                    timeZone: 'Asia/Kolkata', // Set the timeZone to 'Asia/Kolkata' for IST
                                    day: 'numeric',
                                    month: 'numeric',
                                    year: 'numeric',
                                    hour12: false
                                  });
                                %>
                                <span style="color: red;">
                                  <%= formattedDate %>
                                </span>
                              </td>
                           
                          
                          <td>
                            <%
                              // Calculate the difference between the current date and the given date in milliseconds
                              const dateObject2 = new Date(dateString1);
                              dateObject2.setUTCHours(0, 0, 0, 0);
                          
                              const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
                              const currentDateMilliseconds = currentDate.getTime() + istOffset;
                              const dateObject2Milliseconds = dateObject2.getTime();
                              const millisecondsDifference = currentDateMilliseconds - dateObject2Milliseconds;
                          
                              let daysDifference = Math.floor(millisecondsDifference / (24 * 60 * 60 * 1000));
                              let hoursDifference = Math.floor((millisecondsDifference % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                              let minutesDifference = Math.floor((millisecondsDifference % (60 * 60 * 1000)) / (60 * 1000));
                              let secondsDifference = Math.floor((millisecondsDifference % (60 * 1000)) / 1000);
                          
                              // Adjust the differences to be within the correct range
                              if (secondsDifference >= 60) {
                                minutesDifference += Math.floor(secondsDifference / 60);
                                secondsDifference %= 60;
                              }
                          
                              if (minutesDifference >= 60) {
                                hoursDifference += Math.floor(minutesDifference / 60);
                                minutesDifference %= 60;
                              }
                          
                              if (hoursDifference >= 24) {
                                daysDifference += Math.floor(hoursDifference / 24);
                                hoursDifference %= 24;
                              }
                            %>
                            <%= daysDifference+1 %> days
                          </td>
                          <td>
                            <%= item.Quantity %>
                          </td>
                          <td>
                            <%= item.rent %>
                          </td>
                          <td>
                            
                            <% var bb =  item.Quantity * item.rent * (daysDifference+1) %>
    <%= bb %>
    <% final += bb; %>
                          </td>
                          
                          
                          
                          
                          
                          
                          
                          
                          
    
    
    
                      </tr>
                  <% } else if (totalin > 0) { %>
                    <% 
                      var checkno;
                      if (totalin == item.Quantity) {
                        checkno = item.onngoing.length;
                      } else {
                        checkno = item.onngoing.length + 1;
                      }  
                    %>
                    <% var workingquantity = item.Quantity %>
                    <% for (var i = 0; i< checkno; i++) { %>            
                    <tr>
                      <% if (i < item.onngoing.length) { %>
                        <% item.onngoing[i].quantity %>
                      <% } else { %>
                        
                      <% } %>
                      <td>
                        <%= b %><% b++ %>
                      </td>
                      <td>
                        <%= item.itemoutname %>
                      </td>
                      <%
                      let formattedDateTime, formattedDate;
                    
                      // Calculate the start date string based on the condition
                      let startDateStr;
                      if (i == 0) {
                        startDateStr = item.Dateandtime;
                      } else {
                        // Get the previous return date and add one day to it
                        const prevReturnDateStr = item.onngoing[i - 1].returndateAt;
                        const prevReturnDate = new Date(prevReturnDateStr);
                        prevReturnDate.setDate(prevReturnDate.getDate() + 1); // Add one day
                        startDateStr = prevReturnDate.toISOString(); // Convert back to string
                      }
                    
                      const startDate = new Date(startDateStr);
                      startDate.setUTCHours(0, 0, 0, 0);
                    
                      formattedDateTime = startDate.toLocaleString('en-GB', {
                        timeZone: 'UTC',
                        day: 'numeric',
                        month: 'numeric',
                        year: 'numeric',
                        hour12: false
                      });
                    
                      // Determine the end date or the current date
                      if (item.onngoing && item.onngoing[i] && item.onngoing[i].returndateAt) {
                        const endDateStr = item.onngoing[i].returndateAt;
                        const endDate = new Date(endDateStr);
                        
                        formattedDate = endDate;
                      } else {
                        formattedDate = new Date();
                      }
                    
                      // Function to calculate the time difference
                      function calculateTimeDifference(startDate, endDate) {
                        const millisecondsDifference = endDate.getTime() - startDate.getTime();
                        
                        const days = Math.floor(millisecondsDifference / (24 * 60 * 60 * 1000));
                        const hours = Math.floor((millisecondsDifference % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                        const minutes = Math.floor((millisecondsDifference % (60 * 60 * 1000)) / (60 * 1000));
                        const seconds = Math.floor((millisecondsDifference % (60 * 1000)) / 1000);
                        
                        return { days, hours, minutes, seconds };
                      }
                    
                      // Use formattedDate for the end date in the calculation
                      const { days, hours, minutes, seconds } = calculateTimeDifference(startDate, formattedDate);
                    %>
                    
                    <!-- Display the results in the table -->
                    <td><%= formattedDateTime %></td>
                    <td><%= formattedDate.toLocaleString('en-GB', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'numeric', year: 'numeric', hour12: false }) %></td>
                    <td>
                      <%= days+1 %> days 
                     
                    </td>
                    
                    
                    
    
                    
                    
    
                      <td>
                        <%= workingquantity %>
                        
                      </td>
    <td>
      <%= item.rent %>
    </td><td>
    
    <% var bb =  item.rent*workingquantity*(days+1) %>
    <%= bb %>
    <% final += bb; %>
    <% if (i < item.onngoing.length) { %>
      <% workingquantity -= item.onngoing[i].quantity %>
    <% } else { %>
      
    <% } %>
    </td>
    
                    </tr>
                    <% } %>
                  <% } %>
                  
              <% }); %>
              
            
    <% receiptEdit.farmaitemreceipt.forEach(item => { %> 
      <tr>
        <td>
          <%= b %><% b++ %> 
        </td>
        <td>
    Farma <%= item.length1farma %>X<%= item.length2farma %> (<%= item.heightfarma %>)
        </td>
        <td>  
          <%
          dateString1 = item.Dateandtimefarma;
          const dateObject1 = new Date(dateString1);
      
          const formattedDate1 = dateObject1.toLocaleString('en-GB', {
            timeZone: 'UTC', 
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour12: false,
          });
        %>
        <%= formattedDate1 %></td>
      
        <td>
          <%
            const currentDate = new Date();
            
            
        
            const formattedDate = currentDate.toLocaleString('en-GB', {
              timeZone: 'UTC',
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour12: false,
            });
          %>
          <span style=" color: red;">
            <%= formattedDate %>
          </span>
        </td>
    
      <td>
        <%
          const date1Milliseconds = dateObject1.getTime();
          const currentDateMilliseconds = currentDate.getTime();
          const daysDifference = Math.floor((currentDateMilliseconds - date1Milliseconds) / (24 * 60 * 60 * 1000));
        %>
    
        <%= daysDifference+2 %> days
      </td>
    <td>
      <%= item.noofsetsfarma %>
    </td>
    <td>
      <%= item.rentpersetfarma %>
    </td>
    <td>
      <% var bb =  item.rentpersetfarma*item.noofsetsfarma*(daysDifference + 2) %>
      <%= bb %>
      <% final += bb; %>
    </td>
      </tr>
      <% }); %>
    
      <% receiptEdit.scaffoldingitemreceipt.forEach(item => { %> 
        <tr>
          <td>
            <%= b %><% b++ %> 
          </td>
          <td onclick="makeEditable(this)">
  Scaffolding <%= item.lengthoutscaffolding %>'X<%= item.heightoutscaffolding %>'
</td>
<script>
  function makeEditable(td) {
    // Avoid editing if already an input
    if (td.querySelector('input')) return;

    const originalText = td.innerText;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalText;

    input.onblur = function () {
      td.innerText = input.value; // save edited text
      // Optionally, send AJAX to save to DB here
    };

    input.onkeydown = function (e) {
      if (e.key === 'Enter') input.blur(); // Save on Enter
      if (e.key === 'Escape') {
        td.innerText = originalText; // Revert on Esc
      }
    };

    td.innerText = ''; // clear cell
    td.appendChild(input);
    input.focus();
  }
</script>

          <td>  
            <%
            dateString1 = item.Dateandtimescaffolding;
            const dateObject1 = new Date(dateString1);
        
            const formattedDate1 = dateObject1.toLocaleString('en-GB', {
              timeZone: 'UTC', 
              day: 'numeric',
              month: 'numeric',
              year: 'numeric',
              hour12: false,
            });
          %>
          <%= formattedDate1 %></td>
        
          <td>
            <%
              const currentDate = new Date();
              
              
          
              const formattedDate = currentDate.toLocaleString('en-GB', {
                timeZone: 'UTC',
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour12: false,
              });
            %>
            <span style=" color: red;">
              <%= formattedDate %>
            </span>
          </td>
      
          <td>
            <%
              // Calculate the difference between the current date and the given date in milliseconds
              const dateObject2 = new Date(dateString1);
              dateObject2.setUTCHours(0, 0, 0, 0);
          
              const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
              const currentDateMilliseconds = currentDate.getTime() + istOffset;
              const dateObject2Milliseconds = dateObject2.getTime();
              const millisecondsDifference = currentDateMilliseconds - dateObject2Milliseconds;
          
              let daysDifference = Math.floor(millisecondsDifference / (24 * 60 * 60 * 1000));
              let hoursDifference = Math.floor((millisecondsDifference % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
              let minutesDifference = Math.floor((millisecondsDifference % (60 * 60 * 1000)) / (60 * 1000));
              let secondsDifference = Math.floor((millisecondsDifference % (60 * 1000)) / 1000);
          
              // Adjust the differences to be within the correct range
              if (secondsDifference >= 60) {
                minutesDifference += Math.floor(secondsDifference / 60);
                secondsDifference %= 60;
              }
          
              if (minutesDifference >= 60) {
                hoursDifference += Math.floor(minutesDifference / 60);
                minutesDifference %= 60;
              }
          
              if (hoursDifference >= 24) {
                daysDifference += Math.floor(hoursDifference / 24);
                hoursDifference %= 24;
              }
            %>
            <%= daysDifference+1 %> days
          </td>
      <td>
        <%= item.quantityscaffolding %>
      </td>
    
    
    <% if(daysDifference+1 <= item.numberofdayscaffolding) { %>
      <td>
        <%= item.rentmultipledayscaffolding %>
      </td>
    <% } else { %>
      <td>
        <%= item.rateafterdayscaffolding %>
      </td>
      <% } %>
    
     <% 
     
      if (daysDifference + 1 <= item.numberofdayscaffolding) { 
        bb = item.rentmultipledayscaffolding;
      } else { 
        bb = item.rateafterdayscaffolding * item.quantityscaffolding * (daysDifference + 1);
      }
    
    %>
    <td>
      <%= bb %><% final += bb; %>
    </td>
    
    
    
      
        </tr>
        <% }); %>
    
    
    <tfoot>
    
      <% if (receiptEdit.additionalcharges && receiptEdit.additionalcharges.length > 0) { %>
        <%
        // Initialize the combined string and total cost
        let combinedString = "";
        let totalCost = 0;
    
        // Build the combined string and accumulate the total cost
        receiptEdit.additionalcharges.forEach((itemmm, index) => {
            if (index > 0) {
                combinedString += " + ";
            }
            combinedString += itemmm.additionalchargesName + " (Rs " + itemmm.additionalchargesCost + ")";
            totalCost += parseFloat(itemmm.additionalchargesCost); // Assuming additionalchargesCost is a number or can be parsed as a float
        });
    
        // Add the total cost to the final amount
        final += totalCost;
        %>
    
        <tr>
          <td></td>
            <td colspan="6">Additional charges :  <%= combinedString %></td>
           
            <td> <%= totalCost %></td>
        </tr>
    <% } %>
    
    
      <tr id="totals-row">
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        
          <td><strong>Total:</strong></td>
          <td id="totalinout"><%= final %></td>
          
      </tr>
  
      
    </tfoot>
    
    
    
    
    
    
    </tbody>
            
        </table>
        <% let totalAmount = 0; %>

       
        <style>
            .flex {
                display: flex;
                
                align-items: center;
                
            }
            .checc {
               margin-top:20px;
                 margin-left: 220px;
                
            }
            .sign {
                 margin-top: 50px;
                
            }
        .Advance{
            margin-top: 10px;
            font-size: 21px;
            
         
        }
           
        </style>
        
        <div class="flex">
            <div class="Advance">              
                    <p><strong>TOTAL Rent till date :</strong> Rs <%= final %></p>
                    <p><span id="result">Result will be displayed here</span></p>
                    <% var finalsecurity = 0 %>

                    <% receiptEdit.moneyreceipt.forEach(item => { %>
                        <% if (item.inandout === 1) { %>
                            <% totalAmount += item.amount; %>
                        <% } else if (item.inandout === 0) { %>
                            <% totalAmount -= item.amount; %>
                        <% } %>
                    <% }); %>
                     <!-- Toggle Checkbox -->
<!-- Toggle Checkbox -->
<div class="no-print" style="margin-bottom: 10px;">
  <input type="checkbox" id="toggleSecurity">
  <label for="toggleSecurity">Show Security/Advance</label>
</div>

<!-- Security/Advance Section -->
<div id="securitySection" style="display: none;">
  <h3>Security/Advance: <%= totalAmount %></h3>
</div>

<!-- CSS to Hide Elements during Print -->
<style>
  @media print {
    .no-print {
      display: none !important;
    }
  }
</style>

<script>
  document.getElementById('toggleSecurity').addEventListener('change', function () {
  const securitySection = document.getElementById('securitySection');
  if (this.checked) {
    securitySection.style.display = 'block';
  } else {
    securitySection.style.display = 'none';
  }
});

</script>
            </div>
           
            <div class="checc">
                <div>For T.T. Timber Trader</div>
                <div class="sign"> Auth signature</div>
            </div>
        </div>
        
       
    </div>

    <script>
        var a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
        var b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
        
        function inWords(num) {
            if ((num = num.toString()).length > 9) return 'overflow';
            n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return; 
            var str = '';
            str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
            str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
            str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
            str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
            str += (n[5] != 0) ? ((str != '') ? 'And ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])  : '';
            return str.trim();
        }
        
        document.addEventListener('DOMContentLoaded', function () {
        var totalAmount = <%= final %> ;
        document.getElementById('result').textContent = 'Rupees ' + inWords(totalAmount) + ' Only ';
    });
    </script>
</body>
</html>
