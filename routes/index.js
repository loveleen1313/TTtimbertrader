var express = require('express');
var router = express.Router();
const userModel = require('./users');
const postModel = require('./post');
const productModel = require('./product');
const passport = require('passport');
const localStrategy = require('passport-local');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('./multer');
const Client = require('./client');
const Clientsite = require('./clientsite');
const Contact = require('./contact');
const phoneModel = require('./phone');
const generalout = require('./generalout');
const scaffoldingout = require('./scaffoldingout');
const farmaout = require('./farmaout');
const farmain = require('./farmain');
const ttreceipt = require('./reciept');
const moneyinandout = require('./moneyinandout');
const Daybook = require('./daybook');
const returnitem = require('./returnitem');
const todo = require('./todo');
const transport = require('./transport');
const pooja = require('./pooja');
const deliverychallan = require('./deliverychallan')
const itembuy = require('./itembuy');
const scaffoldingin = require('./scaffoldingin');
const additionalcharge = require('./additionalcharges');
const puppeteer = require('puppeteer');
const ejs = require('ejs'); 
const Labour = require('./Labour');
const Sale = require('./Sale');
const buyitem = require('./buyitem');
 const Quotation = require("./quotation");





// GET: Render form to add new supplier

router.get('/deleteclient/:id', async (req, res) => {
  try {
    console.log(req.params.id);
    await Sale.findByIdAndDelete(req.params.id);
    res.redirect('/saleall'); // or wherever your client list page is
  } catch (err) {
    console.error('Error deleting client:', err);
    res.status(500).send('Server Error');
  }
});

router.post("/receipt/:id/toggle-pin", async (req, res) => {
  const { id } = req.params;

  try {
    const receipt = await ttreceipt.findById(id);

    if (!receipt) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    receipt.pinned = !receipt.pinned;
    await receipt.save();

    res.json({ success: true, pinned: receipt.pinned });
  } catch (error) {
    console.error("Toggle Pin Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});





// GET: Render form to edit an existing supplier

// Get all transport entries
router.get('/api/transports', async (req, res) => {
  try {
    const transports = await transport.find({});
    res.json(transports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load transports' });
  }
});
// Update receipt's transportinfo
router.post('/api/update-transportinfo/:id', async (req, res) => {
  try {
    const { transportinfo } = req.body;
    await ttreceipt.findByIdAndUpdate(req.params.id, {
      transportinfo,
      transport: 'on', // optional: mark that transport is used
      transportdate: new Date()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update receipt transport info' });
  }
});

// POST: Update an existing supplier using product arrays


// POST: Delete a supplier






router.get('/sale', (req, res) => {
  res.render('sale');
});

router.post('/sale', async (req, res) => {
  try {
    console.log("Form Data Received:", req.body);

    let name = req.body.Name && req.body.Name.trim() !== "" ? req.body.Name : "Cash";
    const address = req.body.Address;
    const phone = req.body.Phone;
    const datetime = new Date(req.body.datetimereceipt + 'Z');

    const itemNames = ensureArray(req.body['item[]']);
    const quantities = ensureArray(req.body['quantity[]']);
    const rents = ensureArray(req.body['rent[]']);

    let finalAmount = 0;
    const items = [];

    // ✅ Process items
    for (let i = 0; i < itemNames.length; i++) {
      if (itemNames[i] && quantities[i] && rents[i]) {
        const cleanedItemName = itemNames[i].replace(/\s*\(\-?\d+\s*in\s*stock\)/i, '');
        const quantity = parseInt(quantities[i]);
        const price = parseFloat(rents[i]);

        if (isNaN(quantity) || isNaN(price)) continue;

        items.push({
          itemName: cleanedItemName,
          quantity,
          price
        });

        finalAmount += quantity * price;
      }
    }

    if (items.length === 0) {
      console.error("No valid items to save.");
      return res.status(400).send("No valid items to save.");
    }

    // ✅ Create base sale entry
    const sale = new Sale({
      name,
      address,
      phone,
      date: datetime,
      items
    });

    await sale.save();

    // ✅ Handle Additional Charges
    const additionalChargesNames = ensureArray(req.body['Additionalchargesname[]']);
    const additionalChargesAmounts = ensureArray(req.body['AdditionalchargesAmount[]']);
    const additionalCharges = [];

    for (let i = 0; i < additionalChargesNames.length; i++) {
      const chargeName = additionalChargesNames[i];
      const chargeAmount = parseFloat(additionalChargesAmounts[i]);

      if (!chargeName || isNaN(chargeAmount)) continue;

      const charge = await additionalcharge.create({
        additionalchargesName: chargeName,
        additionalchargesCost: chargeAmount,
        salett: sale._id
      });

      additionalCharges.push(charge._id);
      finalAmount += chargeAmount;
    }

    if (additionalCharges.length > 0) {
      sale.additionalcharges = additionalCharges;
      await sale.save();
    }

    // ✅ Create money-in entry (cash only)
   // ✅ Create money-in entry
if (!isNaN(finalAmount) && !isNaN(datetime.getTime())) {
  const moneyIn = await moneyinandout.create({
  inandout: '1',
  amount: finalAmount,
  Dateandtimeinandout: datetime,
  modeofpayment: req.body.modeofpayment || 'cash',
  transactionType: 'Business Sale',
  comment: 'Sale receipt ' + (req.body.serialNumber || '') + ' ' + name
});

  sale.moneyreceipt = [moneyIn._id];
  await sale.save();
}
    console.log('✅ Sale saved successfully:', sale);
    res.redirect(`/printsale/${sale.id}`);

  } catch (error) {
    console.error("❌ Error saving sale data:", error);
    res.status(500).send("Error saving sale data.");
  }
});





router.get('/printsale/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await Sale.findOne({ _id: receiptId })
    .populate('items')
    .populate('additionalcharges');
    
console.log(receiptEdit);
    if (receiptEdit) {
      res.render('printsale', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/printgstsale/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await Sale.findOne({ _id: receiptId })
    .populate('items')
    .populate('additionalcharges');
    
console.log(receiptEdit);
    if (receiptEdit) {
      res.render('printgstsale', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post("/editCHANGEadditionalcharges/:id", async (req, res) => {
  try {
      const { additionalchargesName, additionalchargesCost } = req.body;
      const updatedCharge = await additionalcharge.findByIdAndUpdate(
          req.params.id,
          { additionalchargesName, additionalchargesCost },
          { new: true }
      );

      if (!updatedCharge) {
          return res.status(404).json({ error: "Charge not found" });
      }

      res.json(updatedCharge);
  } catch (error) {
      console.error("Error updating charge:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/update-client-receipts", async (req, res) => {
  try {
    // Fetch all receipts with only required fields
    const receipts = await ttreceipt.find({}, { _id: 1, "receiptclientname._id": 1 });

    // Group receipts by client ID
    const clientReceiptsMap = receipts.reduce((acc, receipt) => {
      const clientId = receipt.receiptclientname?._id;
      if (clientId) {
        acc[clientId] = acc[clientId] || [];
        acc[clientId].push(receipt._id);
      }
      return acc;
    }, {});

    // Prepare bulk update operations
    const bulkOps = Object.entries(clientReceiptsMap).map(([clientId, receiptIds]) => ({
      updateOne: {
        filter: { _id: clientId },
        update: { $set: { receiptinit: receiptIds } }
      }
    }));

    // Perform bulk update
    if (bulkOps.length > 0) {
      await Client.bulkWrite(bulkOps);
    }

    res.json({ success: true, message: "All clients updated successfully" });
  } catch (error) {
    console.error("Error updating clients:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.get('/', function(req, res, next) {
  res.redirect('/login');
});

router.get('/login', function(req, res, next) {
  res.render('login', {
    error: req.flash('error')
  });
});

router.get('/signup', function(req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});



router.get('/profile', isLoggedIn , async function(req, res, next){
  const  user = await userModel.findOne({username : req.session.passport.user})
  .populate("posts");
  console.log(user);
   res.render('profile', {user});
});


router.get('/detailemployee/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    const receiptEdit = await Labour.findById(receiptId).populate('advances');

    if (!receiptEdit) {
      return res.status(404).send('Employee not found');
    }

    res.render('detailemployee', { receiptEdit });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/labouraccount', async (req, res) => {
  const labours = await Labour.find({});
  res.render('labouraccount', { labours });
});


router.get('/newlabour', (req, res) => {
  res.render('newlabour');
});

router.get('/editlabour/:id', (req, res) => {

  const receiptId = req.params.id;
  
  res.render('editlabour');



});

router.get('/qailemployee/:id', async (req, res) => {
  const receiptId = req.params.id;
  const receiptEdit = await Labour.findOne({ _id: receiptId })
  res.render('detailemployee',{ receiptEdit });
});


router.post('/newlabour', async (req, res) => {
  console.log(req.body);
  const labour = await Labour.create({
    name: req.body.labourname,
    details: req.body.labourdetails,
    phoneno: req.body.phno,
    address: req.body.address,
    salary: req.body.salary,


  });
  await labour.save();
  res.redirect('/labouraccount');
});



router.post('/upload', isLoggedIn, upload.single('file'), async function(req, res){
  if (!req.file) {
    return res.status(400).send('No files were uploaded.');
  }
  
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    const post = await postModel.create({
      image: req.file.filename,
      postText: req.body.filecaption,
      Users: user._id,
    });

    user.posts.push(post._id);
    await user.save();

    res.send('doneee');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

  
  

router.get('/feed', isLoggedIn , function(req, res, next){
  res.render('feed');
});



router.get('/ttclient', function(req, res, next){
  res.render('clientt');
});





router.post('/ttclient', async function(req, res) {
  try {
    const clientData = await Client.create({
      clientName: req.body.clientName,
      phone: req.body.phone,
      address: req.body.address,
      Proffession: req.body.Proffession,
      comment: req.body.comment,
      worksWith: req.body.worksWith,
    });

    console.log('Client updated:', clientData);
    res.redirect('/ttclient');
  } catch (error) {
    console.error('Error updating client:', error);
    res.render('error', { error });
  }
});

router.post('/editmoney/:id', async (req, res) => {
  const { id } = req.params;
  let { amount, comment, modeofpayment, transactionType } = req.body;

  // Append (E) to indicate that the comment has been edited
  comment = String(comment || '').trim();

  if (comment && !comment.endsWith('(E)')) {
    comment += ' (E)';
  }

  console.log('Edit money:', {
    id,
    amount,
    comment,
    modeofpayment,
    transactionType
  });

  try {
    const updatedItem = await moneyinandout.findByIdAndUpdate(
      id,
      {
        amount,
        comment,
        modeofpayment,
        transactionType
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedItem) {
      return res.status(404).json({
        error: 'Item not found'
      });
    }

    res.json(updatedItem);

  } catch (err) {
    console.error('Error editing money transaction:', err);

    res.status(500).json({
      error: 'Failed to update transaction'
    });
  }
});





router.get('/ttdashboard', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user
    });

    let daysAgo = parseInt(req.query.daysAgo) || 0;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const startOfDay = new Date(today);
    startOfDay.setUTCDate(today.getUTCDate() - daysAgo);

    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    // Get transactions for selected day
    const receiptEdit = await moneyinandout.find({
      Dateandtimeinandout: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).lean();

    // Check transaction types received from MongoDB
    console.log(
      'DASHBOARD TRANSACTION TYPES:',
      receiptEdit.map(item => ({
        id: item._id,
        transactionType: item.transactionType
      }))
    );

    const alldaybook = await Daybook.find({
      Dateandtimedaybook: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    });

    // Get last 7 days' payments
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);

    const last7DaysPayments = await moneyinandout.find({
      Dateandtimeinandout: {
        $gte: sevenDaysAgo,
        $lt: today
      }
    });

    res.render('dashboardtt', {
      receiptEdit,
      alldaybook,
      user,
      last7DaysPayments,
      daysAgo,
      moment
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    next(err);
  }
});


router.get('/receipts/count-by-phone/:phone', isLoggedIn, async (req, res) => {
  try {
    const phone = String(req.params.phone).trim();

    const clients = await Client.find({
      phone: phone
    })
    .select('receiptinit')
    .lean();

    const totalReceipts = clients.reduce(
      (total, client) => total + (client.receiptinit || []).length,
      0
    );

    res.json({
      totalReceipts,
      totalSites: clients.length
    });

  } catch (error) {
    console.error('Receipt count error:', error);
    res.status(500).json({
      error: 'Unable to calculate receipt count'
    });
  }
});


router.get('/totalmoneydate', isLoggedIn, async function(req, res, next) {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user
    });

    const receiptEdit = await moneyinandout.find({});

    res.render('viewmoneytt', {
      receiptEdit,
      user
    });

  } catch (err) {
    next(err);
  }
});


router.get('/totalmoneychart', isLoggedIn, async function(req, res, next) {
  try {
    const receiptEdit = await moneyinandout.find({ });

    await Daybook.create({
      daybookinandout: 'Cash chart accessed to view total money in and out summary.',
      Dateandtimedaybook: moment.utc().toDate(),
      maker: req.user.username  // ✅ correct way to access logged-in user
    });

    res.render('viewcashchart', { receiptEdit });
  } catch (err) {
    console.error('Error in /totalmoneychart:', err);
    res.status(500).send("Internal Server Error");
  }
});



router.get('/ttproduct', isLoggedIn , function(req, res, next){
  res.render('product');
});


router.post('/register', function(req, res){
  const { username, email, fullname} = req.body;
  const userData = new userModel({username, email, fullname });
  userModel.register(userData, req.body.password)
  .then(function(){
    passport.authenticate("local")(req, res , function(){
      res.redirect("/profile");
    })
  })
});

router.post('/login', (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect('/login');
    }
    req.logIn(user, async (err) => {
      if (err) {
        return next(err);
      }
      const moment = require('moment-timezone');

      try {
        // Get current time in India (IST)
        const datetimeIST = moment.tz('Asia/Kolkata').format();
      
        // Convert to UTC format
        const datetimeUTC = moment(datetimeIST).utc().format();
      
        const daybookEntry = await Daybook.create({
          daybookinandout: 'Account login ' + user.fullname,
          Dateandtimedaybook: datetimeUTC,
          maker: user.username,
        });
      
        console.log('Daybook entry created:', daybookEntry);
      } catch (error) {
        console.error('Error creating daybook entry:', error);
      }
      
      return res.render('welcome', {
    name: req.body.username || 'there',
    redirectTo: '/ttdashboard'
});
    });
  })(req, res, next);
});



router.get('/logout', function(req, res, next) {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/login');
  });
});



function isLoggedIn(req, res, next){
       if(req.isAuthenticated()) return next();
       res.redirect('/login');
};


 router.post('/ttproduct' , async function(req, res){
  try {
     const product = await productModel.create({
        itemName: req.body.itemName,
        rentPrice: req.body.rentprice,
        sellingPrice: req.body.sellingprice,
        totalQuantity:req.body.totalquantity,
        alertQuantity: req.body.alertquantity,
        buyingPrice: req.body.buyinggprice,
        workingQuantity: req.body.Workingquantity,
        comment: req.body.Comment,
        itemCategory : req.body.itemCategory,
        supplier: req.body.supplier,
        useIn : req.body.usein,
});

     
     res.redirect('/ttproduct');
  } catch (error) {
     // Handle error, e.g., send an error response
     res.status(500).send('Internal Server Error');
  }
});
  
router.get('/ttproductall', isLoggedIn , async function (req, res) {
  let allproducts = await productModel.find();
  res.render( 'productall', {allproducts} );
 
});

router.get('/lastallaccount/:username', isLoggedIn, async function (req, res) {
  try {
    // Find the client by ID (username param is actually an ID here)
    const client = await Client.findById(req.params.username);
    
    if (!client) {
      return res.status(404).send('Client not found');
    }

    // Collect all receipt IDs from the client schema
    const receiptIds = client.receiptinit;

    if (!receiptIds || receiptIds.length === 0) {
      return res.render('receiptall', { allproducts: [], totalNonFiltered: 0 });
    }

    // ✅ Add daybook entry here
    await Daybook.create({
      daybookinandout: `All past receipts accessed for client ${client.clientName}, showing ${receiptIds.length} total entries.`,
      Dateandtimedaybook: moment.utc().toDate(),
      maker: req.user.username
    });

    let allproducts = [];

    // Loop through each receipt ID and retrieve the corresponding receipt data
    for (const receiptId of receiptIds) {
      const receipt = await ttreceipt.findById(receiptId)
        .populate('receiptclientname')
        .populate('receiptclientsitename')
        .populate('scaffoldingitemreceipt')
        .populate({
          path: 'generalitemreceipt',
          populate: {
            path: 'onngoing',
            model: 'returnitem',
          }
        })
        .populate('moneyreceipt')
        .populate('additionalcharges')
        .populate('farmaitemreceipt');

      if (receipt) {
        allproducts.push(receipt);
      }
    }

    // Send the retrieved receipts to the frontend
    res.render('receiptall', {
      allproducts,
      totalNonFiltered: allproducts.length
    });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/lastallaccountphone/:phone', isLoggedIn, async function (req, res) {
  try {
    const phone = String(req.params.phone || '').trim();

    if (!phone) {
      return res.status(400).send('Phone number is required');
    }

    // Find all client records having the same phone number
    const clients = await Client.find({
      phone: phone
    }).select('clientName address phone receiptinit');

    if (!clients || clients.length === 0) {
      return res.status(404).send('No clients found for this phone number');
    }

    // Collect receipt IDs from all matching clients.
    // Keep the associated client/site details.
    const receiptMap = new Map();

    clients.forEach(client => {
      (client.receiptinit || []).forEach(receiptId => {

        const id = String(receiptId);

        // Avoid displaying the same receipt twice
        if (!receiptMap.has(id)) {
          receiptMap.set(id, {
            receiptId: receiptId,
            clientName: client.clientName,
            address: client.address
          });
        }
      });
    });

    const receiptRecords = Array.from(receiptMap.values());

    if (receiptRecords.length === 0) {
      return res.render('receiptall', {
        allproducts: [],
        totalNonFiltered: 0
      });
    }

    // Record dashboard activity
    await Daybook.create({
      daybookinandout:
        `All past receipts accessed for phone ${phone}, ` +
        `covering ${clients.length} client/site records and ` +
        `${receiptRecords.length} total receipts.`,

      Dateandtimedaybook: moment.utc().toDate(),
      maker: req.user.username
    });

    let allproducts = [];

    // Retrieve all receipts using the same population
    // logic as your existing receipt-history route.
    for (const record of receiptRecords) {

      const receipt = await ttreceipt.findById(record.receiptId)
        .populate('receiptclientname')
        .populate('receiptclientsitename')
        .populate('scaffoldingitemreceipt')
        .populate({
          path: 'generalitemreceipt',
          populate: {
            path: 'onngoing',
            model: 'returnitem'
          }
        })
        .populate('moneyreceipt')
        .populate('additionalcharges')
        .populate('farmaitemreceipt');

      if (receipt) {

        const receiptData = receipt.toObject();

        // Attach the Client document from which
        // this receipt was collected.
        receiptData.sourceClientName = record.clientName;
        receiptData.sourceClientAddress = record.address;

        allproducts.push(receiptData);
      }
    }

    // Render the existing receipt-history page
    res.render('receiptall', {
      allproducts,
      totalNonFiltered: allproducts.length,
      phone,
      allSites: true
    });

  } catch (error) {
    console.error('Error fetching receipts by phone:', error);
    res.status(500).send('Internal Server Error');
  }
});


const mongoose = require('mongoose');


router.get('/api/ttreceiptfasterall', isLoggedIn, async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    let query = { final: { $ne: 1 }, dropbox: { $ne: 'on' } };

    if (search) {
      query.receiptChallannumber = { $regex: search, $options: 'i' };
    }

    let allproducts = await ttreceipt.find(query)
      .skip(skip)
      .limit(limit)
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate({
        path: 'generalitemreceipt',
        populate: {
          path: 'onngoing',
          model: 'returnitem',
        }
      })
      .populate('moneyreceipt')
      .populate('additionalcharges')
      .populate('farmaitemreceipt');

    res.json({ data: allproducts });
  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/phone-history/:id', async (req, res) => {
  try {
    console.log("Phone history request for ID:", req.params.id);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid receipt ID' });
    }

    const receiptObjectId = new mongoose.Types.ObjectId(req.params.id);

    const calls = await phoneModel.find({ receipt: receiptObjectId }).sort({ date: -1 });

    console.log("Found calls:", calls);
    res.json({ calls });
  } catch (err) {
    console.error('❌ Error fetching phone history:', err.message);
    res.status(500).json({ error: 'Failed to fetch phone history' });
  }
});
router.delete('/delete-phone-call/:id', async (req, res) => {
  try {
    const callId = req.params.id;

    // Find and delete the phone call entry
    const deleted = await phoneModel.findByIdAndDelete(callId);

    if (!deleted) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Also remove the call reference from the corresponding receipt
    await ttreceipt.updateOne(
      { phone: callId },
      { $pull: { phone: callId } }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting phone call:', err);
    res.status(500).json({ error: 'Failed to delete call' });
  }
});



router.post('/savePhoneCall/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    const { phonetalk, date } = req.body;

    const phoneEntry = await phoneModel.create({
      phonetalk,
      date,
      receipt: receiptId, // ✅ Now correct for non-array schema
    });

    await ttreceipt.findByIdAndUpdate(receiptId, {
      $push: { phone: phoneEntry._id },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error saving phone call:', err);
    res.status(500).json({ error: 'Error saving phone call' });
  }
});



router.post('/toggleMaterialReceived/:id', isLoggedIn, async (req, res) => {
    try {
        const receipt = await ttreceipt.findById(req.params.id);

        if (!receipt) {
            return res.status(404).json({ success: false });
        }

        receipt.materialReceived = !receipt.materialReceived;

        await receipt.save();

        res.json({
            success: true,
            materialReceived: receipt.materialReceived
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false });
    }
});



router.get('/ttreceiptall', isLoggedIn, async function (req, res) {
  console.time("TOTAL");

  try {
    console.time("Mongo Query");

    // Base query
    let query = ttreceipt.find({
      final: { $ne: 1 },
      dropbox: { $ne: 'on' }
    })
    .sort({
      pinned: -1,
      _id: -1
    });

    // Simple populates
    const simplePopulates = [
      'receiptclientname',
      'receiptclientsitename',
      'scaffoldingitemreceipt',
      'moneyreceipt',
      'phone',
      'additionalcharges',
      'farmaitemreceipt'
    ];

    simplePopulates.forEach(field => {
      query = query.populate({
        path: field,
        options: {
          lean: true,
          strictPopulate: false
        }
      });
    });

    // Nested populate
    query = query.populate({
      path: 'generalitemreceipt',
      options: {
        lean: true,
        strictPopulate: false
      },
      populate: {
        path: 'onngoing',
        model: 'returnitem',
        options: {
          lean: true,
          strictPopulate: false
        }
      }
    });

    // -------- Measure each query --------
    console.time("Main Query");

    const allproducts = await query.lean();

    console.timeEnd("Main Query");

    console.time("Count Query");

    const totalNonFiltered = await ttreceipt.countDocuments({
      $or: [
        { final: 1 },
        { dropbox: 'on' }
      ]
    });

    console.timeEnd("Count Query");

    console.timeEnd("Mongo Query");

    console.time("EJS Render");

    res.render("receiptall", {
      allproducts,
      totalNonFiltered
    });

    console.timeEnd("EJS Render");

    console.timeEnd("TOTAL");

  } catch (error) {
    console.error(error);
    console.timeEnd("TOTAL");
    res.status(500).send("Internal Server Error");
  }
});

router.get('/ttreceiptallv2', isLoggedIn, async function (req, res) {
  try {

    let query = ttreceipt.find({
      final: { $ne: 1 },
      dropbox: { $ne: 'on' }
    }).sort({
      pinned: -1,
      _id: -1
    });

    // Simple populates
    const simplePopulates = [
      'receiptclientname',
      'receiptclientsitename',
      'scaffoldingitemreceipt',
      'moneyreceipt',
      'phone',
      'additionalcharges',
      'farmaitemreceipt'
    ];

    simplePopulates.forEach(field => {
      query = query.populate({
        path: field,
        options: {
          lean: true,
          strictPopulate: false
        }
      });
    });

    // Nested populate
    query = query.populate({
      path: 'generalitemreceipt',
      options: {
        lean: true,
        strictPopulate: false
      },
      populate: {
        path: 'ongoing',
        model: 'returnitem',
        options: {
          lean: true,
          strictPopulate: false
        }
      }
    });

    const allproducts = await query.lean();

    res.render("receiptall_v2", {
      allproducts
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});






router.get('/ttreceiptmonthall', isLoggedIn, async function (req, res) {
  try {
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);

    const currentDate = new Date();
    const currentMonth = isNaN(month) ? currentDate.getMonth() : month;
    const currentYear = isNaN(year) ? currentDate.getFullYear() : year;

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59); // End of month

    let allproducts = await ttreceipt.find({
      receiptdate: { $gte: startDate, $lte: endDate }
    })
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate({
        path: 'generalitemreceipt',
        populate: {
          path: 'onngoing',
          model: 'returnitem',
        }
      })
      .populate('moneyreceipt')
      .populate('additionalcharges')
      .populate('farmaitemreceipt');

    // Filter the products based on the condition
    const filteredProducts = allproducts;

    // Count how many were filtered out
    const totalNonFiltered = allproducts.length - filteredProducts.length;

    res.render('receiptall', {
      allproducts: filteredProducts,
      totalNonFiltered,
      currentMonth,
      currentYear
    });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});





router.get('/ttsortall', isLoggedIn , async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('farmaitemreceipt')
       
    res.render('sortall', { allproducts });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/ttunsortall', isLoggedIn , async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('farmaitemreceipt')
       
    res.render('unsortall', isLoggedIn , { allproducts });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/ttreceiptclearall', isLoggedIn, async function (req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 100;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    // Build a filter
    const filter = { final: 1 };

    if (search.trim()) {
      // Lookup by populated field using regex – need aggregation or manual filtering later
      const regex = new RegExp(search, 'i');
      // Get all matching IDs first from populated collections
      const matchedClients = await Client.find({ name: regex }).select('_id');
      const matchedSites = await Clientsite.find({ sitename: regex }).select('_id');

      // Add OR conditions for matching
      filter.$or = [
        { receiptclientname: { $in: matchedClients } },
        { receiptclientsitename: { $in: matchedSites } },
        { receiptno: regex }, // assuming you have receiptno or other fields
      ];
    }

    const filteredCount = await ttreceipt.countDocuments(filter);

    const allproducts = await ttreceipt.find(filter)
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('additionalcharges')
      .populate('farmaitemreceipt')
      .skip(skip)
      .limit(limit)
      .sort({ receiptdate: -1 }) // Sorting by receiptdate in descending order
      .lean();

    const totalPages = Math.ceil(filteredCount / limit);

    res.render('clearreceiptall', {
      allproducts,
      totalNonFiltered: 0,
      currentPage: page,
      totalPages,
      search
    });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});




router.get('/ttreceiptflagall', isLoggedIn , async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('farmaitemreceipt')

      
      
    res.render('flagreceiptall', { allproducts });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/ttreceiptdropboxall', isLoggedIn , async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('farmaitemreceipt')

      
      
    res.render('ttreceiptdropboxall', { allproducts });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/ttreceipttransportall', isLoggedIn, async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem', 
        }
    })
      .populate('moneyreceipt')
      .populate('additionalcharges')
      .populate('farmaitemreceipt');

    // Filter the products based on the condition
    const filteredProducts = allproducts.filter(product => product.final !== 1 && product.dropbox !== 'on' ,);
const filteredtransportProducts = allproducts.filter(product => product.final !== 1 && product.dropbox !== 'on' && product.transport ==  'on',);
    // Calculate total non-filtered products
    const totalNonFiltered = allproducts.length - filteredProducts.length;

    res.render('receiptall', { allproducts: filteredtransportProducts, totalNonFiltered });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
}); 

router.get('/clientall', isLoggedIn , async function(req, res) {
  try {
    const allclients = await Client.find({});
    res.render('clientall', { allclients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.render('error', { error });
  }
});

router.get('/saleall', isLoggedIn, async function (req, res) {
  try {
    const saleRecords = await Sale.find({})
      .populate('moneyreceipt')
      .populate('additionalcharges');

    await Daybook.create({
      daybookinandout: `All sale records accessed from database. Total entries: ${saleRecords.length}`,
      Dateandtimedaybook: moment.utc().toDate(),
      maker: req.user.username
    });

    res.render('saleall', { Sale: saleRecords });
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.render('error', { error });
  }
});



 
router.get('/ttrecipt', isLoggedIn , async (req, res) => {
  try {
    
    const allproducts = await productModel.find();
    const allclients = await Client.find();

    res.render('receiptt', { allproducts, allclients });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/movetodo/:id', isLoggedIn, async (req, res) => {
    try {
        const task = await todo.findById(req.params.id);

        if (!task) {
            return res.status(404).send('Task not found');
        }

        const currentStatus = Number(task.work);

        if (currentStatus === 1) {
            task.work = 2; // TODO → WAITING
        } else if (currentStatus === 2) {
            task.work = 3; // WAITING → COMPLETE
        } else {
            return res.redirect('/todo');
        }

        await task.save();

        res.redirect('/todo');
    } catch (error) {
        console.error('Error moving task:', error);
        res.status(500).send('Unable to move task');
    }
});



router.get('/todo', isLoggedIn , async (req, res) => {
  try {
    
    const alltodo = await todo.find();
   

    res.render('todo', { alltodo});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/addtodo', isLoggedIn , async (req, res) => {
  try {
   

    res.render('addtodo');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Route to retrieve and render transport information
router.get('/transportinfo', isLoggedIn, async (req, res) => {
  try {
    // Assuming `Transport` is your Mongoose model, make sure it matches your actual model name
    const transportData = await transport.find();

    // Render the transport info page with the retrieved transport data
    res.render('transportinfo', { transport: transportData });
  } catch (error) {
    console.error("Error fetching transport information:", error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/printtransport', isLoggedIn, async (req, res) => {
  try {
    // Fetch all transport data from the database
    const transportData = await transport.find();

    // Render the print-friendly transport page
    res.render('printtransport', { transport: transportData });
  } catch (error) {
    console.error("Error fetching transport data for printing:", error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/username/:username', async (req, res) => {
  try {
    const regex = new RegExp(`^${req.params.username}`, 'i');

    let user = await Client.find({ clientName: regex });

    if (user.length === 0) {
        user = await Client.find({ phone: regex });
    }
    if (user) {
      
      res.json(user);
    } else {
      console.log("User not found");
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


router.get('/addgeneral/:id', async (req, res) => {`1e`
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('receiptclientsitename')
    .populate('scaffoldingitemreceipt')
    .populate('generalitemreceipt')
    .populate('generalitemreceipt')
    .populate('moneyreceipt')
    .populate('farmaitemreceipt');


    if (receiptEdit) {
      res.render('addgeneral', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/addscaffolding/:id', isLoggedIn , async (req, res) => {`1e`
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('receiptclientsitename')
    .populate('scaffoldingitemreceipt')
    .populate('generalitemreceipt')
    .populate('generalitemreceipt')
    .populate('moneyreceipt')
    .populate('farmaitemreceipt');

    if (receiptEdit) {
      res.render('addscaffolding', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/addfarma/:id', async (req, res) => {`1e`
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('receiptclientsitename')
    .populate('farmaitemreceipt');

    if (receiptEdit) {
      res.render('addfarmaa', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/return/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('receiptclientsitename')
    .populate('additionalcharges')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'returnscaffolding',
          model: 'scaffoldingin',  // Assuming the model name for returnitem
      }
  })

    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })

    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate({
      path:'farmaitemreceipt',
      populate:{
        path: 'onngoing',
        model: 'farmain',
      }
    });



    if (receiptEdit) {
      res.render('receiptedit', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/seebill/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('receiptclientsitename')
    .populate('additionalcharges')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem',  // Assuming the model name for returnitem
      }
  })

    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })

    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate('farmaitemreceipt');



    if (receiptEdit) {
      res.render('seebill', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/viewrender/:id', isLoggedIn , async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('additionalcharges')
    .populate('receiptclientsitename')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'returnscaffolding',
          model: 'scaffoldingin',  // Assuming the model name for returnitem
      }
  })
    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })
    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate({
      path:'farmaitemreceipt',
      populate:{
        path: 'onngoing',
        model: 'farmain',
      }
    });

res.send(receiptEdit)

    if (receiptEdit) {
      res.render('receiptedit', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/printall', async (req, res) => {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem', 
        }
    })
      .populate('moneyreceipt')
      .populate('additionalcharges')
      .populate('farmaitemreceipt');

    // Filter the products based on the condition
    const filteredProducts = allproducts.filter(product => product.final !== 1 && product.dropbox !== 'on');

    // Calculate total non-filtered products
    const totalNonFiltered = allproducts.length - filteredProducts.length;

    res.render('ttprintall', { allproducts: filteredProducts, totalNonFiltered });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});







router.get('/print/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('additionalcharges')
    .populate('receiptclientsitename')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem',  // Assuming the model name for returnitem
      }
  })
    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })
    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate('farmaitemreceipt');



    if (receiptEdit) {
      res.render('print', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/printgst/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('additionalcharges')
    .populate('receiptclientsitename')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem',  // Assuming the model name for returnitem
      }
  })
    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })
    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate('farmaitemreceipt');



    if (receiptEdit) {
      res.render('printgst', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/gstprint/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('additionalcharges')
    .populate('receiptclientsitename')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem',  // Assuming the model name for returnitem
      }
  })
    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })
    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate('farmaitemreceipt');



    if (receiptEdit) {
      res.render('gstprint', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/gstprint2/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('additionalcharges')
    .populate('receiptclientsitename')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem',  // Assuming the model name for returnitem
      }
  })
    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })
    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate('farmaitemreceipt');



    if (receiptEdit) {
      res.render('gstprint2', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/print2/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('additionalcharges')
    .populate('receiptclientsitename')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem',  // Assuming the model name for returnitem
      }
  })
    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })
    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate('farmaitemreceipt');



    if (receiptEdit) {
      res.render('print2', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/print3/:id', async (req, res) => {
  try {

    const receiptId = req.params.id;

    const receiptEdit = await ttreceipt.findById(receiptId)

      .populate('receiptclientname')

      .populate('additionalcharges')

      .populate('receiptclientsitename')

      .populate({
        path: 'scaffoldingitemreceipt',
        populate: [
          {
            path: 'onngoing',
            model: 'returnitem'
          },
          {
            path: 'returnscaffolding',
            model: 'scaffoldingin'
          }
        ]
      })

      .populate({
        path: 'generalitemreceipt',
        populate: {
          path: 'onngoing',
          model: 'returnitem'
        }
      })

      .populate('moneyreceipt')

      .populate('generalinreceipt')

      .populate({
        path: 'farmaitemreceipt',
        populate: {
          path: 'onngoing',
          model: 'farmain'
        }
      });

    if (!receiptEdit) {
      return res.status(404).send('Product not found');
    }

    res.render('print3', {
      receiptEdit
    });

  } catch (error) {

    console.error(error);

    res.status(500).send('Internal Server Error');

  }
});
router.get('/returnitem/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('scaffoldingitemreceipt')
    .populate({
      path: 'generalitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem', 
      }
  })
    .populate('farmaitemreceipt');

    
    if (receiptEdit) {
      res.render('returnitem', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/returngeneralitem/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('scaffoldingitemreceipt')
    .populate({
      path: 'generalitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem', 
      }
  })
    .populate('farmaitemreceipt');

    
    if (receiptEdit) {
      res.render('returngeneralitem', { receiptEdit });
    } else {
      
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/returnfarmaitem/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('scaffoldingitemreceipt')
    .populate({
      path: 'generalitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem', 
      }
  })
    .populate('farmaitemreceipt');

    
    if (receiptEdit) {
      res.render('returnfarmaitem', { receiptEdit });
    } else {
      
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/scaffolding/return/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('scaffoldingitemreceipt')
    .populate({
      path: 'generalitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem', 
      }
  })
    .populate('farmaitemreceipt');

    
    if (receiptEdit) {
     res.render('scaffoldingReturnForm', { receiptEdit });

    } else {
      
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/returnscaffoldingitem/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('scaffoldingitemreceipt')
    .populate({
      path: 'generalitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem', 
      }
  })
    .populate('farmaitemreceipt');

    
    if (receiptEdit) {
      res.render('returnscaffoldingitem', { receiptEdit });
    } else {
      
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/savereturngeneralitem/:id', async (req, res) => {
  try {
    console.log(req.body);
    const receiptIdd = req.params.id;
    const itemName = ensureArray(req.body['itemname[]']);
    const Comment = ensureArray(req.body['Comment[]']);
    const quantity = ensureArray(req.body['quantity[]']);
    const idd = ensureArray(req.body['idd[]']);

    const datetimeshow = req.body.datetimeshow + 'Z';
    const datetimeactual = req.body.datetimeactual + 'Z';

    for (let i = 0; i < itemName.length; i++) {
      const currentItemName = itemName[i];
      const currentQuantity = parseInt(quantity[i]);
      const currentIdd = idd[i];
      const currentComment = Comment[i];

      if (currentQuantity) {
        try {
          const returnData = await returnitem.create({
            Itemname: currentItemName,
            comment: currentComment,
            quantity: currentQuantity,
            returndateAt: datetimeshow,
            receipt : receiptIdd,
            returndateActual: moment(datetimeactual).toISOString(),
            ongoing: currentIdd,
            mtTick : req.body.mtTick,
          });

          const existingClient = await productModel.findOne({
            itemName: currentItemName,
          });

          if (existingClient) {
            // If existingClient is found, update the single document
            existingClient.workingQuantity += currentQuantity;
            await existingClient.save();
            console.log('workingQuantity updated successfully');
          } else {
            console.log('Client not found in the database');
          }

          const receiptEdit = await ttreceipt.findOne({ _id: receiptIdd });
          receiptEdit.generalinreceipt.push(returnData.id);
          await receiptEdit.save();

          const Addin = await generalout.findOne({ _id: currentIdd });
          if (Addin) {
            Addin.onngoing.push(returnData.id);
            await Addin.save();
            console.log('Added return item to generalout successfully');
          } else {
            console.log(`General Out Item with id ${currentIdd} not found.`);
          }
          

          console.log('done');
          console.log(`Data for ${currentItemName} saved successfully`);
        } catch (error) {
          console.error(`Error saving data for ${currentItemName}:`, error);
        }
      }
    }

    res.redirect(`/return/${receiptIdd}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
}); 


router.post('/savereturnfarmaitem/:id', async (req, res) => {
  try {
    console.log(req.body);
    const receiptIdd = req.params.id;
    
    // Ensure all values are arrays (defaulting to empty arrays if not provided)
    const itemName = ensureArray(req.body['itemname[]'] || []);
    const Comment = ensureArray(req.body['Comment[]'] || []);
    const quantity = ensureArray(req.body['quantity[]'] || []);
    const idd = ensureArray(req.body['idd[]'] || []);
    
    // Ensuring that the plate quantities are handled as arrays
    const plate9 = ensureArray(req.body['quantity9[]'] || []);
    const plate12 = ensureArray(req.body['quantity12[]'] || []);
    const plate15 = ensureArray(req.body['quantity15[]'] || []);
    const plate18 = ensureArray(req.body['quantity18[]'] || []);
    const plate21 = ensureArray(req.body['quantity21[]'] || []);
    const plate24 = ensureArray(req.body['quantity24[]'] || []);
    const plate27 = ensureArray(req.body['quantity27[]'] || []);
    
    // Handling the date values
    const datetimeshow = req.body.datetimeshow ? req.body.datetimeshow + 'Z' : null;
    const datetimeactual = req.body.datetimeactual ? req.body.datetimeactual + 'Z' : null;

    // Loop through all entries to create the farmain records
    for (let i = 0; i < idd.length; i++) {
      const currentQuantity = parseInt(quantity[i]) || 0;
      const currentIdd = idd[i] || null;
      const currentComment = Comment[i] || '';
      
      // Ensure the current plate quantities are correctly assigned
      const currentPlate9 = plate9[i] || 0;
      const currentPlate12 = plate12[i] || 0;
      const currentPlate15 = plate15[i] || 0;
      const currentPlate18 = plate18[i] || 0;
      const currentPlate21 = plate21[i] || 0;
      const currentPlate24 = plate24[i] || 0;
      const currentPlate27 = plate27[i] || 0;

      // Only process if the quantity is greater than 0
      if (currentQuantity > 0) {
        try {
          const returnData = await farmain.create({
            comment: currentComment,
            noofsetsfarma: currentQuantity,
            returndateAt: datetimeshow,
            receipt: receiptIdd,
            plate9inchfarma: currentPlate9,
            plate12inchfarma: currentPlate12,
            plate15inchfarma: currentPlate15,
            plate18inchfarma: currentPlate18,
            plate21inchfarma: currentPlate21,
            plate24inchfarma: currentPlate24,
            plate27inchfarma: currentPlate27,
            ongoing: currentIdd,
            mtTick : req.body.mtTick,
          });

          // Update generalinreceipt in ttreceipt
          const receiptEdit = await ttreceipt.findOne({ _id: receiptIdd });
          if (receiptEdit) {
            receiptEdit.farmainreceipt.push(returnData.id);
            await receiptEdit.save();
          }

          // Update onngoing in generalout
          const Addin = await farmaout.findOne({ _id: currentIdd });
          if (Addin) {
            Addin.onngoing.push(returnData.id);
            await Addin.save();
          }

        } catch (error) {
          console.error("Error in creating farmain entry:", error);
        }
      }
    }

    console.log('Processing completed');
    res.redirect(`/return/${receiptIdd}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/saveScaffoldingReturn/:id', async (req, res) => {

  const session = await mongoose.startSession();

  try {
    console.log(req.body);

    const receiptIdd = req.params.id;

    const itemName = ensureArray(req.body['itemname[]'] || []);
    const Comment = ensureArray(req.body['Comment[]'] || []);
    const quantity = ensureArray(req.body['quantity[]'] || []);
    const idd = ensureArray(req.body['idd[]'] || []);

    const cuplock10ftQty = ensureArray(req.body['cuplock10ftQty[]'] || []);
    const cuplock5ftQty = ensureArray(req.body['cuplock5ftQty[]'] || []);
    const cuplock8ftQty = ensureArray(req.body['cuplock8ftQty[]'] || []);

    const ledger5ftQty = ensureArray(req.body['ledger5ftQty[]'] || []);
    const ledger3ftQty = ensureArray(req.body['ledger3ftQty[]'] || []);
    const ledger6ft5inQty = ensureArray(req.body['ledger6ft5inQty[]'] || []);

    const pinscaffoldingQty = ensureArray(req.body['pinscaffoldingQty[]'] || []);
    const woodenChaliQty = ensureArray(req.body['woodenChaliQty[]'] || []);
    const steelChaliQty = ensureArray(req.body['steelChaliQty[]'] || []);
    const wheelQty = ensureArray(req.body['wheelQty[]'] || []);

    // NEW ITEMS
    const basejackQty = ensureArray(req.body['basejackQty[]'] || []);
    const ledger1_5ftQty = ensureArray(req.body['ledger1_5ftQty[]'] || []);

    const datetimeshow = req.body.datetimeshow
      ? req.body.datetimeshow + 'Z'
      : null;

    const datetimeactual = req.body.datetimeactual
      ? req.body.datetimeactual + 'Z'
      : null;


    await session.withTransaction(async () => {

      for (let i = 0; i < idd.length; i++) {

        const currentQuantity = Number(quantity[i]) || 0;
        const currentIdd = idd[i] || null;
        const currentComment = Comment[i] || '';

        const currentCuplock10ft = Number(cuplock10ftQty[i]) || 0;
        const currentCuplock5ft = Number(cuplock5ftQty[i]) || 0;
        const currentCuplock8ft = Number(cuplock8ftQty[i]) || 0;

        const currentLedger5ft = Number(ledger5ftQty[i]) || 0;
        const currentLedger3ft = Number(ledger3ftQty[i]) || 0;
        const currentLedger6ft5in = Number(ledger6ft5inQty[i]) || 0;

        const currentPinScaffolding = Number(pinscaffoldingQty[i]) || 0;
        const currentWoodenChali = Number(woodenChaliQty[i]) || 0;
        const currentSteelChali = Number(steelChaliQty[i]) || 0;
        const currentWheel = Number(wheelQty[i]) || 0;

        // NEW ITEMS
        const currentBaseJack = Number(basejackQty[i]) || 0;
        const currentLedger1_5ft = Number(ledger1_5ftQty[i]) || 0;


        if (currentQuantity > 0) {

          if (!currentIdd) {
            throw new Error(`Missing scaffolding ID for return row ${i + 1}`);
          }

          // =====================================
          // SAVE SCAFFOLDING RETURN RECORD
          // =====================================

          const [returnData] = await scaffoldingin.create([{

            comment: currentComment,

            Dateandtimescaffoldingreturn: datetimeshow,

            mtTick: req.body.mtTick,

            parentOut: currentIdd,

            cuplock10ftno: currentCuplock10ft,
            cuplock5ftno: currentCuplock5ft,
            cuplock8ftno: currentCuplock8ft,

            ledger5ftno: currentLedger5ft,
            ledger3ftno: currentLedger3ft,
            currentLedger6ft5in: currentLedger6ft5in,

            pinscaffoldingno: currentPinScaffolding,

            // NEW ITEMS
            basejackno: currentBaseJack,
            ledger1_5ftno: currentLedger1_5ft,

            woodernchaliscaffolding: currentWoodenChali,
            steelchalscaffolding: currentSteelChali,
            wheelscaffolding: currentWheel,

            quantityscaffolding: currentQuantity

          }], { session });


          // =====================================
          // LINK RETURN TO ORIGINAL SCAFFOLDING OUT
          // =====================================

          const scaffoldingoutreceipt = await scaffoldingout
            .findById(currentIdd)
            .session(session);

          if (!scaffoldingoutreceipt) {
            throw new Error(`Original scaffolding record not found: ${currentIdd}`);
          }

          scaffoldingoutreceipt.returnscaffolding =
            scaffoldingoutreceipt.returnscaffolding || [];

          scaffoldingoutreceipt.returnscaffolding.push(returnData._id);

          await scaffoldingoutreceipt.save({ session });


          // =====================================
          // RESTORE NEW ITEMS TO INVENTORY
          // =====================================

          // BASE JACK
          if (currentBaseJack > 0) {

            const baseJackProduct = await productModel.findOneAndUpdate(
              { itemName: 'Base Jack' },
              { $inc: { workingQuantity: currentBaseJack } },
              { new: true, session }
            );

            if (!baseJackProduct) {
              throw new Error('Base Jack inventory item not found');
            }
          }


          // LEDGER 1.5FT
          if (currentLedger1_5ft > 0) {

            const ledger1_5ftProduct = await productModel.findOneAndUpdate(
              { itemName: 'Ledger 1.5ft' },
              { $inc: { workingQuantity: currentLedger1_5ft } },
              { new: true, session }
            );

            if (!ledger1_5ftProduct) {
              throw new Error('Ledger 1.5ft inventory item not found');
            }
          }


          console.log('Scaffolding return saved:', returnData._id);

        }
      }

    });


    console.log('Scaffolding return processing completed successfully');

    res.redirect(`/return/${receiptIdd}`);

  } catch (error) {

    console.error('Error in scaffolding return route:', error);

    res.status(500).send(
      `Error saving scaffolding return: ${error.message}`
    );

  } finally {

    await session.endSession();

  }

});



router.get('/scaffolding/delete/:id', async (req, res) => {

  const session = await mongoose.startSession();

  try {
    const returnId = req.params.id;

    await session.withTransaction(async () => {

      // =====================================
      // FIND RETURN RECORD
      // =====================================

      const returnEntry = await scaffoldingin
        .findById(returnId)
        .session(session);

      if (!returnEntry) {
        const error = new Error('Return entry not found.');
        error.statusCode = 404;
        throw error;
      }

      // =====================================
      // FIND ORIGINAL SCAFFOLDING OUT RECORD
      // =====================================

      // Correct schema field is parentOut (capital O).
      let parentOut = null;

      if (returnEntry.parentOut) {
        parentOut = await scaffoldingout
          .findById(returnEntry.parentOut)
          .session(session);
      }

      // Fallback for older records without parentOut
      if (!parentOut) {
        parentOut = await scaffoldingout
          .findOne({
            returnscaffolding: returnEntry._id
          })
          .session(session);
      }

      if (!parentOut) {
        const error = new Error(
          'Original scaffolding record not found. Return was not deleted.'
        );
        error.statusCode = 404;
        throw error;
      }

      console.log('Deleting return:', returnId);
      console.log('Parent scaffolding:', parentOut._id);

      // =====================================
      // INVENTORY MAPPING
      // =====================================

      const inventoryMapping = [

        {
          name: 'Cuplock 10ft',
          field: 'cuplock10ftno'
        },
        {
          name: 'Cuplock 5ft',
          field: 'cuplock5ftno'
        },
        {
          name: 'Cuplock 8ft',
          field: 'cuplock8ftno'
        },
        {
          name: 'Ledger 5ft',
          field: 'ledger5ftno'
        },
        {
          name: 'Ledger 3ft',
          field: 'ledger3ftno'
        },
        {
          name: 'ledger 6.5ft',
          field: 'currentLedger6ft5in'
        },
        {
          name: 'Pin',
          field: 'pinscaffoldingno'
        },
        {
          name: 'Wheel',
          field: 'wheelscaffolding'
        },
        {
          name: 'Woodern Chali',
          field: 'woodernchaliscaffolding'
        },
        {
          name: 'Steel Chali',
          field: 'steelchalscaffolding'
        },

        // NEW ITEMS

        {
          name: 'Base Jack',
          field: 'basejackno'
        },
        {
          name: 'Ledger 1.5ft',
          field: 'ledger1_5ftno'
        }

      ];


      // =====================================
      // DEDUCT RETURNED QUANTITIES
      // =====================================

      for (const item of inventoryMapping) {

        const returnedQuantity =
          Number(returnEntry[item.field]) || 0;

        if (returnedQuantity < 0) {
          throw new Error(
            `Invalid returned quantity for ${item.name}`
          );
        }

        if (returnedQuantity === 0) {
          continue;
        }

        // Deduct the quantity previously added
        // when this return was recorded.

        const updatedProduct = await productModel.findOneAndUpdate(

          {
            itemName: item.name,
            workingQuantity: {
              $gte: returnedQuantity
            }
          },

          {
            $inc: {
              workingQuantity: -returnedQuantity
            }
          },

          {
            new: true,
            session
          }

        );

        if (!updatedProduct) {

          const productExists = await productModel
            .findOne({ itemName: item.name })
            .session(session);

          if (!productExists) {
            throw new Error(
              `Inventory item not found: ${item.name}`
            );
          }

          throw new Error(
            `Insufficient available stock to delete this return for ${item.name}. Available: ${productExists.workingQuantity}, required: ${returnedQuantity}.`
          );
        }

        console.log(
          `Deducted ${returnedQuantity} ${item.name} from inventory.`
        );

      }


      // =====================================
      // REMOVE RETURN REFERENCE FROM PARENT
      // =====================================

      parentOut.returnscaffolding =
        (parentOut.returnscaffolding || []).filter(
          id => String(id) !== String(returnEntry._id)
        );

      await parentOut.save({ session });


      // =====================================
      // DELETE RETURN RECORD
      // =====================================

      await scaffoldingin.deleteOne(
        { _id: returnEntry._id },
        { session }
      );

      console.log('Scaffolding return deleted successfully.');

    });


    // =====================================
    // REDIRECT AFTER SUCCESS
    // =====================================

    res.redirect('back');

  } catch (error) {

    console.error(
      'Error while deleting scaffolding return:',
      error
    );

    res.status(error.statusCode || 500).send(
      `Unable to delete return: ${error.message}`
    );

  } finally {

    await session.endSession();

  }

});






router.post('/savereturnitem/:id', async (req, res) => {
  try {
  
    console.log(req.body);
receiptIdd =  req.params.id;
    const itemName = ensureArray(req.body['itemname[]']);
    const Comment = ensureArray(req.body['Comment[]']);
    const quantity = ensureArray(req.body['quantity[]']);
    const idd = ensureArray(req.body['idd[]']);
    const value = ensureArray(req.body['check[]']);
    const height = ensureArray(req.body['height[]']);

const datetimeshow = req.body.datetimeshow + 'Z'
const datetimeactual = req.body.datetimeactual + 'Z'
    for (let i = 0; i < itemName.length; i++) {

      const currentItemName = itemName[i];
      const currentQuantity = parseInt(quantity[i]);
      const currentIdd = idd[i];
      const currentComment = Comment[i]  ;
      const currentvalue = value[i];
      const currentheight = height[i];
      
      if(currentQuantity){
        

      try 
      {       
        const returnData = await returnitem.create({
          Itemname: currentItemName,
          comment: currentComment,
          quantity: currentQuantity,
          returndateAt: datetimeshow,
          returndateActual: moment(req.body.datetimeactual).toISOString(),
          ongoing: currentIdd,
        }); 

        const existingClient = await productModel.find({
          itemName: currentItemName,
         
        });

        if (existingClient) 
        {
          existingClient.workingQuantity = existingClient.workingQuantity + currentQuantity;
          await existingClient.save();
          console.log('workingQuantity updated successfully');
        }
         else {
          console.log('Client not found in the database');
        }

        const receiptId = req.params.id;
        const receiptEdit = await ttreceipt.findOne({ _id: receiptId })

if(currentvalue == 1){

        receiptEdit.generalinreceipt.push(returnData.id);  
        await receiptEdit.save();

        const Addin = await generalout.findOne({ _id: currentIdd });
        console.log(Addin);



        Addin.onngoing.push(returnData.id);
        await Addin.save();

        console.log('done');
        console.log(`Data for ${currentItemName} saved successfully`);
}
if(currentvalue == 2){


  receiptEdit.scaffoldinginreceipt.push(returnData.id);  
  await receiptEdit.save();

console.log(receiptEdit);

  const Addin = await scaffoldingout.findOne({ _id: currentIdd });
  console.log(Addin);

  
  Addin.onngoing.push(returnData.id);
  await Addin.save();

  await Daybook.create({
      daybookinandout: `Return items saved for receipt ${receiptIdd}: ${itemSummary.join(', ')}`,
      Dateandtimedaybook: new Date(), // using native Date()
      maker: req.user.username
    });
    

  console.log('done');
  console.log(`Data for ${currentItemName} saved successfully`);


}


      } 
      catch (error) {
        console.error(`Error saving data for ${currentItemName}:`, error);
      }
    }
    }

    
    



    res.redirect(`/return/${receiptIdd}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.post('/savereturnscaffoldingitem/:id', async (req, res) => {
  try {
    console.log(req.body);
    const receiptIdd = req.params.id;
    const itemName = ensureArray(req.body['itemname[]']);
    const Comment = ensureArray(req.body['Comment[]']);
    const quantity = ensureArray(req.body['quantity[]']);
    const idd = ensureArray(req.body['idd[]']);

    const datetimeshow = req.body.datetimeshow + 'Z';
    const datetimeactual = req.body.datetimeactual + 'Z';

    for (let i = 0; i < itemName.length; i++) {
      const currentItemName = itemName[i];
      const currentQuantity = parseInt(quantity[i]);
      const currentIdd = idd[i];
      const currentComment = Comment[i];

      if (currentQuantity) {
        try {
          const returnData = await returnitem.create({
            Itemname: currentItemName,
            comment: currentComment,
            quantity: currentQuantity,
            returndateAt: datetimeshow,
            returndateActual: moment(datetimeactual).toISOString(),
            ongoing: currentIdd,
          });

          const existingClient = await productModel.findOne({
            itemName: currentItemName,
          });

          if (existingClient) {
            // If existingClient is found, update the single document
            existingClient.workingQuantity += currentQuantity;
            await existingClient.save();
            console.log('workingQuantity updated successfully');
          } else {
            console.log('Client not found in the database');
          }

          const receiptEdit = await ttreceipt.findOne({ _id: receiptIdd });

          receiptEdit.scaffoldinginreceipt.push(returnData.id);
          await receiptEdit.save();

          const Addin = await scaffoldingout.findOne({ _id: currentIdd });
          Addin.onngoing.push(returnData.id);
          await Addin.save();

          console.log('done');
          console.log(`Data for ${currentItemName} saved successfully`);
        } catch (error) {
          console.error(`Error saving data for ${currentItemName}:`, error);
        }
      }
    }

    res.redirect(`/return/${receiptIdd}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


const moment = require('moment-timezone');
const additionalcharges = require('./additionalcharges');

router.post('/ttrecipt', async function(req, res) {
  try {
    let clientId;

    // Log the item for debugging
    console.log("Item:", req.body['item[]']);

    // Check if a client with the given details already exists
    const existingClient = await Client.findOne({
      clientName: req.body.Name,
      phone: req.body.Phone,
      address: req.body.Address,
      comment: req.body.comment,
    });

    if (existingClient) {
      clientId = existingClient._id;
    } else {
      const newClient = await Client.create({
        clientName: req.body.Name,
        phone: req.body.Phone,
        address: req.body.Address,
        comment: req.body.comment,
      });

      clientId = newClient._id;
    }

    // Check if there is additional site information
    if (req.body.Namesite || req.body.Phonesite || req.body.Addresssite || req.body.commentsite) {
      // Create a new Clientsite document
      const newClientsite = await Clientsite.create({
        clientNamesite: req.body.Namesite,
        phonesite: req.body.Phonesite,
        addresssite: req.body.Addresssite,
        commentsite: req.body.commentsite,
        client: clientId,
      });

      // Update the clientsite array in the corresponding Client document
      const clientt = await Client.findOne({ _id: clientId });
      clientt.clientsite.push(newClientsite._id);
      await clientt.save();
    }

    // Parse the date and time from the request body using moment-timezone
    const dateAndTimeString = req.body['datetime[]'];
    const parsedDateAndTime = moment.tz(dateAndTimeString, 'YOUR_TIMEZONE');

    
    console.log(req.body);
    
    const itemNames = req.body['item[]'];
    
    const quantities = req.body['quantity[]'];
    const rents = req.body['rent[]'];
    
    const newItemsOut = [];


  async function yourAsyncFunction() {
  const promises = itemNames.map(async (itemName, i) => {
    const newItemOut = await generalout.create({
      itemname: itemName,
      Quantity: quantities[i],
      Dateandtime: parsedDateAndTime.toDate(),
      rent: rents[i],
    });

    return newItemOut;
  });

  const newItemsOut = await Promise.all(promises);

  // Now newItemsOut is an array containing the results of all the promises.
  console.log(newItemsOut);
}

    
    
    
    res.send('done');







  } catch (error) {
    // Handle errors
    if (error.name === 'ValidationError') {
      // Validation error response
      res.status(400).send('Validation Error: ' + error.message);
    } else {
      // Log the full error for debugging
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }
});



router.get('/addmoney/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('receiptclientsitename')
    .populate('scaffoldingitemreceipt')
    .populate('generalitemreceipt')
    .populate('generalitemreceipt')
    .populate('moneyreceipt');


    if (receiptEdit) {
      res.render('addmoney', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/editadditionalcharges/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('additionalcharges')
  


    if (receiptEdit) {
      res.render('editadditionalcharges', { receiptEdit }); // Pass the product information as an object
    } 
    else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/editemployee/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    const receiptEdit = await Labour.findOne({ _id: receiptId })
   
  


    if (receiptEdit) {
      res.render('editemployee', { receiptEdit }); // Pass the product information as an object
    } 
    else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/deleteadditionalcharges/:id/', isLoggedIn, async (req, res) => {
  try {
    const userId = req.params.id;

    // Find and delete the additional charge
    const productEdit = await additionalcharge.findOneAndDelete({ _id: userId });

    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    await Daybook.create({
  daybookinandout: `Additional charge deleted. Charge: ${productEdit.additionalchargesName}, Cost: ₹${productEdit.additionalchargesCost}.`,
  Dateandtimedaybook: moment.utc().toDate(),
  maker: req.user.username
});

    // Redirect to the associated receipt
    res.redirect(`/editadditionalcharges/${productEdit.recieptt}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.post("/updateprice", isLoggedIn, async (req, res) => {
  try {

    const { id, field, value } = req.body;

    await productModel.findByIdAndUpdate(id, {
      [field]: Number(value)
    });

    await Daybook.create({
      daybookinandout: `${field} updated to ₹${value}.`,
      Dateandtimedaybook: moment.utc().toDate(),
      maker: req.user.username
    });

    res.json({ success: true });

  } catch (err) {
    console.log(err);
    res.json({ success: false });
  }
});



router.get('/deleteemployee/:id/', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find and delete the additional charge by ID
    const productEdit = await Labour.findOneAndDelete({ _id: userId });

    // If the additional charge is not found, send a 404 response
    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    // Redirect to the edit page of the associated receipt
    res.redirect(`/labouraccount#`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/deletetransportoffice/:id/', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find and delete the additional charge by ID
    const productEdit = await transport.findOneAndDelete({ _id: userId });

    // If the additional charge is not found, send a 404 response
    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    // Redirect to the edit page of the associated receipt
    res.redirect(`/transportinfo`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/correct/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const generalEdit = await generalout.findOne({ _id: receiptId });


    if (generalEdit) {
      res.render('updategeneral', { generalEdit }); // Pass the product information as an object
    } 
    else
     {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/flagreceipt/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });

    
    

    if (generalEdit) {
      res.render('flagreceipt', { generalEdit }); 
    } 
    else
     {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/addtosorted/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });

    if (generalEdit) {
      const updateData = {
        sort: 1,
      };

      const updatedProduct = await ttreceipt.findByIdAndUpdate(
        receiptId, // Use the receiptId directly
        updateData,
        { new: true }
      );

      res.redirect(`/ttsortall`); 
    } else {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/adddropbox/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });

    
    

    if (generalEdit) {
      res.render('adddropbox', { generalEdit }); 
    } 
    else
     {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/whatsappsend/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });

    
    

    if (generalEdit) {
      res.render('adddropbox', { generalEdit }); 
    } 
    else
     {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/transport/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });

    
    

    if (generalEdit) {
      res.render('transport', { generalEdit }); 
    } 
    else
     {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/savetransport', async (req, res) => {
  try {

    
      console.log(req.body);
      const generalEdit = await transport.create({ name: req.body.transportName , phoneNumber: req.body.phoneNumber , plateNumber : req.body.plateNumber});

   
    res.redirect(`/transportinfo`);
    



  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.post('/transport/:id/toggle', async (req, res) => {
  try {
       console.log(req.body);
    const productId = req.params.id;
  const { transport, transportColor, transportdate } = req.body;

    const updatedReceipt = await ttreceipt.findByIdAndUpdate(
  productId,
  {
    transport,
    transportColor,
    transportdate
  },
  { new: true }
);

    if (!updatedReceipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // ✅ Fetch client name
    const client = await Client.findById(updatedReceipt.receiptclientname).select('clientName');

    // ✅ Emit with client name & challan number
    const io = req.app.get('io');
    io.emit('transportUpdated', {
      receiptId: updatedReceipt.receiptChallannumber ,
      clientName: client?.clientName || 'Unknown',
      status: transport,
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    res.json({ success: true, updatedReceipt });
  } catch (error) {
    console.error('Transport toggle error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.get('/changetodoitem/:id', async (req, res) => {
    try {
        const generalEdit = await todo.findById(req.params.id);

        if (!generalEdit) {
            return res.status(404).send('Task not found');
        }

        res.render('todochange', { generalEdit });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



router.get('/correctscaffolding/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const scaffoldingEdit = await scaffoldingout.findOne({ _id: receiptId });


    if (scaffoldingEdit) {
      res.render('updatescaffolding', { scaffoldingEdit }); // Pass the product information as an object
    } 
    else
     {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/correctfarma/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const scaffoldingEdit = await farmaout.findOne({ _id: receiptId });

console.log('ok');
    if (scaffoldingEdit) {
      res.render('updatefarma', { scaffoldingEdit }); // Pass the product information as an object
    } 
    else
     {
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/saveupdatefarma/:id', async (req, res) => {
  try {
    const receiptId = req.params.id; // Get the receipt ID from the URL parameter
   
    const datetimefarma = ensureArray(req.body['datetimefarma[]']);
    const length1farma = ensureArray(req.body['length1[]']);
    const length2farma = ensureArray(req.body['length2[]']);
    const quantityfarma = ensureArray(req.body['quantityfarma[]']);
    const ratefarma = ensureArray(req.body['ratefarma[]']);


    const heightfarmaa = ensureArray(req.body['heightfarma[]']);


    const farmaplate9inch = ensureArray(req.body['farmaplate9inch[]']);
    const farmaplate12inch = ensureArray(req.body['farmaplate12inch[]']);
    const farmaplate15inch = ensureArray(req.body['farmaplate15inch[]']);
    const farmaplate18inch = ensureArray(req.body['farmaplate18inch[]']);
    const farmaplate21inch = ensureArray(req.body['farmaplate21inch[]']);
    const farmaplate24inch = ensureArray(req.body['farmaplate24inch[]']);
    const farmaplate27inch = ensureArray(req.body['farmaplate27inch[]']);


    const generalEdit = await farmaout.findOne({ _id: receiptId });

const updateData = {
  Dateandtimefarma: datetimefarma.map(dt => dt + 'Z'), // Assuming 'Z' is necessary for the format
  length1farma: Array.isArray(length1farma) ? length1farma.join(',') : length1farma, // Convert array to string
  length2farma: Array.isArray(length2farma) ? length2farma.join(',') : length2farma, // Convert array to string
  heightfarma: Array.isArray(heightfarmaa) ? heightfarmaa.join(',') : heightfarmaa, // Convert array to string
  plate9inchfarma: Array.isArray(farmaplate9inch) ? farmaplate9inch.join(',') : farmaplate9inch, // Convert array to string
  plate12inchfarma: Array.isArray(farmaplate12inch) ? farmaplate12inch.join(',') : farmaplate12inch,
  plate15inchfarma: Array.isArray(farmaplate15inch) ? farmaplate15inch.join(',') : farmaplate15inch,
  plate18inchfarma: Array.isArray(farmaplate18inch) ? farmaplate18inch.join(',') : farmaplate18inch,
  plate21inchfarma: Array.isArray(farmaplate21inch) ? farmaplate21inch.join(',') : farmaplate21inch,
  plate24inchfarma: Array.isArray(farmaplate24inch) ? farmaplate24inch.join(',') : farmaplate24inch,
  plate27inchfarma: Array.isArray(farmaplate27inch) ? farmaplate27inch.join(',') : farmaplate27inch,
  rentpersetfarma: Array.isArray(ratefarma) ? ratefarma.join(',') : ratefarma,
  noofsetsfarma: Array.isArray(quantityfarma) ? quantityfarma.join(',') : quantityfarma,
};


    const updatedProduct = await farmaout.findByIdAndUpdate(
      receiptId,
      updateData,
      { new: true } 
    );

    console.log(updatedProduct); // Log the updated document for debugging
    console.log('updatedProduct');
    // Redirect after successful update
    res.redirect(`/ttreceiptall`);
  } catch (error) {
    
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.post('/generalupdatee/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    
console.log(req.body);
    const generalEdit = await generalout.findOne({ _id: receiptId });
   

    // Update data from req.body
    const updateData = {
      Dateandtime: req.body['datetime[]'],
      Quantity: req.body['quantity[]'],
      rent: req.body['rent[]'],
      itemoutname: req.body['item[]'],
    };

console.log(updateData);
    const updatedProduct = await generalout.findByIdAndUpdate(
      receiptId,
      updateData,
      { new: true }
    );
    console.log(updatedProduct);
   
    res.redirect(`/ttreceiptall`);
    

  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.post('/api/flag/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { flag } = req.body;

    if (!['on', 'off'].includes(flag)) {
      return res.status(400).json({ error: 'Invalid flag value' });
    }

    const updated = await ttreceipt.findByIdAndUpdate(
      id,
      { flag },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const client = await Client.findById(updated.receiptclientname).select('clientName');

    // Emit full info
    const io = req.app.get('io');
    io.emit('flagMade', {
      challanNo: updated.receiptChallannumber,
      status: updated.flag,
      clientName: client?.clientName || 'Unknown',
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    res.json({ message: 'Flag updated', flag: updated.flag });
  } catch (err) {
    console.error('Error updating flag:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.post('/saveflag/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    
      console.log(req.body);
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });
   
    const updateData = {
      flagdate: req.body.datetimeactual,
      flag : req.body.toggle,
      flagcomment: req.body.flagactual,     
    };

    const updatedProduct = await ttreceipt.findByIdAndUpdate(
      receiptId,
      updateData,
      { new: true }
    );

    
    console.log(updatedProduct);
   
    res.redirect(`/ttreceiptall`);
    



  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/buy', async (req, res) => {

    const toArray = value => {
        if (value === undefined || value === null) return [];
        return Array.isArray(value) ? value : [value];
    };

    try {
        const {
            supplier,
            supplierAddress,
            phone,
            invoiceno,
            datetimereceipt,
            remarks
        } = req.body;

        // =========================================
        // MATERIALS
        // =========================================

        const itemArray = toArray(req.body['item[]']);
        const quantityArray = toArray(req.body['quantity[]']);
        const purchaseRateArray = toArray(req.body['purchaseRate[]']);

        const items = itemArray
            .map((itemName, index) => ({
                itemName: String(itemName || '').trim(),
                quantity: Number(quantityArray[index]) || 0,
                price: Number(purchaseRateArray[index]) || 0
            }))
            .filter(item => item.itemName !== '');

        const materialTotal = items.reduce(
            (sum, item) => sum + item.quantity * item.price,
            0
        );

        // =========================================
        // ADDITIONAL CHARGES
        // =========================================

        const chargeDescriptionArray =
            toArray(req.body['chargeDescription[]']);

        const chargeAmountArray =
            toArray(req.body['chargeAmount[]']);

        const additionalCharges = chargeDescriptionArray
            .map((description, index) => ({
                description: String(description || '').trim(),
                amount: Number(chargeAmountArray[index]) || 0
            }))
            .filter(charge =>
                charge.description !== '' && charge.amount > 0
            );

        const additionalChargesTotal = additionalCharges.reduce(
            (sum, charge) => sum + charge.amount,
            0
        );

        const totalAmount = materialTotal + additionalChargesTotal;

        // =========================================
        // PAYMENTS MADE NOW
        // =========================================

        const paymentModeArray = toArray(req.body['paymentMode[]']);
        const paymentAmountArray = toArray(req.body['paymentAmount[]']);
        const paymentDateArray = toArray(req.body['paymentDate[]']);

        const validModes = ['cash', 'upi', 'bank', 'cheque', 'other'];

        const payments = paymentAmountArray
            .map((amountValue, index) => {

                const amount = Number(amountValue) || 0;

                if (amount <= 0) return null;

                const requestedMode = String(
                    paymentModeArray[index] || 'other'
                ).toLowerCase();

                const mode = validModes.includes(requestedMode)
                    ? requestedMode
                    : 'other';

                const suppliedDate = paymentDateArray[index];

                const parsedDate = suppliedDate
                    ? new Date(suppliedDate)
                    : new Date();

                return {
                    mode,
                    amount,
                    date: Number.isNaN(parsedDate.getTime())
                        ? new Date()
                        : parsedDate
                };

            })
            .filter(Boolean);

        const paidAmount = payments.reduce(
            (sum, payment) => sum + payment.amount,
            0
        );

        if (paidAmount > totalAmount) {
            return res.status(400).send(
                `Payment ₹${paidAmount.toFixed(2)} cannot exceed ` +
                `purchase total ₹${totalAmount.toFixed(2)}.`
            );
        }

        const pendingAmount = totalAmount - paidAmount;

        // =========================================
        // PURCHASE DATE
        // =========================================

        const parsedPurchaseDate = datetimereceipt
            ? new Date(datetimereceipt)
            : new Date();

        const purchaseDate = Number.isNaN(parsedPurchaseDate.getTime())
            ? new Date()
            : parsedPurchaseDate;

        // =========================================
        // SAVE PURCHASE AND MONEY OUT ENTRIES
        // TOGETHER IN ONE TRANSACTION
        // =========================================

        const session = await mongoose.startSession();

        try {

            await session.withTransaction(async () => {

                // Save purchase
                const [newBuy] = await buyitem.create([{

                    supplier,
                    supplierAddress,
                    phone,
                    invoiceNo: invoiceno || '',
                    date: purchaseDate,

                    items,

                    additionalCharges,
                    additionalChargesTotal,

                    totalAmount,
                    payments,
                    paidAmount,
                    pendingAmount,

                    remarks: remarks || '',
                    moneyreceipt: []

                }], { session });


                // =========================================
                // CREATE MONEY OUT LEDGER ENTRIES
                // =========================================

                const ledgerEntries = payments.map(payment => ({

                    inandout: 0, // 0 = MONEY OUT

                    amount: payment.amount,

                    Dateandtimeinandout: payment.date,

                    // Transaction category
                    transactionType: 'Material Buy',

                    comment:
                        `Purchase payment - ${supplier || 'Supplier'}` +
                        (invoiceno ? ` | Invoice: ${invoiceno}` : ''),

                    modeofpayment: payment.mode

                }));


                // =========================================
                // SAVE LEDGER ENTRIES
                // =========================================

                if (ledgerEntries.length > 0) {

                    const savedEntries = await moneyinandout.insertMany(
                        ledgerEntries,
                        { session }
                    );

                    // Link money entries with purchase
                    newBuy.moneyreceipt = savedEntries.map(
                        entry => entry._id
                    );

                    await newBuy.save({ session });
                }

            });

            console.log('Purchase and Material Buy ledger entries saved.');

            res.redirect('/ttdashboard');

        } finally {

            await session.endSession();

        }

    } catch (error) {

        console.error('Error saving purchase and money entries:', error);

        res.status(500).send(
            `Error saving purchase: ${error.message}`
        );

    }

});

// ======================================================
// ADD PAYMENT TO EXISTING PURCHASE
// ======================================================

router.post('/buy/:id/add-payment', async (req, res) => {

    const amount = Number(req.body.paymentAmount);

    const paymentMode = String(
        req.body.paymentMode || 'other'
    ).toLowerCase();

    const suppliedDate = req.body.paymentDate;

    const paymentDate = suppliedDate
        ? new Date(suppliedDate)
        : new Date();

    const validModes = ['cash', 'upi', 'bank', 'cheque', 'other'];

    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).send('Enter a valid payment amount.');
    }

    if (!validModes.includes(paymentMode)) {
        return res.status(400).send('Select a valid payment mode.');
    }

    if (Number.isNaN(paymentDate.getTime())) {
        return res.status(400).send('Enter a valid payment date.');
    }

    const session = await mongoose.startSession();

    try {

        await session.withTransaction(async () => {

            const buy = await buyitem
                .findById(req.params.id)
                .session(session);

            if (!buy) {
                const error = new Error('Purchase not found.');
                error.statusCode = 404;
                throw error;
            }

            const total = Number(buy.totalAmount) || 0;
            const alreadyPaid = Number(buy.paidAmount) || 0;

            const pendingBeforePayment = Math.max(
                0,
                total - alreadyPaid
            );

            if (amount > pendingBeforePayment) {
                const error = new Error(
                    `Payment cannot exceed pending amount ₹${pendingBeforePayment.toFixed(2)}.`
                );

                error.statusCode = 400;
                throw error;
            }

            // =========================================
            // CREATE MONEY OUT LEDGER ENTRY
            // =========================================

            const [ledgerEntry] = await moneyinandout.create([{

                inandout: 0, // 0 = MONEY OUT

                amount,

                Dateandtimeinandout: paymentDate,

                // Transaction category
                transactionType: 'Material Buy',

                comment:
                    `Purchase payment - ${buy.supplier || 'Supplier'}` +
                    (buy.invoiceNo ? ` | Invoice: ${buy.invoiceNo}` : ''),

                modeofpayment: paymentMode

            }], { session });


            // =========================================
            // UPDATE PURCHASE PAYMENT HISTORY
            // =========================================

            buy.payments = buy.payments || [];

            buy.payments.push({
                mode: paymentMode,
                amount,
                date: paymentDate
            });


            // =========================================
            // UPDATE PAID AND PENDING AMOUNTS
            // =========================================

            buy.paidAmount = alreadyPaid + amount;

            buy.pendingAmount = Math.max(
                0,
                total - buy.paidAmount
            );


            // =========================================
            // LINK LEDGER TRANSACTION TO PURCHASE
            // =========================================

            buy.moneyreceipt = buy.moneyreceipt || [];

            buy.moneyreceipt.push(ledgerEntry._id);

            await buy.save({ session });

        });

        console.log('Supplier payment and Material Buy ledger entry saved.');

        res.redirect('/BUYALL');

    } catch (error) {

        console.error('Error recording supplier payment:', error);

        res.status(error.statusCode || 500).send(error.message);

    } finally {

        await session.endSession();

    }

});



// ======================================================
// OPEN ADD PAYMENT PAGE
// ======================================================

router.get('/addbuypayment/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const buy =
            await buyitem.findById(id);


        if (!buy) {

            return res.status(404).send(
                "Purchase not found"
            );

        }


        res.render(
            'addbuypayment',
            {
                buy: buy
            }
        );


    } catch (error) {

        console.error(
            "Error loading payment page:",
            error
        );


        res.status(500).send(
            `Error loading payment page: ${error.message}`
        );

    }

});

// ======================================================
// OPEN ADD PAYMENT PAGE
// ======================================================

router.get('/addbuypayment/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const buy =
            await buyitem.findById(id);


        if (!buy) {

            return res.status(404).send(
                "Purchase not found"
            );

        }


        res.render(
            'addbuypayment',
            {
                buy: buy
            }
        );


    } catch (error) {

        console.error(
            "Error loading payment page:",
            error
        );


        res.status(500).send(
            `Error loading payment page: ${error.message}`
        );

    }

});

router.get('/buyall', async (req, res) => {
    try {

        const Buy = await buyitem.find({});

        res.render('buyall', {
            Buy: Buy
        });

    } catch (error) {

        console.error("Error loading buy database:", error);

        res.status(500).send(
            `Error loading buy database: ${error.message}`
        );

    }
});

router.get('/deletebuy/:id', async (req, res) => {
    try {

        const { id } = req.params;

        console.log("Deleting purchase:", id);


        // Find and delete purchase
        const deletedBuy = await buyitem.findByIdAndDelete(id);


        // If purchase doesn't exist
        if (!deletedBuy) {

            return res.status(404).send(
                "Purchase not found"
            );

        }


        console.log(
            "Purchase deleted successfully:",
            deletedBuy._id
        );


        // Go back to Buy Database
        res.redirect('/BUYALL');


    } catch (error) {

        console.error(
            "Error deleting purchase:",
            error
        );

        res.status(500).send(
            `Error deleting purchase: ${error.message}`
        );

    }
});

// ======================================================
// EDIT BUY - OPEN PAGE
// ======================================================

router.get('/editbuy/:id', async (req, res) => {

    try {

        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send("Invalid purchase ID");
        }

        const buy = await buyitem.findById(id);

        if (!buy) {
            return res.status(404).send("Purchase not found");
        }

        res.render('editbuy', {
            buy: buy
        });

    } catch (error) {

        console.error(
            "Error loading purchase for edit:",
            error
        );

        res.status(500).send(
            `Error loading purchase: ${error.message}`
        );

    }

});


// ======================================================
// EDIT BUY - SAVE CHANGES
// ======================================================

router.post('/editbuy/:id', async (req, res) => {

    try {

        const { id } = req.params;

        console.log("EDIT BUY BODY:", req.body);


        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).send("Invalid purchase ID");
        }


        const buy = await buyitem.findById(id);

        if (!buy) {
            return res.status(404).send("Purchase not found");
        }


        // ======================================================
        // BASIC DETAILS
        // ======================================================

        const {
            supplier,
            supplierAddress,
            phone,
            invoiceno,
            datetimereceipt,
            remarks
        } = req.body;


        // ======================================================
        // MATERIAL ARRAYS
        // ======================================================

        const itemArray = Array.isArray(req.body['item[]'])
            ? req.body['item[]']
            : req.body['item[]']
                ? [req.body['item[]']]
                : [];


        const quantityArray = Array.isArray(req.body['quantity[]'])
            ? req.body['quantity[]']
            : req.body['quantity[]']
                ? [req.body['quantity[]']]
                : [];


        const purchaseRateArray = Array.isArray(req.body['purchaseRate[]'])
            ? req.body['purchaseRate[]']
            : req.body['purchaseRate[]']
                ? [req.body['purchaseRate[]']]
                : [];


        // ======================================================
        // CREATE ITEMS
        // ======================================================

        const items = itemArray
            .map((itemName, index) => ({

                itemName: String(itemName || '').trim(),

                quantity:
                    Number(quantityArray[index]) || 0,

                price:
                    Number(purchaseRateArray[index]) || 0

            }))
            .filter(item =>
                item.itemName !== '' &&
                item.quantity > 0
            );


        // ======================================================
        // MATERIAL TOTAL
        // ======================================================

        const materialTotal = items.reduce(
            (total, item) => {

                return total +
                    (item.quantity * item.price);

            },
            0
        );


        // ======================================================
        // ADDITIONAL CHARGES
        // ======================================================

        const chargeDescriptionArray =
            Array.isArray(req.body['chargeDescription[]'])
                ? req.body['chargeDescription[]']
                : req.body['chargeDescription[]']
                    ? [req.body['chargeDescription[]']]
                    : [];


        const chargeAmountArray =
            Array.isArray(req.body['chargeAmount[]'])
                ? req.body['chargeAmount[]']
                : req.body['chargeAmount[]']
                    ? [req.body['chargeAmount[]']]
                    : [];


        const additionalCharges =
            chargeDescriptionArray
                .map((description, index) => ({

                    description:
                        String(description || '').trim(),

                    amount:
                        Number(chargeAmountArray[index]) || 0

                }))
                .filter(charge =>
                    charge.description !== '' &&
                    charge.amount > 0
                );


        // ======================================================
        // ADDITIONAL CHARGES TOTAL
        // ======================================================

        const additionalChargesTotal =
            additionalCharges.reduce(
                (total, charge) => {

                    return total + charge.amount;

                },
                0
            );


        // ======================================================
        // GRAND TOTAL
        // ======================================================

        const totalAmount =
            materialTotal +
            additionalChargesTotal;


        // ======================================================
        // PAYMENT ARRAYS
        // ======================================================

        const paymentModeArray =
            Array.isArray(req.body['paymentMode[]'])
                ? req.body['paymentMode[]']
                : req.body['paymentMode[]']
                    ? [req.body['paymentMode[]']]
                    : [];


        const paymentAmountArray =
            Array.isArray(req.body['paymentAmount[]'])
                ? req.body['paymentAmount[]']
                : req.body['paymentAmount[]']
                    ? [req.body['paymentAmount[]']]
                    : [];


        // ======================================================
        // CREATE PAYMENTS
        // ======================================================

        const payments =
            paymentModeArray
                .map((mode, index) => ({

                    mode: mode,

                    amount:
                        Number(paymentAmountArray[index]) || 0

                }))
                .filter(payment =>
                    payment.amount > 0
                );


        // ======================================================
        // PAID
        // ======================================================

        const paidAmount =
            payments.reduce(
                (total, payment) => {

                    return total + payment.amount;

                },
                0
            );


        // ======================================================
        // OVERPAYMENT CHECK
        // ======================================================

        if (paidAmount > totalAmount) {

            return res.status(400).send(
                `Payment amount ₹${paidAmount.toFixed(2)}
                cannot be greater than purchase total
                ₹${totalAmount.toFixed(2)}`
            );

        }


        // ======================================================
        // PENDING
        // ======================================================

        const pendingAmount =
            totalAmount - paidAmount;


        // ======================================================
        // UPDATE DOCUMENT
        // ======================================================

        buy.supplier =
            supplier || '';

        buy.supplierAddress =
            supplierAddress || '';

        buy.phone =
            phone || '';

        buy.invoiceNo =
            invoiceno || '';

        buy.date =
            datetimereceipt
                ? new Date(datetimereceipt)
                : buy.date;

        buy.items =
            items;

        buy.additionalCharges =
            additionalCharges;

        buy.additionalChargesTotal =
            additionalChargesTotal;

        buy.totalAmount =
            totalAmount;

        buy.payments =
            payments;

        buy.paidAmount =
            paidAmount;

        buy.pendingAmount =
            pendingAmount;

        buy.remarks =
            remarks || '';


        // ======================================================
        // SAVE
        // ======================================================

        await buy.save();


        console.log(
            "Purchase updated successfully:",
            buy._id
        );


        console.log(
            "Material Total:",
            materialTotal
        );

        console.log(
            "Additional Charges:",
            additionalChargesTotal
        );

        console.log(
            "Grand Total:",
            totalAmount
        );

        console.log(
            "Paid:",
            paidAmount
        );

        console.log(
            "Pending:",
            pendingAmount
        );


        // ======================================================
        // BACK TO BUY DATABASE
        // ======================================================

        res.redirect('/BUYALL');


    } catch (error) {

        console.error(
            "Error updating purchase:",
            error
        );

        res.status(500).send(
            `Error updating purchase: ${error.message}`
        );

    }

});


router.post('/savedropbox/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    
      console.log(req.body);
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });
   
    const updateData = {
      dropboxdate: req.body.datetimeactual,
      dropbox : req.body.toggle,
      dropboxcomment: req.body.flagactual,     
    };

    const updatedProduct = await ttreceipt.findByIdAndUpdate(
      receiptId,
      updateData,
      { new: true }
    );

    
    console.log(updatedProduct);
   
    res.redirect(`/ttreceiptall`);
    



  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/savetodo', async (req, res) => {
  try {
   
    
      console.log(req.body);

      const generalEdit = await todo.create({ name: req.body.todoactual , work: '1'});

   
    res.redirect(`/todo`);
    



  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/changetodoitem/:id', async (req, res) => {
    try {
        const generalEdit = await todo.findById(req.params.id);

        if (!generalEdit) {
            return res.status(404).send('Task not found');
        }

        res.render('todochange', { generalEdit });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/updatetodo/:id', async (req, res) => {
  try {
  
    const receiptId = req.params.id;
    
    const updateData = {
        name: req.body.todoactual,
        work: req.body.toggle
    };

    const updatedReceipt = await todo.findByIdAndUpdate(receiptId, updateData, { new: true }); 
    res.redirect(`/todo`);
    



  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/deletetodoitem/:id', async (req, res) => {
  try {
   
    const userId = req.params.id;
    const productEdit = await todo.findOneAndDelete({ _id: userId });
     
   
    res.redirect(`/todo`);
    



  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/saveetransport/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    
      console.log(req.body);
    const generalEdit = await ttreceipt.findOne({ _id: receiptId });
   
    const updateData = {
      transportdate: req.body.datetimeactual,
      transport : req.body.toggle,
      transportcomment: req.body.flagactual,     
    };

    const updatedProduct = await ttreceipt.findByIdAndUpdate(
      receiptId,
      updateData,
      { new: true }
    );
    console.log(updatedProduct);
   
    res.redirect(`/ttreceiptall`);
    



  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.post('/updatescaffolding/:id', async (req, res) => {

  const session = await mongoose.startSession();

  try {
    const receiptId = req.params.id;

    // Read the first value from form fields that may be arrays.
    const getValue = (key) => {
      const value = req.body[key];
      return Array.isArray(value) ? value[0] : value;
    };

    // Validate non-negative quantities.
    const getNumber = (value, fieldName) => {
      if (value === undefined || value === null || value === '') {
        return 0;
      }

      const number = Number(value);

      if (!Number.isFinite(number) || number < 0) {
        throw new Error(`Invalid quantity for ${fieldName}`);
      }

      return number;
    };

    await session.withTransaction(async () => {

      // =========================================
      // FIND EXISTING SCAFFOLDING RECORD
      // =========================================

      const existing = await scaffoldingout
        .findById(receiptId)
        .populate('returnscaffolding')
        .session(session);

      if (!existing) {
        throw new Error('Scaffolding record not found.');
      }

      console.log('Updating scaffolding:', receiptId);

      // =========================================
      // READ NEW ITEM QUANTITIES
      // =========================================

      const newStockValues = {

        cuplock10ftno: getNumber(
          getValue('Cuplock10ftscaffolding[]'),
          'Cuplock 10ft'
        ),

        cuplock5ftno: getNumber(
          getValue('Cuplock5ftscaffolding[]'),
          'Cuplock 5ft'
        ),

        cuplock8ftno: getNumber(
          getValue('Cuplock8ftscaffolding[]'),
          'Cuplock 8ft'
        ),

        ledger5ftno: getNumber(
          getValue('ledger5ftscaffolding[]'),
          'Ledger 5ft'
        ),

        ledger3ftno: getNumber(
          getValue('ledger3ftscaffolding[]'),
          'Ledger 3ft'
        ),

        ledger6ft5inchno: getNumber(
          getValue('ledger6.5ftscaffolding[]'),
          'Ledger 6.5ft'
        ),

        pinscaffoldingno: getNumber(
          getValue('pinscaffolding[]'),
          'Pin'
        ),

        wheelscaffolding: getNumber(
          getValue('wheelscaffolding[]'),
          'Wheel'
        ),

        woodernchaliscaffolding: getNumber(
          getValue('Woodernchali[]'),
          'Wooden Chali'
        ),

        steelchalscaffolding: getNumber(
          getValue('Steelchali[]'),
          'Steel Chali'
        ),

        // NEW ITEMS

        basejackno: getNumber(
          getValue('Basejackscaffolding[]'),
          'Base Jack'
        ),

        ledger1_5ftno: getNumber(
          getValue('ledger1.5ftscaffolding[]'),
          'Ledger 1.5ft'
        )
      };


      // =========================================
      // CHECK ALREADY RETURNED QUANTITIES
      // =========================================

      const returnedRecords = (
        existing.returnscaffolding || []
      ).filter(record => record && typeof record === 'object' && record._id);

      const alreadyReturnedBaseJack = returnedRecords.reduce(
        (total, record) => total + (Number(record.basejackno) || 0),
        0
      );

      const alreadyReturnedLedger1_5ft = returnedRecords.reduce(
        (total, record) => total + (Number(record.ledger1_5ftno) || 0),
        0
      );

      if (newStockValues.basejackno < alreadyReturnedBaseJack) {
        throw new Error(
          `Base Jack cannot be reduced below ${alreadyReturnedBaseJack}, as that quantity has already been returned.`
        );
      }

      if (newStockValues.ledger1_5ftno < alreadyReturnedLedger1_5ft) {
        throw new Error(
          `Ledger 1.5ft cannot be reduced below ${alreadyReturnedLedger1_5ft}, as that quantity has already been returned.`
        );
      }


      // =========================================
      // INVENTORY DIFFERENCE ADJUSTMENT
      // =========================================

      const inventoryMapping = [
        { name: 'Cuplock 10ft', field: 'cuplock10ftno' },
        { name: 'Cuplock 5ft', field: 'cuplock5ftno' },
        { name: 'Cuplock 8ft', field: 'cuplock8ftno' },
        { name: 'Ledger 5ft', field: 'ledger5ftno' },
        { name: 'Ledger 3ft', field: 'ledger3ftno' },
        { name: 'ledger 6.5ft', field: 'ledger6ft5inchno' },
        { name: 'Pin', field: 'pinscaffoldingno' },
        { name: 'Wheel', field: 'wheelscaffolding' },
        { name: 'Woodern Chali', field: 'woodernchaliscaffolding' },
        { name: 'Steel Chali', field: 'steelchalscaffolding' },

        // NEW INVENTORY ITEMS

        { name: 'Base Jack', field: 'basejackno' },
        { name: 'Ledger 1.5ft', field: 'ledger1_5ftno' }
      ];

      for (const stockItem of inventoryMapping) {

        const oldQuantity =
          Number(existing[stockItem.field]) || 0;

        const newQuantity =
          newStockValues[stockItem.field];

        // Positive difference means stock is returned.
        // Negative difference means additional stock is issued.

        const stockDifference = oldQuantity - newQuantity;

        if (stockDifference === 0) {
          continue;
        }

        const product = await productModel.findOne({
          itemName: stockItem.name
        }).session(session);

        if (!product) {
          throw new Error(
            `Inventory item not found: ${stockItem.name}`
          );
        }

        const currentStock =
          Number(product.workingQuantity) || 0;

        const updatedStock = currentStock + stockDifference;

        if (updatedStock < 0) {
          throw new Error(
            `Insufficient stock for ${stockItem.name}. Available: ${currentStock}, additional required: ${Math.abs(stockDifference)}`
          );
        }

        product.workingQuantity = updatedStock;

        await product.save({ session });

        console.log(
          `Stock updated: ${stockItem.name}`,
          {
            oldQuantity,
            newQuantity,
            stockDifference,
            updatedStock
          }
        );
      }


      // =========================================
      // UPDATE SCAFFOLDING DETAILS
      // =========================================

      const datetimeValue = getValue('datetimee[]');

      let scaffoldingDate = existing.Dateandtimescaffolding;

      if (datetimeValue) {
        scaffoldingDate = new Date(datetimeValue + 'Z');

        if (Number.isNaN(scaffoldingDate.getTime())) {
          throw new Error('Invalid scaffolding date.');
        }
      }

      const updateData = {

        Dateandtimescaffolding: scaffoldingDate,

        lengthoutscaffolding: getNumber(
          getValue('length[]'),
          'Length'
        ),

        heightoutscaffolding: getNumber(
          getValue('height[]'),
          'Height'
        ),

        quantityscaffolding: getNumber(
          getValue('quantityscaffolding[]'),
          'Scaffolding quantity'
        ),

        breadthscaffolding: getNumber(
          getValue('breadthscaffolding[]'),
          'Breadth'
        ),

        rentmultipledayscaffolding: getNumber(
          getValue('ratemultipledayscaffolding[]'),
          'Rate multiple days'
        ),

        numberofdaysscaffolding: getNumber(
          getValue('numberofdaysscaffolding[]'),
          'Number of days'
        ),

        rateafterdaysscaffolding: getNumber(
          getValue('Rentafterdaysscaffolding[]'),
          'Rate after days'
        ),

        // ALL SCAFFOLDING ITEM QUANTITIES

        ...newStockValues,

        // LABOUR AND TRANSPORT

        labourfitting: getValue('Labourup[]') || '',

        labourremoving: getValue('Labourdown[]') || '',

        transportgoing: getValue('Transportup[]') || '',

        transportcoming: getValue('Transportdown[]') || ''

      };

      Object.assign(existing, updateData);

      await existing.save({ session });

      console.log('Scaffolding updated successfully:', receiptId);

    });

    res.redirect(`/correctscaffolding/${receiptId}`);

  } catch (error) {

    console.error('Error updating scaffolding:', error);

    res.status(500).send(
      `Error updating scaffolding: ${error.message}`
    );

  } finally {

    await session.endSession();

  }

});




router.post('/savescaffolding/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    const datetimescaffolding = ensureArray(req.body['datetimee[]']);
    const lengthscaffolding = ensureArray(req.body['length[]']);
    const heightscaffolding = ensureArray(req.body['height[]']);
    const breadthscaffolding = ensureArray(req.body['breadthscaffolding[]']);
    const quantityscaffolding = ensureArray(req.body['quantityscaffolding[]']);
    const multipledaysscaffolding = ensureArray(req.body['ratemultipledayscaffolding[]']);
    const noofdaysscaffolding = ensureArray(req.body['numberofdaysscaffolding[]']);
    const rateafterdaysscaffolding = ensureArray(req.body['Rentafterdaysscaffolding[]']);

    const labourupsscaffolding = ensureArray(req.body['Labourup[]']);
    const labourdownsscaffolding = ensureArray(req.body['Labourdown[]']);
    const transportdownsscaffolding = ensureArray(req.body['Transportdown[]']);
    const transportupsscaffolding = ensureArray(req.body['Transportup[]']);

    // EXISTING SCAFFOLDING ITEMS
    const cuplock10ftoutscaffolding = ensureArray(req.body['Cuplock10ftscaffolding[]']);
    const cuplock5ftoutscaffolding = ensureArray(req.body['Cuplock5ftscaffolding[]']);
    const ledger5ftoutscaffolding = ensureArray(req.body['ledger5ftscaffolding[]']);
    const ledger3ftoutscaffolding = ensureArray(req.body['ledger3ftscaffolding[]']);
    const pinoutscaffolding = ensureArray(req.body['pinscaffolding[]']);
    const cuplock8ftoutscaffolding = ensureArray(req.body['Cuplock8ftscaffolding[]']);
    const ledger6ft5inchftoutscaffolding = ensureArray(req.body['ledger6.5ftscaffolding[]']);
    const wheelscaffolding = ensureArray(req.body['wheelscaffolding[]']);
    const Woodernchali = ensureArray(req.body['Woodernchali[]']);
    const Steelchali = ensureArray(req.body['Steelchali[]']);

    // NEW SCAFFOLDING ITEMS
    const basejackoutscaffolding = ensureArray(req.body['Basejackscaffolding[]']);
    const ledger1_5ftoutscaffolding = ensureArray(req.body['ledger1.5ftscaffolding[]']);

    if (!lengthscaffolding.length ||
        String(lengthscaffolding[0] || '').trim() === '' ||
        String(heightscaffolding[0] || '').trim() === '') {
      return res.status(400).send('Please enter scaffolding length and height.');
    }

    const receiptt = await ttreceipt.findById(receiptId);

    if (!receiptt) {
      return res.status(404).send('Receipt not found.');
    }

    // =========================================
    // PROCESS EACH SCAFFOLDING ROW
    // =========================================

    for (let i = 0; i < lengthscaffolding.length; i++) {

      if (
        String(lengthscaffolding[i] || '').trim() === '' ||
        String(heightscaffolding[i] || '').trim() === ''
      ) {
        continue;
      }

      const number = value => Math.max(0, Number(value) || 0);

      const cuplock10 = number(cuplock10ftoutscaffolding[i]);
      const cuplock5 = number(cuplock5ftoutscaffolding[i]);
      const cuplock8 = number(cuplock8ftoutscaffolding[i]);

      const ledger5 = number(ledger5ftoutscaffolding[i]);
      const ledger3 = number(ledger3ftoutscaffolding[i]);
      const ledger6_5 = number(ledger6ft5inchftoutscaffolding[i]);

      const pin = number(pinoutscaffolding[i]);
      const wheel = number(wheelscaffolding[i]);

      const woodenChali = number(Woodernchali[i]);
      const steelChali = number(Steelchali[i]);

      // NEW ITEMS
      const baseJack = number(basejackoutscaffolding[i]);
      const ledger1_5 = number(ledger1_5ftoutscaffolding[i]);

      // =========================================
      // DATE AND TIME
      // =========================================

      const datetimeString = String(datetimescaffolding[i] || '').trim()
        ? datetimescaffolding[i] + 'Z'
        : new Date().toISOString();

      // =========================================
      // SAVE SCAFFOLDING OUT RECORD
      // =========================================

      const newscaffolding = await scaffoldingout.create({

        Dateandtimescaffolding: datetimeString,

        lengthoutscaffolding: lengthscaffolding[i],
        heightoutscaffolding: heightscaffolding[i],
        quantityscaffolding: quantityscaffolding[i],
        breadthscaffolding: breadthscaffolding[i],

        rentmultipledayscaffolding: multipledaysscaffolding[i],
        numberofdaysscaffolding: noofdaysscaffolding[i],
        rateafterdaysscaffolding: rateafterdaysscaffolding[i],

        // EXISTING ITEMS
        cuplock10ftno: cuplock10,
        cuplock5ftno: cuplock5,
        cuplock8ftno: cuplock8,

        ledger5ftno: ledger5,
        ledger3ftno: ledger3,
        ledger6ft5inchno: ledger6_5,

        pinscaffoldingno: pin,

        wheelscaffolding: wheel,
        woodernchaliscaffolding: woodenChali,
        steelchalscaffolding: steelChali,

        // NEW ITEMS
        basejackno: baseJack,
        ledger1_5ftno: ledger1_5,

        // LABOUR AND TRANSPORT
        labourfitting: labourupsscaffolding[i],
        labourremoving: labourdownsscaffolding[i],
        transportgoing: transportupsscaffolding[i],
        transportcoming: transportdownsscaffolding[i]

      });

      // =========================================
      // DEDUCT INVENTORY
      // =========================================

      const stockItems = [
        { name: 'Cuplock 10ft', quantity: cuplock10 },
        { name: 'Cuplock 5ft', quantity: cuplock5 },
        { name: 'Cuplock 8ft', quantity: cuplock8 },
        { name: 'Ledger 5ft', quantity: ledger5 },
        { name: 'Ledger 3ft', quantity: ledger3 },
        { name: 'ledger 6.5ft', quantity: ledger6_5 },
        { name: 'Pin', quantity: pin },
        { name: 'Wheel', quantity: wheel },
        { name: 'Woodern Chali', quantity: woodenChali },
        { name: 'Steel Chali', quantity: steelChali },

        // NEW ITEMS
        { name: 'Base Jack', quantity: baseJack },
        { name: 'Ledger 1.5ft', quantity: ledger1_5 }
      ];

      for (const stockItem of stockItems) {

        if (stockItem.quantity <= 0) continue;

        const product = await productModel.findOne({
          itemName: stockItem.name
        });

        if (!product) {
          throw new Error(
            `Inventory product not found: ${stockItem.name}`
          );
        }

        product.workingQuantity =
          (Number(product.workingQuantity) || 0) - stockItem.quantity;

        await product.save();
      }

      // =========================================
      // LINK SCAFFOLDING TO RECEIPT
      // =========================================

      receiptt.scaffoldingitemreceipt.push(newscaffolding._id);

      await receiptt.save();

      console.log('Scaffolding saved:', newscaffolding._id);
    }

    console.log('Scaffolding issue completed successfully.');

    res.redirect(`/return/${receiptId}`);

  } catch (error) {
    console.error('Error saving scaffolding:', error);
    res.status(500).send('Error saving scaffolding: ' + error.message);
  }
});



router.post('/savefarma/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    const updateData = {
      nutboltfarma : req.body.nutboltfarma,  
      keyfarma :   req.body.keyfarma, 
    };
        const updatedProduct = await ttreceipt.findByIdAndUpdate(
          receiptId,
            updateData,
            { new: true } 
        );
        
        if (!updatedProduct) {
            return res.status(404).send('Product not found');
        }
        
      
    const datetimefarma = ensureArray(req.body['datetimefarma[]']);
    const length1farma = ensureArray(req.body['length1[]']);
    const length2farma = ensureArray(req.body['length2[]']);
    const quantityfarma = ensureArray(req.body['quantityfarma[]']);
    const ratefarma = ensureArray(req.body['ratefarma[]']);
    
    console.log(datetimefarma);

    const heightfarmaa = ensureArray(req.body['heightfarma[]']);
    
    console.log(heightfarmaa);

    const farmaplate9inch = ensureArray(req.body['farmaplate9inch[]']);
    const farmaplate12inch = ensureArray(req.body['farmaplate12inch[]']);
    const farmaplate15inch = ensureArray(req.body['farmaplate15inch[]']);
    const farmaplate18inch = ensureArray(req.body['farmaplate18inch[]']);
    const farmaplate21inch = ensureArray(req.body['farmaplate21inch[]']);
    const farmaplate24inch = ensureArray(req.body['farmaplate24inch[]']);
    const farmaplate27inch = ensureArray(req.body['farmaplate27inch[]']);

    console.log(length1farma.length);
    console.log(length2farma.length );
    console.log(length1farma);
    console.log(length2farma );
    console.log('farmaplate');
    
    if((length1farma.every(value => typeof value === 'string' && value.trim() !== '') &&
    length2farma.every(value => typeof value === 'string' && value.trim() !== '')))
    {
    
      for (let i = 0; i < datetimefarma.length; i++) 
      {
    
    const newfarmaout = await farmaout.create({
    
      Dateandtimefarma: datetimefarma[i]+ 'Z',
        length1farma: length1farma[i],
        length2farma: length2farma[i],
        heightfarma: heightfarmaa[i],
        plate9inchfarma: farmaplate9inch[i],
        plate12inchfarma:farmaplate12inch[i],
        plate15inchfarma:farmaplate15inch[i],
        plate18inchfarma:farmaplate18inch[i],
        plate21inchfarma:farmaplate21inch[i],
        plate24inchfarma: farmaplate24inch[i],
        plate27inchfarma:farmaplate27inch[i],
        rentpersetfarma:ratefarma[i],
        noofsetsfarma:quantityfarma[i],
      });
    
    
    
    let heightfinall;
    
    
    if (heightfarmaa[i] == 'Height 5ft'){
      heightfinall = 3;
    }
    else if (heightfarmaa[i] == 'Height 6ft'){
      heightfinall = 4;
    }
    else if (heightfarmaa[i] == 'Height 9ft'){
      heightfinall = 5;
    }
    else if (heightfarmaa[i] == 'Height 10ft'){
      heightfinall = 6;
    }
    
      const farma9inchquantity = await productModel.findOne({
        itemName: 'Farma plate 9" ',     
        itemCategory : heightfinall,
      });
    
    
      farma9inchquantity.workingQuantity = farma9inchquantity.workingQuantity-farmaplate9inch[i];
      await farma9inchquantity.save();
    
      const farma12inchquantity = await productModel.findOne({
        itemName: 'Farma plate 12"',     
        itemCategory:heightfinall,
      });
      console.log(farma12inchquantity);
      farma12inchquantity.workingQuantity = farma12inchquantity.workingQuantity-farmaplate12inch[i];
      await farma12inchquantity.save();
    
      const farma15inchquantity = await productModel.findOne({
        itemName: 'Farma plate 15"',     
        itemCategory:heightfinall,
      });
      farma15inchquantity.workingQuantity = farma15inchquantity.workingQuantity-farmaplate15inch[i];
      await farma15inchquantity.save();
    
      const farma18inchquantity = await productModel.findOne({
        itemName: 'Farma plate 18"',     
        itemCategory:heightfinall,
      });
      farma18inchquantity.workingQuantity = farma18inchquantity.workingQuantity-farmaplate18inch[i];
      await farma18inchquantity.save();
    
      const farma21inchquantity = await productModel.findOne({
        itemName: 'Farma plate 21"',     
        itemCategory:heightfinall,
      });
      farma21inchquantity.workingQuantity = farma21inchquantity.workingQuantity-farmaplate21inch[i];
      await farma21inchquantity.save();
    
      const farma24inchquantity = await productModel.findOne({
        itemName: 'Farma plate 24"',     
        itemCategory:heightfinall,
      });
      farma24inchquantity.workingQuantity = farma24inchquantity.workingQuantity-farmaplate24inch[i];
      await farma24inchquantity.save();
    
      const farma27inchquantity = await productModel.findOne({
        itemName: 'Farma plate 27"',     
        itemCategory:heightfinall,
      });
      farma27inchquantity.workingQuantity = farma27inchquantity.workingQuantity-farmaplate27inch[i];
      await farma27inchquantity.save();

    const receiptt = await ttreceipt.findOne({ _id: receiptId });    
  receiptt.farmaitemreceipt.push(newfarmaout.id);  
  await receiptt.save();

  



    }

    res.redirect(`/return/${receiptId}`);

  }    
   
  


  
   

    

  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});






router.get('/ttrecipt2', async (req, res) => {
  try {
    // Fetch data from MongoDB
    const allproducts = await productModel.find();
    const allclients = await Client.find();


    // Render the EJS template with data
    res.render('receiptt2', { allproducts, allclients });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/itemname/:itemname', async (req, res) => {
  try {
    const searchText = req.params.itemname;
    const regex = new RegExp(`${searchText}`, 'i');
    const items = await productModel.find({ itemName: { $regex: regex } });

    if (items.length > 0) {
      res.json(items);
    } else {
      console.log("No items found");
      res.status(404).json({ error: "No items found" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});





router.post('/ttrecipt2', async (req, res) => {
  console.log(req.body);

});

router.post('/moneytransaction/:moneytransaction', isLoggedIn , async (req, res) => {
  try {
    const receiptId = req.params.moneytransaction;

    const  user = await userModel.findOne({username : req.session.passport.user})
    // Validate incoming data
    
    console.log(req.body.datetimee);
    const dateTime = new Date(req.body.datetimee);
    console.log(dateTime);

    const moneyin = await moneyinandout.create({
      inandout: req.body.itemCategory,
      amount: req.body.amounttr,
      Dateandtimeinandout: req.body.datetimee +  'Z', 
      modeofpayment : req.body.modeofpayment,
      comment: req.body.comment,
    });

    const receiptt = await ttreceipt.findById(receiptId); 

    if (!receiptt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    receiptt.moneyreceipt.push(moneyin._id);
    await receiptt.save();
    try {
      const datetime = moment.utc().toDate(); 
      const daybookEntry = await Daybook.create({
    
        daybookinandout: 'New Cash credited ' + receiptt.receiptChallannumber + ' for Amount of Rs ' + req.body.amounttr + ' ( ' + req.body.comment + ' ) ' ,
        Dateandtimedaybook: datetime,
        maker: user.username,
    
      });
      console.log('Daybook entry created:', daybookEntry);
    } catch (error) {
      console.error('Error creating daybook entry:', error);
    }
    res.redirect(`/addmoney/${receiptId}`);
  } catch (error) {
    console.error('Error creating money transaction:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/addtransactiondashboard', async (req, res) => {
  try {
    const { datetimee, itemCategory, amounttr, comment, modeofpayment } = req.body;

    // Log the received input values
    console.log('Received data:', { datetimee, itemCategory, amounttr, comment, modeofpayment });

    // Create a new transaction
    const moneyin = await moneyinandout.create({
      inandout: itemCategory,
      amount: parseFloat(amounttr),
      Dateandtimeinandout: moment.utc(datetimee, 'YYYY-MM-DDTHH:mm').toDate(),
      comment: comment,
      modeofpayment: modeofpayment || 'cash', // Default to 'cash' if not provided
    });

    res.redirect('/ttdashboard');
  } catch (error) {
    console.error('Error creating money transaction:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/addtransactionlabour/:moneytransaction', async (req, res) => {
  try {
    const receiptId = req.params.moneytransaction;
    const { datetimee, itemCategory, amounttr, comment, modeofpayment } = req.body;

    // Log the received input values
    console.log('Received data:', { datetimee, itemCategory, amounttr, comment, modeofpayment });

    // Create a new money transaction
    const moneyin = await moneyinandout.create({
      inandout: itemCategory,
      amount: parseFloat(amounttr),
      Dateandtimeinandout: moment.utc(datetimee, 'YYYY-MM-DDTHH:mm').toDate(),
      comment: comment + ' ' + 'Employee payment',
      modeofpayment: modeofpayment || 'cash',
    });

    // Add the moneyin transaction ID to the advances array of the Labour document
    await Labour.findByIdAndUpdate(receiptId, { $push: { advances: moneyin._id } });

    // Redirect to the employee details page with the correct receiptId
    res.redirect('/detailemployee/' + receiptId);
  } catch (error) {
    console.error('Error creating money transaction:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});




  
  router.post('/updateadditionalcharges/:id', async (req, res) => {
 
    try {
      console.log(req.body);
      const receiptId = req.params.id; 
      
      const Additionalchargesnames = ensureArray(req.body['Additionalchargesname[]']);
      const AdditionalchargesAmounts = ensureArray(req.body['AdditionalchargesAmount[]']);   
  
      const receiptt = await ttreceipt.findById(receiptId); // Fetch the receipt document
      
      if (receiptt && Additionalchargesnames && AdditionalchargesAmounts) {
        for (let i = 0; i < Additionalchargesnames.length; i++) {
          const currentAdditionalchargesname = Additionalchargesnames[i];
          const currentAdditionalchargesAmount = AdditionalchargesAmounts[i];
  
          try {
            const product = await additionalcharge.create({
              additionalchargesName: currentAdditionalchargesname,
              additionalchargesCost: currentAdditionalchargesAmount,
              recieptt: receiptId,
            });
            
            receiptt.additionalcharges.push(product._id); // Push the additional charge ID
            await receiptt.save(); // Save the changes to the receipt
          } catch (error) {
            console.error(`Error saving data for ${currentAdditionalchargesname}:`, error);
          }
        
        }
      } else {
        console.error('Invalid request or missing data');
        res.status(400).send('Bad Request');
      }
      res.redirect(`/editadditionalcharges/${receiptt.id}`);
    } catch (error) {
      console.error('Error processing additional charges:', error);
      res.status(500).send('Internal Server Error');
    }
      });

      


router.get('/sample', (req, res) => {
  res.render('sample.ejs');
});

router.post('/sample', async (req, res) => {
  console.log(req.body);
  });

  router.post('/sample2', async (req, res) => {
    console.log(req.body);
    });


router.get('/scaffolding', (req, res) => {
  res.render('scaffolding');
});

router.get('/ttproductbuy', (req, res) => {
  // Render the 'receiptfinal1' view
  res.render('buyitemtt');
});

router.get('/scaf2', (req, res) => {
  res.render('scaf2');
});

router.post('/scaf2', (req, res) => {
 console.log(req.body);
});






router.post('/receipt12', async (req, res) => {
  try {

    console.log(req.body);

    const items = ensureArray(req.body['item[]']);
    const quantities = ensureArray(req.body['quantity[]']);
    const datetimes = ensureArray(req.body['datetime[]']);
    const rents = ensureArray(req.body['rent[]']);

    if (items.length === quantities.length && quantities.length === datetimes.length && datetimes.length === rents.length) {
      for (let i = 0; i < items.length; i++) {
        const itemWithStock = items[i];
        
        // Extract only the item name using a regular expression
        const itemName = itemWithStock.replace(/\s*\(\d+\sin\sstock\)/i, '');

        const quantity = parseInt(quantities[i]);
        const datetimeString = datetimes[i];

        // Parse the datetimeString using moment.js and convert to UTC
        const datetime = moment.utc(datetimeString).toDate();

        try {
          const product = await generalout.create({
            itemoutname: itemName,
            Quantity: quantity,
            Dateandtime: datetime,
            rent: parseFloat(rents[i]),
          });
          
          const existingClient = await productModel.findOne({
            itemName: itemName,
          });
          
          if (existingClient) {
            existingClient.workingQuantity = existingClient.workingQuantity - quantity;
          
            

            await existingClient.save();
          
            console.log('workingQuantity updated successfully');


          } else {
            console.log('Client not found in the database');
          }
          
          const receiptId = req.params.id;

          const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
          console.log('one');
          console.log(receiptEdit);
        } catch (error) {
          console.error(`Error saving data for ${itemName}:`, error);
        }
      }

      res.status(200).send('Form data saved successfully');
    } else {
      console.error('Mismatched array lengths in the input data.');
      res.status(400).send('Invalid input data');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
 });









 router.post('/savedata/:id', async function(req, res) {
  try {
console.log(req.body);
    const items = ensureArray(req.body['item[]']);
    const quantities = ensureArray(req.body['quantity[]']);
    const datetimes = ensureArray(req.body['datetime[]']);
    const rents = ensureArray(req.body['rent[]']);
    const receiptId = req.params.id;
    if (items.length === quantities.length && quantities.length === datetimes.length && datetimes.length === rents.length) {
      for (let i = 0; i < items.length; i++) {
        const itemWithStock = items[i];
        
        // Extract only the item name using a regular expression
        const itemName = itemWithStock.replace(/\s*\(\d+\sin\sstock\)/i, '');

        const quantity = parseInt(quantities[i]);
        const datetimeString = datetimes[i];

        // Parse the datetimeString using moment.js and convert to UTC
        const datetime = moment.utc(datetimeString).toDate();

        try {
          const product = await generalout.create({
            itemoutname: itemName,
            Quantity: quantity,
            Dateandtime: datetime,
            rent: parseFloat(rents[i]),
          });
          
          const existingClient = await productModel.findOne({
            itemName: itemName,
          });
          
          if (existingClient) {
            existingClient.workingQuantity = existingClient.workingQuantity - quantity;
            await existingClient.save();
          

            console.log('workingQuantity updated successfully');
          } 
          else {
            console.log('Client not found in the database');
          }
          

          const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
          
          
          receiptEdit.generalitemreceipt.push(product.id);  
          await receiptEdit.save();
           
          console.log('done');


          console.log(`Data for ${itemName} saved successfully`);
        } catch (error) {
          console.error(`Error saving data for ${itemName}:`, error);
        }
      }
      console.log(receiptId)
      res.redirect(`/return/${receiptId}`);

    } else {
      console.error('Mismatched array lengths in the input data.');
      res.status(400).send('Invalid input data');
    }
  }
  
  
  
  catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/receiptfinal', async function(req, res) {
  try {

    console.log(req.body);

    const items = ensureArray(req.body['item[]']);
    const quantities = ensureArray(req.body['quantity[]']);
    const datetimes = ensureArray(req.body['datetime[]']);
    const rents = ensureArray(req.body['rent[]']);

    if (items.length === quantities.length && quantities.length === datetimes.length && datetimes.length === rents.length) {
      for (let i = 0; i < items.length; i++) {
        const itemWithStock = items[i];
        
        // Extract only the item name using a regular expression
        const itemName = itemWithStock.replace(/\s*\(\d+\sin\sstock\)/i, '');

        const quantity = parseInt(quantities[i]);
        const datetimeString = datetimes[i];

        // Parse the datetimeString using moment.js and convert to UTC
        const datetime = moment.utc(datetimeString).toDate();

        try {
          const product = await generalout.create({
            itemoutname: itemName,
            Quantity: quantity,
            Dateandtime: datetime,
            rent: parseFloat(rents[i]),
          });
          
          const existingClient = await productModel.findOne({
            itemName: itemName,
          });
          
          if (existingClient) {
            existingClient.workingQuantity = existingClient.workingQuantity - quantity;
          
            // Save the updated document to the database
            await existingClient.save();
          
            console.log('workingQuantity updated successfully');
          } else {
            console.log('Client not found in the database');
          }
          


          console.log(`Data for ${itemName} saved successfully`);
        } catch (error) {
          console.error(`Error saving data for ${itemName}:`, error);
        }
      }

      res.status(200).send('Form data saved successfully');
    } else {
      console.error('Mismatched array lengths in the input data.');
      res.status(400).send('Invalid input data');
    }
  }
  
  
  
  catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



function ensureArray(value) {
  return Array.isArray(value) ? value : [value];
}




router.get('/generaloutall', async (req, res) => {
  const allproducts = await generalout.find();
  res.send({ allproducts });
 });




router.get('/sample2', (req, res) => {
  res.render('sample2');
 });

 router.get('/receiptfinal2', async (req, res) => {

  const allproducts = await productModel.find();
  
  res.render('receiptfinal2', { allproducts});
 });

 router.get('/receiptfinal3', async (req, res) => {

  const allproducts = await productModel.find();
  
  res.render('receiptfinal3', { allproducts});
 });

 router.post('/receiptfinal2', (req, res) => {
  console.log(req.body);
 });


 router.post('/receiptfinal3', async (req, res) => {
  console.log(req.body);
  
const datetimefarma = ensureArray(req.body['datetimefarma[]']);
const length1farma = ensureArray(req.body['length1[]']);
const length2farma = ensureArray(req.body['length2[]']);
const quantityfarma = ensureArray(req.body['quantityfarma[]']);
const ratefarma = ensureArray(req.body['ratefarma[]']);

console.log(datetimefarma);
const heightfarmaa = ensureArray(req.body['heightfarma[]']);

console.log(heightfarmaa);
const farmaplate9inch = ensureArray(req.body['farmaplate9inch[]']);
const farmaplate12inch = ensureArray(req.body['farmaplate12inch[]']);
const farmaplate15inch = ensureArray(req.body['farmaplate15inch[]']);
const farmaplate18inch = ensureArray(req.body['farmaplate18inch[]']);
const farmaplate21inch = ensureArray(req.body['farmaplate21inch[]']);
const farmaplate24inch = ensureArray(req.body['farmaplate24inch[]']);
const farmaplate27inch = ensureArray(req.body['farmaplate27inch[]']);
if(length1farma && length2farma || farmaplate9inch || farmaplate12inch || farmaplate15inch || farmaplate18inch || farmaplate21inch || farmaplate24inch || farmaplate27inch){

  for (let i = 0; i < datetimefarma.length; i++) 
  {

const newfarmaout = await farmaout.create({

    Dateandtimescaffolding: datetimefarma[i]+ 'Z',
    length1farma: length1farma[i],
    length2farma: length2farma[i],
    heightfarma: heightfarmaa[i],
    plate9inchfarma: farmaplate9inch[i],
    plate12inchfarma:farmaplate12inch[i],
    plate15inchfarma:farmaplate15inch[i],
    plate18inchfarma:farmaplate18inch[i],
    plate21inchfarma:farmaplate21inch[i],
    plate24inchfarma: farmaplate24inch[i],
    plate27inchfarma:farmaplate27inch[i],
    rentpersetfarma:ratefarma[i],
    noofsetsfarma:quantityfarma[i],
  });

let heightfinall;


if (heightfarmaa[i] == 'Height 5ft'){
  heightfinall = 3;
}
else if (heightfarmaa[i] == 'Height 6ft'){
  heightfinall = 4;
}
else if (heightfarmaa[i] == 'Height 9ft'){
  heightfinall = 5;
}
else if (heightfarmaa[i] == 'Height 10ft'){
  heightfinall = 6;
}

  const farma9inchquantity = await productModel.findOne({
    itemName: 'Farma plate 9" ',     
    itemCategory : heightfinall,
  });


  farma9inchquantity.workingQuantity = farma9inchquantity.workingQuantity-farmaplate9inch[i];
  await farma9inchquantity.save();

  const farma12inchquantity = await productModel.findOne({
    itemName: 'Farma plate 12"',     
    itemCategory:heightfinall,
  });
  console.log(farma12inchquantity);
  farma12inchquantity.workingQuantity = farma12inchquantity.workingQuantity-farmaplate12inch[i];
  await farma12inchquantity.save();

  const farma15inchquantity = await productModel.findOne({
    itemName: 'Farma plate 15"',     
    itemCategory:heightfinall,
  });
  farma15inchquantity.workingQuantity = farma15inchquantity.workingQuantity-farmaplate15inch[i];
  await farma15inchquantity.save();

  const farma18inchquantity = await productModel.findOne({
    itemName: 'Farma plate 18"',     
    itemCategory:heightfinall,
  });
  farma18inchquantity.workingQuantity = farma18inchquantity.workingQuantity-farmaplate18inch[i];
  await farma18inchquantity.save();

  const farma21inchquantity = await productModel.findOne({
    itemName: 'Farma plate 21"',     
    itemCategory:heightfinall,
  });
  farma21inchquantity.workingQuantity = farma21inchquantity.workingQuantity-farmaplate21inch[i];
  await farma21inchquantity.save();

  const farma24inchquantity = await productModel.findOne({
    itemName: 'Farma plate 24"',     
    itemCategory:heightfinall,
  });
  farma24inchquantity.workingQuantity = farma24inchquantity.workingQuantity-farmaplate24inch[i];
  await farma24inchquantity.save();

  const farma27inchquantity = await productModel.findOne({
    itemName: 'Farma plate 27"',     
    itemCategory:heightfinall,
  });
  farma27inchquantity.workingQuantity = farma27inchquantity.workingQuantity-farmaplate27inch[i];
  await farma27inchquantity.save();
  console.log(i);
  }



}



 });

router.get('/sample2', async (req, res) => {
  res.render('sample2');
  if(length1farma && length2farma || farmaplate9inch || farmaplate12inch || farmaplate15inch || farmaplate18inch || farmaplate21inch || farmaplate24inch || farmaplate27inch){

    for (let i = 0; i < datetimefarma.length; i++) 
    {
  
  const newfarmaout = await farmaout.create({
  
      Dateandtimescaffolding: datetimefarma[i]+ 'Z',
      length1farma: length1farma[i],
      length2farma: length2farma[i],
      heightfarma: heightfarmaa[i],
      plate9inchfarma: farmaplate9inch[i],
      plate12inchfarma:farmaplate12inch[i],
      plate15inchfarma:farmaplate15inch[i],
      plate18inchfarma:farmaplate18inch[i],
      plate21inchfarma:farmaplate21inch[i],
      plate24inchfarma: farmaplate24inch[i],
      plate27inchfarma:farmaplate27inch[i],
      rentpersetfarma:ratefarma[i],
      noofsetsfarma:quantityfarma[i],
    });
  
  let heightfinall;
  
  
  if (heightfarmaa[i] == 'Height 5ft'){
  }
  else if (heightfarmaa[i] == 'Height 6ft'){
    heightfinall = 4;
  }
  else if (heightfarmaa[i] == 'Height 9ft'){
    heightfinall = 5;
  }
  else if (heightfarmaa[i] == 'Height 10ft'){
    heightfinall = 6;
  }
  
    const farma9inchquantity = await productModel.findOne({
      itemName: 'Farma plate 9" ',     
      itemCategory : heightfinall,
    });
  
    console.log(farma9inchquantity);
    farma9inchquantity.workingQuantity = farma9inchquantity.workingQuantity-farmaplate9inch[i];
    await farma9inchquantity.save();
  
    const farma12inchquantity = await productModel.findOne({
      itemName: 'Farma plate 12"',     
      itemCategory:heightfinall,
    });
    console.log(farma12inchquantity);
    farma12inchquantity.workingQuantity = farma12inchquantity.workingQuantity-farmaplate12inch[i];
    await farma12inchquantity.save();
  
    const farma15inchquantity = await productModel.findOne({
      itemName: 'Farma plate 15"',     
      itemCategory:heightfinall,
    });
    farma15inchquantity.workingQuantity = farma15inchquantity.workingQuantity-farmaplate15inch[i];
    await farma15inchquantity.save();
  
    const farma18inchquantity = await productModel.findOne({
      itemName: 'Farma plate 18"',     
      itemCategory:heightfinall,
    });
    farma18inchquantity.workingQuantity = farma18inchquantity.workingQuantity-farmaplate18inch[i];
    await farma18inchquantity.save();
  
    const farma21inchquantity = await productModel.findOne({
      itemName: 'Farma plate 21"',     
      itemCategory:heightfinall,
    });
    farma21inchquantity.workingQuantity = farma21inchquantity.workingQuantity-farmaplate21inch[i];
    await farma21inchquantity.save();
  
    const farma24inchquantity = await productModel.findOne({
      itemName: 'Farma plate 24"',     
      itemCategory:heightfinall,
    });
    farma24inchquantity.workingQuantity = farma24inchquantity.workingQuantity-farmaplate24inch[i];
    await farma24inchquantity.save();
  
    const farma27inchquantity = await productModel.findOne({
      itemName: 'Farma plate 27"',     
      itemCategory:heightfinall,
    });
    farma27inchquantity.workingQuantity = farma27inchquantity.workingQuantity-farmaplate27inch[i];
    await farma27inchquantity.save();
    console.log('done3');
    }
  
  
  
  }
 });


 router.get('/sample3', (req, res) => {
  res.render('sample3');
 });

 router.get('/sample3', (req, res) => {
  res.render('sample3.ejs');
});

router.get('/money', (req, res) => {
  res.render('money');
 });


 router.get('/navbar', isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    res.render('nav bar/navbar', { user });
  } catch (error) {
    console.error('Error fetching user:', error);
    next(error);
  }
});


router.post('/sample2', async (req, res) => {
console.log(req.body);
 });




 router.post('/sample3', async (req, res) => {
  console.log(req.body);
   });


   router.get('/check', (req, res) => {
    res.render('check.ejs');
  });



  router.get('/edit/:id', async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Use the correct field to query for the existing product
      const productEdit = await productModel.findOne({ _id: userId });
  
      if (productEdit) {
        res.render('productedit', { productEdit }); // Pass the product information as an object
      } else {
        // Handle the case where the product with the given ID is not found
        res.status(404).send('Product not found');
      }
    } catch (error) {
      // Handle any potential errors (e.g., database errors)
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });



  router.get('/editdatereceipt/:id', async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Use the correct field to query for the existing product
      const productEdit = await ttreceipt.findOne({ _id: userId });



  
      if (productEdit) {
        res.render('productdateedit', { productEdit }); 
      } else {
        // Handle the case where the product with the given ID is not found
        res.status(404).send('Product not found');
      }
    } catch (error) {
      // Handle any potential errors (e.g., database errors)
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  

  router.post('/clearorder/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      
      const productEdit = await ttreceipt.findOne({ _id: userId }).populate('receiptclientname');
  
      if (productEdit) {
        productEdit.final = 1;
        await productEdit.save();
  
        const moneyin = await moneyinandout.create({
  inandout: req.body.moneydeborcre,
  amount: req.body.Finalamount,
  receipt: userId,
  Dateandtimeinandout: req.body.datetimeclear + 'Z',
  modeofpayment: req.body.modeofpayment,
  transactionType: 'Rent',
  comment:
    'recipt clear ' +
    productEdit.receiptChallannumber +
    ' ' +
    productEdit.receiptclientname.clientName,
});
        
        productEdit.moneyreceipt.push(moneyin.id);
        await productEdit.save();
  const io = req.app.get('io'); // get io instance

io.emit('receiptCleared', {
  receiptId: productEdit.receiptChallannumber,
  clientName: productEdit.receiptclientname.clientName,
  amount: req.body.Finalamount,
  time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
});

        const genid = productEdit.generalitemreceipt;
        for (let i = 0; i < genid.length; i++) {
          const generalid = genid[i];
  
          // Find the corresponding general item document
          const generalin = await generalout.findOne({ _id: generalid });
          if (generalin) {
            const generalinin = generalin.onngoing;
            let finalin = 0;
            for (let j = 0; j < generalinin.length; j++) {
              const generaltotalin = await returnitem.findOne({ _id: generalinin[j] });
              finalin += generaltotalin.quantity;
            }
  
            try {
              const gennn = generalin.Quantity - finalin;
              const returnData = await returnitem.create({
                Itemname: generalin.itemoutname,
                comment: "account clear ",
                quantity: gennn,
                returndateActual: req.body.datetimeclear + 'Z',
                returndateAt: req.body.datetimeclear + 'Z',
                ongoing: generalid,
                receipt: userId,
              });
              console.log(returnData);
  
              const existingClient = await productModel.findOne({
                itemName: generalin.itemoutname,
              });
              if (existingClient) {
                existingClient.workingQuantity += gennn;
                await existingClient.save();
                console.log('workingQuantity updated successfully');
              } else {
                console.log('Client not found in the database');
              }
  
              // Re-fetch the receipt document and update its generalinreceipt array
              const receiptEditAgain = await ttreceipt.findOne({ _id: userId });
              receiptEditAgain.generalinreceipt.push(returnData.id);
              await receiptEditAgain.save();
  
              // Update the generalout document's ongoing array
              const Addin = await generalout.findOne({ _id: generalid });
              Addin.onngoing.push(returnData.id);
              await Addin.save();
            } catch (error) {
              console.error('Error saving data for generalid ' + generalid, error);
            }
          }
        }
  
        res.redirect('/ttreceiptall');
      } else {
        // Handle the case where the product with the given ID is not found
        res.status(404).send('Product not found');
      }
    } catch (error) {
      // Handle any potential errors (e.g., database errors)
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  


router.get("/newquotation", async (req, res) => {

    

    const lastQuotation = await Quotation.findOne().sort({ _id: -1 });

    let quotationNo = "TTQ-00001";

    if (lastQuotation) {
        const lastNumber = parseInt(lastQuotation.quotationNo.replace("TTQ-", ""));
        quotationNo = "TTQ-" + String(lastNumber + 1).padStart(5, "0");
    }

    const todayDate = new Date();

const today = todayDate.toISOString().split("T")[0];

const validTillDate = new Date(todayDate);
validTillDate.setDate(validTillDate.getDate() + 15);

const validTill = validTillDate.toISOString().split("T")[0];

    res.render("newquotation", {
        quotationNo,
    today,
    validTill
    });

});


  router.post('/client/:id/update', async (req, res) => {
    try {

        await Sale.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                phone: req.body.phone,
                address: req.body.address,
                gstNumber: req.body.gstNumber
            }
        );

        res.json({ success: true });

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});





  router.get('/undoclear/:id', async (req, res) => {
    try {
      const userId = req.params.id;
      const productEdit = await ttreceipt.findOne({ _id: userId });
  
      if (productEdit) {
        productEdit.final = 0;
        await productEdit.save();
      }
  
      res.redirect('/ttreceiptall'); 
    } catch (error) {
      console.error('Error saving data:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

router.post('/toggleFlag/:id', async (req, res) => {
  const productId = req.params.id;
  const currentFlag = req.body.currentFlag;

  // Perform the logic to toggle the flag in your MongoDB model
  // Update the flag and get the updated document
  const updatedDocument = await ttreceipt.findByIdAndUpdate(productId, { flag: 1 - currentFlag }, { new: true });

  // Respond with the updated document
  res.json({ flag: updatedDocument.flag });
});







  router.get('/editclient/:id', async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Use the correct field to query for the existing product
      const productEdit = await Client.findOne({ _id: userId });
  
      if (productEdit) {
        res.render('clientedit', { productEdit }); // Pass the product information as an object
      } else {
        // Handle the case where the product with the given ID is not found
        res.status(404).send('Product not found');
      }
    } catch (error) {
      // Handle any potential errors (e.g., database errors)
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });


 router.get('/pdf-receipt/:id', async (req, res) => {
  try {
    console.log('--------');
    const receiptId = req.params.id;
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
   
    const receiptEdit = await ttreceipt
      .findOne({ _id: receiptId })
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate({
        path: 'scaffoldingitemreceipt',
        populate: {
          path: 'onngoing',
          model: 'returnitem', // Assuming the model name for returnitem
        },
      })
      .populate({
        path: 'generalitemreceipt',
        populate: {
          path: 'onngoing',
          model: 'returnitem', // Assuming the model name for returnitem
        },
      })
      .populate('moneyreceipt')
      .populate('generalinreceipt')
      .populate('farmaitemreceipt');
console.log('--------------------------------');
    await generatePDF(res, receiptEdit);
   
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function generatePDF(res, receiptEdit) {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the page size to A5
    await page.setContent('<html><body></body></html>');  // Set content to initialize the page
    await page.pdf({ format: 'A5' });

    // Add the style tag for the background image
    await page.addStyleTag({
      content: `
        .title {
         
          background-size: contain;
          background-repeat: no-repeat;
          height: 100px;
        }
      `,
    });

    // Use the PDF-specific EJS file for rendering content
    const content = await ejs.renderFile('views/pdf-receipt.ejs', { receiptEdit });

    await page.setContent(content, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf();

    await browser.close();

    // Set response headers for inline PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=pdf-receipt.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal Server Error');
  }
}


const puppeteercore = require('puppeteer-core');
router.get('/pdf-receipt2', async (req, res) => {
  try {
   
    
    await generatePDdF(res);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal Server Error');
  }
});

async function generatePDdF(res) {
  try {
    // Launch Puppeteer using default executable path
    const browser = await puppeteercore.launch();
    const page = await browser.newPage();

    // Set the page size to A5
    await page.setContent('<html><body></body></html>');  
    await page.pdf({ format: 'A5' });

    // Add the style tag for the background image
    await page.addStyleTag({
      content: `
        .title {
          background-size: contain;
          background-repeat: no-repeat;
          height: 100px;
        }
      `,
    });

    
    const content = await ejs.renderFile('views/pdf-receipt2.ejs', {/* receiptEdit data */}); // Adjust the path and provide receiptEdit data if needed

    await page.setContent(content, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf();

    await browser.close();

    // Set response headers for inline PDF display
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=pdf-receipt.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).send('Internal Server Error');
  }
}








  router.post('/edit/:id', async (req, res) => {
    const updateData = {
        itemName: req.body.itemName,
        rentPrice: req.body.rentprice,
        sellingPrice: req.body.sellingprice,
        totalQuantity: req.body.totalquantity,
        alertQuantity: req.body.alertquantity,
        buyingPrice: req.body.buyingprice,
        workingQuantity: req.body.WorkingQuantity,
        comment: req.body.Comment,
        itemCategory: req.body.itemCategory,
        supplier: req.body.supplier,
        useIn: req.body.usein,
    };

    const productId = req.params.id;

    try {
        const updatedProduct = await productModel.findByIdAndUpdate(
            productId,
            updateData,
            { new: true } 
        );

        if (!updatedProduct) {
            return res.status(404).send('Product not found');
        }

      
        res.redirect('/ttproductall');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});



router.post('/saveclient/:id', async (req, res) => {
  const updateData = {
    clientName: req.body.clientName,
    phone: req.body.phoneno,
    address: req.body.Address,
    Proffession: req.body.Proffession,
    comment: req.body.Comment,
    dontknow: req.body.dontknow,
      
  };

  const productId = req.params.id;

  try {
      const updatedProduct = await Client.findByIdAndUpdate(
          productId,
          updateData,
          { new: true } 
      );

      if (!updatedProduct) {
          return res.status(404).send('Product not found');
      }
      
    
      res.redirect( `/editclient/${productId}`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});
router.post('/updatelabour/:id', async (req, res) => {
  const updateData = {
    name: req.body.clientName,
    phoneno: req.body.phno,
    address: req.body.address,
    salary: req.body.salary,
    details: req.body.details, 
  };

  const productId = req.params.id;

  try {
      const updatedProduct = await Labour.findByIdAndUpdate(
          productId,
          updateData,
          { new: true } 
      );

      if (!updatedProduct) {
          return res.status(404).send('Product not found');
      }
      
    
      res.redirect( `/labouraccount`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});
router.post('/editdatereceipt/:id', async (req, res) => {
  const updateData = {
    receiptdate: req.body.receiptDate,     
  };

  const productId = req.params.id;

  try {
      const updatedProduct = await ttreceipt.findByIdAndUpdate(
          productId,
          updateData,
          { new: true } 
      );

      if (!updatedProduct) {
          return res.status(404).send('Product not found');
      }
      
    
      res.redirect( `/ttreceiptall`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});



router.post('/Attachorderno/:id', async (req, res) => {
  const updateData = {
    Attachorderno : req.body.Attachorderno,     
  };

  const productId = req.params.id;

  try {
      const updatedProduct = await ttreceipt.findByIdAndUpdate(
          productId,
          updateData,
          { new: true } 
      );

      if (!updatedProduct) {
          return res.status(404).send('Product not found');
      }
      
    
      res.redirect( `/return/${productId}`);
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/deleteitem/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const productEdit = await productModel.findOneAndDelete({ _id: userId });

    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    res.redirect('/ttproductall');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/deletegeneral/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const productEdit = await generalout.findOneAndDelete({ _id: userId });

    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    res.redirect('/ttreceiptall');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/deletegeneralitem/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const productEdit = await returnitem.findByIdAndDelete(userId);

    if (!productEdit) {
      return res.status(404).send('Product not found or already deleted');
    }

    const a = productEdit.receipt;

    res.redirect(`/return/${a}`);
   
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/deletefarmaitem/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const productEdit = await farmain.findByIdAndDelete(userId);

    if (!productEdit) {
      return res.status(404).send('Product not found or already deleted');
    }

    const a = productEdit.receipt;

    res.redirect(`/return/${a}`);
   
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/deletescaffolding/:id', async (req, res) => {

  const session = await mongoose.startSession();

  try {
    const userId = req.params.id;

    await session.withTransaction(async () => {

      // =====================================
      // FIND SCAFFOLDING RECORD AND RETURNS
      // =====================================

      const productEdit = await scaffoldingout
        .findById(userId)
        .populate('returnscaffolding')
        .session(session);

      if (!productEdit) {
        const error = new Error('Product not found or already deleted');
        error.statusCode = 404;
        throw error;
      }

      const returnedRecords = (
        productEdit.returnscaffolding || []
      ).filter(Boolean);

      // Collect return record IDs
      const returnIds = returnedRecords.map(record =>
        record._id || record
      );

      // =====================================
      // INVENTORY MAPPING
      // =====================================

      const inventoryMapping = [
        {
          name: 'Cuplock 10ft',
          issuedField: 'cuplock10ftno',
          returnedField: 'cuplock10ftno'
        },
        {
          name: 'Cuplock 5ft',
          issuedField: 'cuplock5ftno',
          returnedField: 'cuplock5ftno'
        },
        {
          name: 'Cuplock 8ft',
          issuedField: 'cuplock8ftno',
          returnedField: 'cuplock8ftno'
        },
        {
          name: 'Ledger 5ft',
          issuedField: 'ledger5ftno',
          returnedField: 'ledger5ftno'
        },
        {
          name: 'Ledger 3ft',
          issuedField: 'ledger3ftno',
          returnedField: 'ledger3ftno'
        },
        {
          name: 'ledger 6.5ft',
          issuedField: 'ledger6ft5inchno',
          returnedField: 'currentLedger6ft5in'
        },
        {
          name: 'Pin',
          issuedField: 'pinscaffoldingno',
          returnedField: 'pinscaffoldingno'
        },
        {
          name: 'Wheel',
          issuedField: 'wheelscaffolding',
          returnedField: 'wheelscaffolding'
        },
        {
          name: 'Woodern Chali',
          issuedField: 'woodernchaliscaffolding',
          returnedField: 'woodernchaliscaffolding'
        },
        {
          name: 'Steel Chali',
          issuedField: 'steelchalscaffolding',
          returnedField: 'steelchalscaffolding'
        },

        // NEW ITEMS
        {
          name: 'Base Jack',
          issuedField: 'basejackno',
          returnedField: 'basejackno'
        },
        {
          name: 'Ledger 1.5ft',
          issuedField: 'ledger1_5ftno',
          returnedField: 'ledger1_5ftno'
        }
      ];

      // =====================================
      // RESTORE ONLY OUTSTANDING STOCK
      // =====================================

      for (const item of inventoryMapping) {

        const issuedQuantity =
          Number(productEdit[item.issuedField]) || 0;

        const returnedQuantity = returnedRecords.reduce(
          (total, record) =>
            total + (Number(record[item.returnedField]) || 0),
          0
        );

        if (returnedQuantity > issuedQuantity) {
          throw new Error(
            `Returned quantity exceeds issued quantity for ${item.name}. Please check the return records before deleting.`
          );
        }

        // Already returned stock is in inventory.
        // Restore only the remaining quantity.
        const outstandingQuantity =
          issuedQuantity - returnedQuantity;

        if (outstandingQuantity <= 0) {
          continue;
        }

        const updatedProduct = await productModel.findOneAndUpdate(
          { itemName: item.name },
          {
            $inc: {
              workingQuantity: outstandingQuantity
            }
          },
          {
            new: true,
            session
          }
        );

        if (!updatedProduct) {
          throw new Error(
            `Inventory item not found: ${item.name}`
          );
        }

        console.log(
          `Restored ${outstandingQuantity} units of ${item.name}`
        );
      }

      // =====================================
      // REMOVE RECEIPT REFERENCE
      // =====================================

      await ttreceipt.updateMany(
        {
          scaffoldingitemreceipt: productEdit._id
        },
        {
          $pull: {
            scaffoldingitemreceipt: productEdit._id
          }
        },
        { session }
      );

      // =====================================
      // DELETE ASSOCIATED RETURN RECORDS
      // =====================================

      if (returnIds.length > 0) {

        await scaffoldingin.deleteMany(
          {
            _id: { $in: returnIds }
          },
          { session }
        );

      }

      // =====================================
      // DELETE SCAFFOLDING ISSUE RECORD
      // =====================================

      await scaffoldingout.deleteOne(
        { _id: productEdit._id },
        { session }
      );

    });

    console.log('Scaffolding deleted and inventory restored.');

    res.redirect('/ttreceiptall');

  } catch (error) {

    console.error('Scaffolding deletion error:', error);

    res.status(error.statusCode || 500).send(error.message);

  } finally {

    await session.endSession();

  }

});



router.get('/deletefarma/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    const productEdit = await farmaout.findByIdAndDelete(userId);

    if (!productEdit) {
      return res.status(404).send('Product not found or already deleted');
    }

   

    res.redirect(`/ttreceiptall`);
   
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/deletereceipt/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    const productEdit = await ttreceipt.findOneAndDelete({ _id: receiptId });

    if (!productEdit) {
      return res.status(404).send('Receipt not found');
    }

    // Delete associated money transactions
    const moneyReceiptIds = productEdit.moneyreceipt;
    if (moneyReceiptIds && moneyReceiptIds.length > 0) {
      for (const moneyReceiptId of moneyReceiptIds) {
        await moneyinandout.findOneAndDelete({ _id: moneyReceiptId });
      }
    }

    // Delete associated general transactions
    const generalReceiptIds = productEdit.generalinreceipt;
    if (generalReceiptIds && generalReceiptIds.length > 0) {
      for (const generalReceiptId of generalReceiptIds) {
        await generalout.findOneAndDelete({ _id: generalReceiptId });
      }
    }

    // Delete associated scaffolding transactions
    const scaffoldingReceiptIds = productEdit.scaffoldinginreceipt;
    if (scaffoldingReceiptIds && scaffoldingReceiptIds.length > 0) {
      for (const scaffoldingReceiptId of scaffoldingReceiptIds) {
        await scaffoldingout.findOneAndDelete({ _id: scaffoldingReceiptId });
      }
    }

    // Delete associated farma transactions
    const farmaReceiptIds = productEdit.farmaitemreceipt;
    if (farmaReceiptIds && farmaReceiptIds.length > 0) {
      for (const farmaReceiptId of farmaReceiptIds) {
        await farmaout.findOneAndDelete({ _id: farmaReceiptId });
      }
    }
    
    const additionalChargeIds = productEdit.additionalcharges;
    if (additionalChargeIds && additionalChargeIds.length > 0) {
      for (const additionalChargeId of additionalChargeIds) {
        await additionalcharge.findOneAndDelete({ _id: additionalChargeId });
      }
    }

    res.redirect('/ttreceiptall');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/deletemoney/:productId/:receiptId', async (req, res) => {
  try {
    const productId = req.params.productId;
    const receiptId = req.params.receiptId;
    
    // Find and delete the product by productId
    const productEdit = await moneyinandout.findOneAndDelete({ _id: productId });

    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    // Redirect to /addmoney with the receiptId
    res.redirect(`/addmoney/${receiptId}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/deletemoney/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const productEdit = await moneyinandout.findOneAndDelete({ _id: userId });

    if (!productEdit) 
    {
      return res.status(404).send('Product not found');
    }

    res.redirect('/ttdashboard');

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/Attachorderno/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const productEdit = await ttreceipt.findOne({ _id: userId });

    if (productEdit) {
      res.render('attachordernoedit', { productEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/recipt', async (req, res) => {
  try {
    // Fetch data from MongoDB
    const allproducts = await productModel.find();
    const allclients = await Client.find();


    // Render the EJS template with data
    res.render('receipt', { allproducts, allclients });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
 


router.post('/recipt', async (req, res) => {
  try {
    console.log(req.body);

  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




router.get('/receipt12', (req, res) => {
  // Render the 'receiptfinal1' view
  res.render('receipt12');
});




router.get('/newtransportchallan/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
    .populate('receiptclientname')
    .populate('receiptclientsitename')
    .populate('additionalcharges')
    .populate({
      path: 'scaffoldingitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'returnitem',  // Assuming the model name for returnitem
      }
  })

    .populate({
        path: 'generalitemreceipt',
        populate: {
            path: 'onngoing',
            model: 'returnitem',  // Assuming the model name for returnitem
        }
    })

    .populate('moneyreceipt')
    .populate('generalinreceipt')
    .populate({
      path:'farmaitemreceipt',
      populate:{
        path: 'onngoing',
        model: 'farmain',
      }
    });



    if (receiptEdit) {
      res.render('newtransportchallan', { receiptEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});








router.get('/receipt123', async (req, res) => {
  // Render the 'receiptfinal1' view
  const allproducts = await productModel.find();
  
  res.render('receipt123', { allproducts});
 
});

router.post('/receipt123', async (req, res) => {
  console.log(req.body);
   });


router.get('/receiptgeneralall', (req, res) => {
  res.render('receiptgeneralall');
 }); 


 router.put('/updateComment/:id', async (req, res) => {
  const id = req.params.id; // Correctly extract the 'id' parameter
  const { comment } = req.body; // Destructure 'comment' from the request body

  console.log(comment);

  try {
    const updatedDocument = await ttreceipt.findByIdAndUpdate(id, { comment }, { new: true });

    if (!updatedDocument) {
      // Handle the case where the document with the provided ID is not found
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(updatedDocument);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});




 router.get('/receipt1234', isLoggedIn , async (req, res) => {

  const latestSerialNumber = await ttreceipt.findOne({}, {}, { sort: { 'receiptChallannumber': -1 } });
  let nextSerialNumber = 'TT/0001';
  const transportData = await transport.find();
  if (latestSerialNumber) {
    const currentNumber = parseInt(latestSerialNumber.receiptChallannumber.split('/')[1], 10);
    nextSerialNumber = `TT/${(currentNumber + 1).toString().padStart(4, '0')}`;
}
  const allproducts = await productModel.find();
  console.log(nextSerialNumber);
  res.render('receipt1234', { allproducts,nextSerialNumber,transport: transportData});
 
});
router.get('/quotation', (req, res) => {
  const quotationData = {
    company: {
      name: "TT Construction & Scaffolding Rentals",
      address: "J-324 Adarsh Colony, Faridabad",
      phone: "9315792003",
      email: "loveleen_sb@ar.iitr.ac.in"
    },
    project: "Park Plaza",
    size: "30 ft × 40 ft",
    rent: "₹800 per day",
    minDays: 15,
    lumpsum: "₹50,000",
    terms: [
      "Minimum rental duration: 15 days.",
      "If rented, daily charge is ₹800 per day (lumpsum option not applicable).",
      "Service lift/stair will be used for scaffolding to top floor.",
      "If on daily rental basis, transport will be charged extra.",
      "Lumpsum option includes labour, transport, and erection/removal.",
    "For daily rental, transport charges are ₹1,200 for delivery to site and ₹2,000 for return from site."
    ]
  };

  // Pass quotationData into the EJS file
  res.render('quotationprint', quotationData);
});


router.post('/receipt1234', isLoggedIn, async (req, res) => {
  try
   {
    const  user = await userModel.findOne({username : req.session.passport.user})
    console.log(req.body);
    const receipttt = await ttreceipt.create({ 
  receiptChallannumber: req.body.serialNumber,
  receiptdate: new Date(req.body.datetimereceipt + 'Z'),
  nutboltfarma : req.body.nutboltfarma,
  keyfarma : req.body.keyfarma,
  Attachorderno : req.body.Attachorderno,
  callafter : req.body.callafter,
  transportinfo: req.body.transport ,
  eveningTime : req.body.eveningTime,
  Issuedby : user.fullname,
});

 let clientId;
    const existingClient = await Client.findOne({
      clientName: req.body.Name,
      phone: req.body.Phone,
      address: req.body.Address,
      comment: req.body.comment,
    });

    if (existingClient) 
    {
      clientId = existingClient._id;
    } 
    else {
      const capitalizeFirstLetter = (string) => {
        // Trim the string to remove leading and trailing white spaces
        string = string.trim();
    
        // Remove the last character if it is a space
        if (string.length > 0 && string.charAt(string.length - 1) === ' ') {
            string = string.slice(0, -1);
        }
    
        // Check if the string is empty after trimming and removing the last space
        if (string.length === 0) {
            return string;
        }
    
        // Capitalize the first letter and return the result
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    


    
      
      const newClient = await Client.create({
        clientName: capitalizeFirstLetter(req.body.Name),
        phone: req.body.Phone,
        address: capitalizeFirstLetter(req.body.Address),
        comment: req.body.comment,
        
      });

      clientId = newClient._id;
    }
    const existingClientt = await Client.findOne({ 
         _id:clientId,
    });
    const receiptt = await ttreceipt.findById(receipttt);
   
    await Client.findByIdAndUpdate(clientId, {
      $push: { receiptinit: receipttt._id }
    });



receiptt.receiptclientname = existingClientt.id;  
await receiptt.save();




if (req.body.Namesite || req.body.Phonesite || req.body.Addresssite || req.body.commentsite) {

  const newClientsite = await Clientsite.create({
    clientNamesite: req.body.Namesite,
    phonesite: req.body.Phonesite,
    addresssite: req.body.Addresssite,
    commentsite: req.body.commentsite,
    client: clientId,
  });

  receiptt.receiptclientsitename = newClientsite.id;
  await receiptt.save();
}

const Additionalchargesnames = ensureArray(req.body['Additionalchargesname[]']);
const AdditionalchargesAmounts = ensureArray(req.body['AdditionalchargesAmount[]']);   
console.log(AdditionalchargesAmounts);
console.log("Additional chargesAmounts");
if (Additionalchargesnames && Additionalchargesnames.length > 0 && AdditionalchargesAmounts[0] !== "")  {
  try {
    console.log("Additional chargesAmounts");
    // Process the data
    for (let i = 0; i < Additionalchargesnames.length; i++) {
      const currentAdditionalchargesname = Additionalchargesnames[i];
      const currentAdditionalchargesAmount = AdditionalchargesAmounts[i];

      try {
        const product = await additionalcharge.create({
          additionalchargesName: currentAdditionalchargesname,
          additionalchargesCost: currentAdditionalchargesAmount,
          recieptt: receiptt._id,
        });
        receiptt.additionalcharges.push(product.id); 
        await receiptt.save();
      } catch (error) {
        console.error(`Error saving data for ${currentAdditionalchargesname}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing additional charges:', error);
  }
} else {
  console.log('No additional charges to process.');
}




const items = ensureArray(req.body['item[]']);
const quantities = ensureArray(req.body['quantity[]']);
const datetimes = ensureArray(req.body['datetime[]']);
const rents = ensureArray(req.body['rent[]']);

let generalsentence = ''; 

if(items && quantities)
{

  if (items.length === quantities.length && quantities.length === datetimes.length && datetimes.length === rents.length) 
  {
    for (let i = 0; i < items.length; i++) {

      const itemWithStock = items[i];      
      const itemName = itemWithStock.replace(/\s*\(\-?\d+\sin\sstock\)/i, '');

      const quantity = parseInt(quantities[i]);
let datetimeString;

if (req.body.eveningTime !== 'yes') {
  datetimeString = datetimes[i];
} else {
  datetimeString = req.body.datetimereceipt;
}

const datetime = moment.utc(datetimeString).toDate();


      generalsentence += ` ${itemName} - ${quantity}pcs - Rs${rents[i]} ,`;
      console.log(generalsentence);

      try {
        const product = await generalout.create({
          itemoutname: itemName,
          Quantity: quantity,
          Dateandtime: datetime,
          rent: parseFloat(rents[i]),
        });
        
        const existingClient = await productModel.findOne({
          itemName: itemName,
        });
        
        receiptt.generalitemreceipt.push(product.id);  
        await receiptt.save();
        if (existingClient) {
          existingClient.workingQuantity = existingClient.workingQuantity - quantity;
          await existingClient.save();
        }   
        console.log('done');
        
      } 
      catch (error) 
      {
        console.error(`Error saving data for ${itemName}:`, error);
      }
    }

  } 
  else {
    console.error('Mismatched array lengths in the input data.');
  }
}
else{
  console.log('not done');
}






// =============================================
// GET ALL FORM DATA
// =============================================

const datetimescaffolding = ensureArray(req.body['datetimee[]']);
const lengthscaffolding = ensureArray(req.body['length[]']);
const heightscaffolding = ensureArray(req.body['height[]']);
const breadthscaffolding = ensureArray(req.body['breadthscaffolding[]']);
const quantityscaffolding = ensureArray(req.body['quantityscaffolding[]']);
const multipledayscaffolding = ensureArray(req.body['ratemultipledayscaffolding[]']);
const noofdaysscaffolding = ensureArray(req.body['numberofdaysscaffolding[]']);
const rateafterdaysscaffolding = ensureArray(req.body['Rentafterdaysscaffolding[]']);

const labourupsscaffolding = ensureArray(req.body['Labourup[]']);
const labourdownsscaffolding = ensureArray(req.body['Labourdown[]']);
const transportdownsscaffolding = ensureArray(req.body['Transportdown[]']);
const transportupsscaffolding = ensureArray(req.body['Transportup[]']);

// SCAFFOLDING ITEM QUANTITIES

const cuplock10ftoutscaffolding = ensureArray(req.body['Cuplock10ftscaffolding[]']);
const cuplock5ftoutscaffolding = ensureArray(req.body['Cuplock5ftscaffolding[]']);
const ledger5ftoutscaffolding = ensureArray(req.body['ledger5ftscaffolding[]']);
const ledger3ftoutscaffolding = ensureArray(req.body['ledger3ftscaffolding[]']);
const pinoutscaffolding = ensureArray(req.body['pinscaffolding[]']);
const cuplock8ftoutscaffolding = ensureArray(req.body['Cuplock8ftscaffolding[]']);
const ledger6ft5inchftoutscaffolding = ensureArray(req.body['ledger6.5ftscaffolding[]']);
const wheelscaffolding = ensureArray(req.body['wheelscaffolding[]']);
const Woodernchali = ensureArray(req.body['Woodernchali[]']);
const Steelchali = ensureArray(req.body['Steelchali[]']);

// NEW ITEMS

const basejackoutscaffolding = ensureArray(req.body['Basejackscaffolding[]']);
const ledger1_5ftoutscaffolding = ensureArray(req.body['ledger1.5ftscaffolding[]']);


console.log(datetimescaffolding);
console.log('datetimescaffolding');

let scaffoldingsentence = '';


// =============================================
// INVENTORY DEDUCTION FUNCTION
// =============================================

async function deductScaffoldingStock(itemName, issuedQuantity) {

    const product = await productModel.findOne({
        itemName: itemName
    });

    if (!product) {
        console.warn(`Inventory item not found: ${itemName}`);
        return;
    }

    const quantity = Number(issuedQuantity) || 0;

    product.workingQuantity =
        (Number(product.workingQuantity) || 0) - quantity;

    await product.save();
}


// =============================================
// PROCESS SCAFFOLDING
// =============================================

if (
    lengthscaffolding[0] !== '' &&
    heightscaffolding[0] !== ''
) {

    for (let i = 0; i < lengthscaffolding.length; i++) {

        console.log(datetimescaffolding[0]);

        let datetimeString;

        if (req.body.eveningTime === 'yes') {

            // Set to next day 8:30 AM
            const now = new Date();

            now.setDate(now.getDate() + 1);
            now.setHours(8, 30, 0, 0);

            datetimeString = now.toISOString();

        } else {

            // Use provided datetime
            datetimeString = datetimescaffolding[i] + 'Z';

        }


        // =============================================
        // SAVE SCAFFOLDING OUT RECORD
        // =============================================

        const newscaffolding = await scaffoldingout.create({

            Dateandtimescaffolding: datetimeString,

            lengthoutscaffolding: lengthscaffolding[i],
            heightoutscaffolding: heightscaffolding[i],
            quantityscaffolding: quantityscaffolding[i],
            breadthscaffolding: breadthscaffolding[i],

            rentmultipledayscaffolding: multipledayscaffolding[i],
            numberofdaysscaffolding: noofdaysscaffolding[i],
            rateafterdaysscaffolding: rateafterdaysscaffolding[i],

            // EXISTING ITEMS

            cuplock10ftno: Number(cuplock10ftoutscaffolding[i]) || 0,
            cuplock5ftno: Number(cuplock5ftoutscaffolding[i]) || 0,
            cuplock8ftno: Number(cuplock8ftoutscaffolding[i]) || 0,

            ledger5ftno: Number(ledger5ftoutscaffolding[i]) || 0,
            ledger3ftno: Number(ledger3ftoutscaffolding[i]) || 0,
            ledger6ft5inchno: Number(ledger6ft5inchftoutscaffolding[i]) || 0,

            pinscaffoldingno: Number(pinoutscaffolding[i]) || 0,

            wheelscaffolding: Number(wheelscaffolding[i]) || 0,

            woodernchaliscaffolding: Number(Woodernchali[i]) || 0,
            steelchalscaffolding: Number(Steelchali[i]) || 0,

            // NEW ITEMS

            basejackno: Number(basejackoutscaffolding[i]) || 0,

            ledger1_5ftno: Number(ledger1_5ftoutscaffolding[i]) || 0,

            // LABOUR AND TRANSPORT

            labourfitting: labourupsscaffolding[i],
            labourremoving: labourdownsscaffolding[i],

            transportgoing: transportupsscaffolding[i],
            transportcoming: transportdownsscaffolding[i]

        });


        // =============================================
        // DEDUCT INVENTORY QUANTITIES
        // =============================================

        // Cuplock 10ft
        await deductScaffoldingStock(
            'Cuplock 10ft',
            cuplock10ftoutscaffolding[i]
        );

        // Cuplock 5ft
        await deductScaffoldingStock(
            'Cuplock 5ft',
            cuplock5ftoutscaffolding[i]
        );

        // Cuplock 8ft
        await deductScaffoldingStock(
            'Cuplock 8ft',
            cuplock8ftoutscaffolding[i]
        );

        // Ledger 5ft
        await deductScaffoldingStock(
            'Ledger 5ft',
            ledger5ftoutscaffolding[i]
        );

        // Ledger 3ft
        await deductScaffoldingStock(
            'Ledger 3ft',
            ledger3ftoutscaffolding[i]
        );

        // Ledger 6.5ft
        await deductScaffoldingStock(
            'ledger 6.5ft',
            ledger6ft5inchftoutscaffolding[i]
        );

        // Pin
        await deductScaffoldingStock(
            'Pin',
            pinoutscaffolding[i]
        );

        // Wheel
        await deductScaffoldingStock(
            'Wheel',
            wheelscaffolding[i]
        );

        // Wooden Chali
        await deductScaffoldingStock(
            'Woodern Chali',
            Woodernchali[i]
        );

        // Steel Chali
        await deductScaffoldingStock(
            'Steel Chali',
            Steelchali[i]
        );


        // =============================================
        // NEW INVENTORY DEDUCTIONS
        // =============================================

        // Base Jack
        await deductScaffoldingStock(
            'Base Jack',
            basejackoutscaffolding[i]
        );

        // Ledger 1.5ft
        await deductScaffoldingStock(
            'Ledger 1.5ft',
            ledger1_5ftoutscaffolding[i]
        );


        // =============================================
        // CREATE SCAFFOLDING DESCRIPTION
        // =============================================

        scaffoldingsentence +=
            `Scaffolding ${lengthscaffolding[i]}' X ` +
            `${heightscaffolding[i]}' X ${breadthscaffolding[i]}`;


        const scaffoldingitem = [

            { size: 'Cuplock 10ft', value: cuplock10ftoutscaffolding[i] },
            { size: 'Cuplock 5ft', value: cuplock5ftoutscaffolding[i] },
            { size: 'Cuplock 8ft', value: cuplock8ftoutscaffolding[i] },

            { size: 'Ledger 5ft', value: ledger5ftoutscaffolding[i] },
            { size: 'Ledger 3ft', value: ledger3ftoutscaffolding[i] },
            { size: 'Ledger 6.5ft', value: ledger6ft5inchftoutscaffolding[i] },

            { size: 'Pin', value: pinoutscaffolding[i] },

            // NEW ITEMS

            { size: 'Base Jack', value: basejackoutscaffolding[i] },
            { size: 'Ledger 1.5ft', value: ledger1_5ftoutscaffolding[i] },

            { size: 'Wheel', value: wheelscaffolding[i] },
            { size: 'Woodern Chali', value: Woodernchali[i] },
            { size: 'Steel Chali', value: Steelchali[i] }

        ];


        scaffoldingitem.forEach(item => {

            const itemQuantity = Number(item.value) || 0;

            if (itemQuantity > 0) {

                scaffoldingsentence +=
                    `, ${item.size} - ${itemQuantity}`;

            }

        });


        // =============================================
        // LINK SCAFFOLDING TO RECEIPT
        // =============================================

        receiptt.scaffoldingitemreceipt.push(newscaffolding._id);

        await receiptt.save();


        console.log('Scaffolding saved successfully:', newscaffolding._id);

    }

}



const datetimefarma = ensureArray(req.body['datetimefarma[]']);
const length1farma = ensureArray(req.body['length1[]']);
const length2farma = ensureArray(req.body['length2[]']);
const quantityfarma = ensureArray(req.body['quantityfarma[]']);
const ratefarma = ensureArray(req.body['ratefarma[]']);

console.log(datetimefarma);
const heightfarmaa = ensureArray(req.body['heightfarma[]']);

console.log(heightfarmaa);
const farmaplate9inch = ensureArray(req.body['farmaplate9inch[]']);
const farmaplate12inch = ensureArray(req.body['farmaplate12inch[]']);
const farmaplate15inch = ensureArray(req.body['farmaplate15inch[]']);
const farmaplate18inch = ensureArray(req.body['farmaplate18inch[]']);
const farmaplate21inch = ensureArray(req.body['farmaplate21inch[]']);
const farmaplate24inch = ensureArray(req.body['farmaplate24inch[]']);
const farmaplate27inch = ensureArray(req.body['farmaplate27inch[]']);
console.log(length1farma.length);
console.log(length2farma.length );
console.log(length1farma);
console.log(length2farma);
console.log('farmaplate');

let farmasentence = ''; 
if((length1farma.every(value => typeof value === 'string' && value.trim() !== '') &&
length2farma.every(value => typeof value === 'string' && value.trim() !== '')))
{

  for (let i = 0; i < datetimefarma.length; i++) 
  {
    let datetimeString = datetimefarma[i]; // default from frontend

    if (req.body.eveningTime === 'yes') {
      // If "Next Day" is ticked, use another datetime or adjust
      datetimeString = req.body.datetimereceipt || datetimefarma[i];
    }
    
    const datetimeFormatted = moment.utc(datetimeString).toDate(); // convert to UTC format
    
const newfarmaout = await farmaout.create({

  Dateandtimefarma: datetimeFormatted,
    length1farma: length1farma[i],
    length2farma: length2farma[i],
    heightfarma : heightfarmaa[i],
    plate9inchfarma: farmaplate9inch[i],
    plate12inchfarma:farmaplate12inch[i],
    plate15inchfarma:farmaplate15inch[i],
    plate18inchfarma:farmaplate18inch[i],
    plate21inchfarma:farmaplate21inch[i],
    plate24inchfarma: farmaplate24inch[i],
    plate27inchfarma:farmaplate27inch[i],
    rentpersetfarma:ratefarma[i],
    noofsetsfarma:quantityfarma[i],
  });
  

  farmasentence += `Farma ${length1farma[i]} X ${length2farma[i]} ${heightfarmaa[i]} - ${quantityfarma[i]} - ${ratefarma[i]}`;
  
  const plateSizes = [
    { size: '9 inch', value: farmaplate9inch[i] },
    { size: '12 inch', value: farmaplate12inch[i] },
    { size: '15 inch', value: farmaplate15inch[i] },
    { size: '18 inch', value: farmaplate18inch[i] },
    { size: '21 inch', value: farmaplate21inch[i] },
    { size: '24 inch', value: farmaplate24inch[i] },
    { size: '27 inch', value: farmaplate27inch[i] }
  ];
  
  plateSizes.forEach(plate => {
    if (plate.value && !isNaN(plate.value) && plate.value !== 0) {
      farmasentence += `, ${plate.size} - ${plate.value}`;
    }
  });
  
  console.log(farmasentence);


  receiptt.farmaitemreceipt.push(newfarmaout.id);  
  await receiptt.save();


let heightfinall;


if (heightfarmaa[i] == 'Height 5ft'){
  heightfinall = 3;
}
else if (heightfarmaa[i] == 'Height 6ft'){
  heightfinall = 4;
}
else if (heightfarmaa[i] == 'Height 9ft'){
  heightfinall = 5;
}
else if (heightfarmaa[i] == 'Height 10ft'){
  heightfinall = 6;
}

  const farma9inchquantity = await productModel.findOne({
    itemName: 'Farma plate 9" ',     
    itemCategory : heightfinall,
  });


  farma9inchquantity.workingQuantity = farma9inchquantity.workingQuantity-farmaplate9inch[i];
  await farma9inchquantity.save();

  const farma12inchquantity = await productModel.findOne({
    itemName: 'Farma plate 12"',     
    itemCategory:heightfinall,
  });
  console.log(farma12inchquantity);
  farma12inchquantity.workingQuantity = farma12inchquantity.workingQuantity-farmaplate12inch[i];
  await farma12inchquantity.save();

  const farma15inchquantity = await productModel.findOne({
    itemName: 'Farma plate 15"',     
    itemCategory:heightfinall,
  });
  farma15inchquantity.workingQuantity = farma15inchquantity.workingQuantity-farmaplate15inch[i];
  await farma15inchquantity.save();

  const farma18inchquantity = await productModel.findOne({
    itemName: 'Farma plate 18"',     
    itemCategory:heightfinall,
  });
  farma18inchquantity.workingQuantity = farma18inchquantity.workingQuantity-farmaplate18inch[i];
  await farma18inchquantity.save();

  const farma21inchquantity = await productModel.findOne({
    itemName: 'Farma plate 21"',     
    itemCategory:heightfinall,
  });
  farma21inchquantity.workingQuantity = farma21inchquantity.workingQuantity-farmaplate21inch[i];
  await farma21inchquantity.save();

  const farma24inchquantity = await productModel.findOne({
    itemName: 'Farma plate 24"',     
    itemCategory:heightfinall,
  });
  farma24inchquantity.workingQuantity = farma24inchquantity.workingQuantity-farmaplate24inch[i];
  await farma24inchquantity.save();

  const farma27inchquantity = await productModel.findOne({
    itemName: 'Farma plate 27"',     
    itemCategory:heightfinall,
  });
  farma27inchquantity.workingQuantity = farma27inchquantity.workingQuantity-farmaplate27inch[i];
  await farma27inchquantity.save();
  console.log(i);
  }


  
}
try {
  const advanceAmounts = req.body['AdvanceAmount'] || req.body['AdvanceAmount[]'];
  const modesOfPayment = req.body['modeofpayment'] || req.body['modeofpayment[]'];

  const amounts = Array.isArray(advanceAmounts) ? advanceAmounts : [advanceAmounts];
  const modes = Array.isArray(modesOfPayment) ? modesOfPayment : [modesOfPayment];

  for (let i = 0; i < amounts.length; i++) {
    const amount = amounts[i];
    const mode = modes[i];

    if (!amount || isNaN(amount) || !mode || mode.trim() === '') continue;

    const moneyin = await moneyinandout.create({
  inandout: '1',
  amount: amount,
  Dateandtimeinandout: req.body.datetimereceipt + 'Z',
  modeofpayment: mode,
  comment: 'Receipt advance ' + req.body.serialNumber + ' ' + req.body.Name,
  transactionType: 'Rent',
  receipt: receipttt._id
});

    receiptt.moneyreceipt.push(moneyin.id);
  }

  await receiptt.save();
} catch (err) {
  console.error('💥 Error while saving advance entries:', err);
  return res.status(500).send('Something went wrong while saving advances.');
}



try {
  const datetime = moment.utc().toDate(); 
  const daybookEntry = await Daybook.create({

    daybookinandout: 'New Receipt ' + req.body.serialNumber + ' created for ' + req.body.datetimereceipt +' for '+  req.body.Name  +' '+ req.body.Address +' ' + 'Security ' + req.body.AdvanceAmount  + ' Rs ' +
    items.length  + '  general items '  +' '+ generalsentence  +' '+ farmasentence + ' ' + scaffoldingsentence ,
    Dateandtimedaybook: datetime+ 'Z' ,
    maker: user.username,

  });
  console.log('Daybook entry created:', daybookEntry);
} catch (error) {
  console.error('Error creating daybook entry:', error);
}




res.redirect(`/print/${receiptt.id}`);


}
  catch (error) {
    // Handle errors
    if (error.name === 'ValidationError') {
      // Validation error response
      res.status(400).send('Validation Error: ' + error.message);
    } else {
      // Log the full error for debugging
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  }
});

router.get('/poojaproduct', function(req, res, next){
  res.render('poojaproduct');
});

router.post('/poojaproduct', async function(req, res){
  try {
    console.log(req.body);
     const product = await pooja.create({
      Itemname: req.body.itemName,
        sellingrate: req.body.sellingprice,
        quantity:req.body.totalquantity,        
        Buyingrate : req.body.buyingprice,
        comment : req.body.Comment,
   });   
     res.redirect('/poojaproductall');

  } catch (error) {
     // Handle error, e.g., send an error response
     res.status(500).send('Internal Server Error');
  }
});

router.get('/poojaproductall', async function (req, res) {
  let allproducts = await pooja.find();
  res.render( 'poojaproductall', {allproducts} );
 
});
router.get('/editpooja/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Use the correct field to query for the existing product
    const productEdit = await pooja.findOne({ _id: userId });

    if (productEdit) {
      res.render('poojaproductedit', { productEdit }); // Pass the product information as an object
    } else {
      // Handle the case where the product with the given ID is not found
      res.status(404).send('Product not found');
    }
  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
router.get('/deletepoojaitem/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const productEdit = await pooja.findOneAndDelete({ _id: userId });

    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    res.redirect('/poojaproductall');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.post('/editpoojaitem/:id', async (req, res) => {
  const updateData = {

    Itemname: req.body.itemName,
    sellingrate: req.body.sellingprice,
    quantity:req.body.totalquantity,        
    Buyingrate : req.body.buyingprice, 
    comment : req.body.Comment,  
  };

  const productId = req.params.id;

  try {
      const updatedProduct = await pooja.findByIdAndUpdate(
          productId,
          updateData,
          { new: true } 
      );

      if (!updatedProduct) {
          return res.status(404).send('Product not found');
      }

    
      res.redirect('/poojaproductall');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
});




module.exports = router;
