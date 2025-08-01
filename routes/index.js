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
 

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



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
    if (!isNaN(finalAmount) && !isNaN(datetime.getTime())) {
      const moneyIn = await moneyinandout.create({
        inandout: '1',
        amount: finalAmount,
        Dateandtimeinandout: datetime,
        modeofpayment: 'cash',
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

router.get('/login', function(req, res, next) {
  res.render('login',{error : req.flash('error')});
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
  let { amount, comment, modeofpayment } = req.body;

  // Append (E) to the comment to indicate it has been edited
  if (!comment.endsWith("(E)")) {
    comment += " (E)";
  }

  console.log('Edit money:', amount, comment, modeofpayment);

  try {
    // Update the amount, comment, and modeofpayment fields in the database
    const updatedItem = await moneyinandout.findByIdAndUpdate(
      id, 
      { amount, comment, modeofpayment }, 
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).send({ error: 'Item not found' });
    }

    res.send(updatedItem);
  } catch (err) {
    res.status(500).send(err);
  }
});





router.get('/ttdashboard', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  let daysAgo = parseInt(req.query.daysAgo) || 0; // Default to today if not provided
  
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Set time to start of today

  // Calculate the date range based on `daysAgo`
  const startOfDay = new Date(today);
  startOfDay.setUTCDate(today.getUTCDate() - daysAgo); // Move back in time
  
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1); // End of selected day

  // Get transactions for the selected day
  const receiptEdit = await moneyinandout.find({
    Dateandtimeinandout: { $gte: startOfDay, $lt: endOfDay },
  });

  const alldaybook = await Daybook.find({
    Dateandtimedaybook: { $gte: startOfDay, $lt: endOfDay },
  });

  // Get last 7 days' payments
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(today.getUTCDate() - 7); // 7 days ago from today

  const last7DaysPayments = await moneyinandout.find({
    Dateandtimeinandout: { $gte: sevenDaysAgo, $lt: today },
  });

  res.render('dashboardtt', { receiptEdit, alldaybook, user, last7DaysPayments, daysAgo , moment});
});





router.get('/totalmoneydate', async function(req, res, next){
  
  
  const receiptEdit = await moneyinandout.find({ });
 


  res.render('viewmoneytt', {receiptEdit} );
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
      
      return res.redirect('/ttdashboard');
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












router.get('/ttreceiptall', isLoggedIn, async function (req, res) {
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
      .populate('phone')
      .populate('additionalcharges')
      .populate('farmaitemreceipt');

    // Filter the products based on the condition
    const filteredProducts = allproducts.filter(product => product.final !== 1 && product.dropbox !== 'on');

    // Calculate total non-filtered products
    const totalNonFiltered = allproducts.length - filteredProducts.length;

    res.render('receiptall', { allproducts: filteredProducts, totalNonFiltered });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
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
    const saleRecords = await Sale.find({});

    // ✅ Daybook entry added
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
    
    .populate({
      path: 'farmaitemreceipt',
      populate: {
          path: 'onngoing',
          model: 'farmain',  // Assuming the model name for returnitem
      }
  });



    if (receiptEdit) {
      res.render('print3', { receiptEdit }); // Pass the product information as an object
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
  try {
    console.log(req.body);
    const receiptIdd = req.params.id;
    
    // Ensure all values are arrays (defaulting to empty arrays if not provided)
    const itemName = ensureArray(req.body['itemname[]'] || []);
    const Comment = ensureArray(req.body['Comment[]'] || []);
    const quantity = ensureArray(req.body['quantity[]'] || []);
    const idd = ensureArray(req.body['idd[]'] || []);
    
  // Ensuring that the scaffolding quantities are handled as arrays
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

    
    // Handling the date values
    const datetimeshow = req.body.datetimeshow ? req.body.datetimeshow + 'Z' : null;
    const datetimeactual = req.body.datetimeactual ? req.body.datetimeactual + 'Z' : null;

    // Loop through all entries to create the farmain records
    for (let i = 0; i < idd.length; i++) {
      const currentQuantity = parseInt(quantity[i]) || 0;
      const currentIdd = idd[i] || null;
      const currentComment = Comment[i] || '';
      
    // Ensure the current scaffolding quantities are correctly assigned
const currentCuplock10ft = cuplock10ftQty[i] || 0;
const currentCuplock5ft = cuplock5ftQty[i] || 0;
const currentCuplock8ft = cuplock8ftQty[i] || 0;

const currentLedger5ft = ledger5ftQty[i] || 0;
const currentLedger3ft = ledger3ftQty[i] || 0;
const currentLedger6ft5in = ledger6ft5inQty[i] || 0;

const currentPinScaffolding = pinscaffoldingQty[i] || 0;
const currentWoodenChali = woodenChaliQty[i] || 0;
const currentSteelChali = steelChaliQty[i] || 0;
const currentWheel = wheelQty[i] || 0;


      // Only process if the quantity is greater than 0
      if (currentQuantity > 0) {
        try {
         const returnData = await scaffoldingin.create({
  comment: currentComment,
  Dateandtimescaffoldingreturn: datetimeshow,
  receipt: receiptIdd,
  mtTick: req.body.mtTick,
  onngoing: currentIdd,

  // Scaffolding items (ensure these variables are defined appropriately)
  cuplock10ftno: currentCuplock10ft,
  cuplock5ftno: currentCuplock5ft,
  cuplock8ftno: currentCuplock8ft,
  ledger5ftno: currentLedger5ft,
  ledger3ftno: currentLedger3ft,
  ledger6ft5inchno: currentLedger6ft5inch,
  pinscaffoldingno: currentPinScaffolding,
  woodernchaliscaffolding: currentWoodenChali,
  steelchalscaffolding: currentSteelChali,
  wheelscaffolding: currentWheelScaffolding,

  

  // Dimensions if used
  lengthoutscaffolding: currentLength,
  heightoutscaffolding: currentHeight,
  breadthscaffolding: currentBreadth,
  quantityscaffolding: currentQtyScaffolding
});

          // Update generalinreceipt in ttreceipt
          const receiptEdit = await ttreceipt.findOne({ _id: receiptIdd });
          if (receiptEdit) {
            receiptEdit.scaffoldingReturnReceipts.push(returnData.id);
            await receiptEdit.save();
          }

          // Update onngoing in generalout
          const Addin = await returnscaffolding.findOne({ _id: currentIdd });
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
router.get('/deleteadditionalcharges/:id/', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find and delete the additional charge by ID
    const productEdit = await additionalcharge.findOneAndDelete({ _id: userId });

    // If the additional charge is not found, send a 404 response
    if (!productEdit) {
      return res.status(404).send('Product not found');
    }

    // Redirect to the edit page of the associated receipt
    res.redirect(`/editadditionalcharges/${productEdit.recieptt}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
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
    const productId = req.params.id;
    const { transport, transportdate } = req.body;

    const updatedReceipt = await ttreceipt.findByIdAndUpdate(
      productId,
      { transport, transportdate },
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
    const receiptId = req.params.id;

    // Use the correct field to query for the existing product
    const generalEdit = await todo.findOne({ _id: receiptId });


    

    if (generalEdit) {
      res.render('todochange', { generalEdit }); 
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
  try {
    const receiptId = req.params.id;
    
console.log(req.body);
    const generalEdit = await generalout.findOne({ _id: receiptId });
   

    const updateData = {
      Dateandtimescaffolding: req.body['datetimee[]'],
      lengthoutscaffolding: req.body['length[]'],
      heightoutscaffolding: req.body['height[]'],
      quantityscaffolding: req.body['quantityscaffolding[]'],
      breadthscaffolding : req.body['breadthscaffolding[]'],
      rentmultipledayscaffolding:req.body['ratemultipledayscaffolding[]'],
      numberofdayscaffolding: req.body['numberofdaysscaffolding[]'],
      rateafterdayscaffolding:req.body['Rentafterdaysscaffolding[]'],
      cuplock10ftno:req.body['Cuplock10ftscaffolding[]'],
      cuplock5ftno: req.body['Cuplock5ftscaffolding[]'],
      cuplock8ftno:req.body['Cuplock8ftscaffolding[]'],
      ledger5ftno:req.body['ledger5ftscaffolding[]'],
      ledger3ftno:req.body['ledger3ftscaffolding[]'],
      ledger6ft5inchno:req.body['ledger6.5ftscaffolding[]'],
      pinscaffoldingno:req.body['pinscaffolding[]'],
      labourfitting:req.body['Labourup[]'],
      labourremoving: req.body['labourdownsscaffolding[0]'],
      transportgoing:req.body['Transportup['],
      transportcoming:req.body['Transportdown[]'],
      woodernchaliscaffolding:req.body['Woodernchali[]'],
      steelchalscaffolding:req.body['Steelchali[]'],
      wheelscaffolding: req.body['wheelscaffolding[]'],
     
    };
    console.log('updateData');
console.log(updateData);
    const updatedProduct = await scaffoldingout.findByIdAndUpdate(
      receiptId,
      updateData,
      { new: true }
    );
    console.log(updatedProduct);
   
    res.redirect(`/correctscaffolding/${receiptId}`);
    

  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
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
    const multipledayscaffolding = ensureArray(req.body['ratemultipledayscaffolding[]']);
    const noofdaysscaffolding = ensureArray(req.body['numberofdaysscaffolding[]']);
    const rateafterdaysscaffolding = ensureArray(req.body['Rentafterdaysscaffolding[]']);
    const labourupsscaffolding = ensureArray(req.body['Labourup[]']);
    const labourdownsscaffolding = ensureArray(req.body['Labourdown[]']);
    const transportdownsscaffolding = ensureArray(req.body['Transportdown[]']);
    const transportupsscaffolding = ensureArray(req.body['Transportup[]']);
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
    
    if(lengthscaffolding[0]!='' && heightscaffolding[0]!='' )
    
    {
    
    for (let i = 0; i < lengthscaffolding.length; i++) 
    {
      const newscaffolding = await scaffoldingout.create({
    
        Dateandtimescaffolding: datetimescaffolding[i]+ 'Z',
        lengthoutscaffolding: lengthscaffolding[i],
        heightoutscaffolding: heightscaffolding[i],
        quantityscaffolding: quantityscaffolding[i],
        breadthscaffolding : breadthscaffolding[i],
        rentmultipledayscaffolding:multipledayscaffolding[i],
        numberofdayscaffolding:noofdaysscaffolding[i],
        rateafterdayscaffolding:rateafterdaysscaffolding[i],
        cuplock10ftno:cuplock10ftoutscaffolding[i],
        cuplock5ftno: cuplock5ftoutscaffolding[i],
        cuplock8ftno:cuplock8ftoutscaffolding[i],
        ledger5ftno:ledger5ftoutscaffolding[i],
        ledger3ftno:ledger3ftoutscaffolding[i],
        ledger6ft5inchno:ledger6ft5inchftoutscaffolding[i],
        pinscaffoldingno:pinoutscaffolding[i],
        labourfitting:labourupsscaffolding[i],
        labourremoving: labourdownsscaffolding[i],
        transportgoing:transportupsscaffolding[i],
        transportcoming:transportdownsscaffolding[i],
        woodernchaliscaffolding:Woodernchali[i],
        steelchalscaffolding: Steelchali[i],
        wheelscaffolding:wheelscaffolding[i],
      });
    
      const cuplock10ftquantity = await productModel.findOne({
        itemName: 'Cuplock 10ft',
      });
    cuplock10ftquantity.workingQuantity = cuplock10ftquantity.workingQuantity- cuplock10ftoutscaffolding[i];
    await cuplock10ftquantity.save();
    
    const cuplock5ftquantity = await productModel.findOne({
      itemName: 'Cuplock 5ft',
    });
    cuplock5ftquantity.workingQuantity = cuplock5ftquantity.workingQuantity- cuplock5ftoutscaffolding[i];
    await cuplock5ftquantity.save();
    
    
    const cuplock8ftquantity = await productModel.findOne({
      itemName: 'Cuplock 8ft',
    });
    cuplock8ftquantity.workingQuantity = cuplock8ftquantity.workingQuantity- cuplock8ftoutscaffolding[i];
    await cuplock8ftquantity.save();
    
    const leager5ftquantity = await productModel.findOne({
      itemName: 'Ledger 5ft',
    });
    
    leager5ftquantity.workingQuantity = leager5ftquantity.workingQuantity- ledger5ftoutscaffolding[i];
    await leager5ftquantity.save();
    
    const leager3ftquantity = await productModel.findOne({
      itemName: 'Ledger 3ft',
    });
    leager3ftquantity.workingQuantity = leager3ftquantity.workingQuantity- ledger3ftoutscaffolding[i];
    await leager3ftquantity.save();
    
    const leager6ft5inchquantity = await productModel.findOne({
      itemName: 'ledger 6.5ft',
    });
    leager6ft5inchquantity.workingQuantity = leager6ft5inchquantity.workingQuantity- ledger6ft5inchftoutscaffolding[i];
    await leager6ft5inchquantity.save();
    
    const pinquantity = await productModel.findOne({
      itemName: 'Pin',
    });
    pinquantity.workingQuantity = pinquantity.workingQuantity- pinoutscaffolding[i];
    await pinquantity.save();
    
    const wheelquantity = await productModel.findOne({
      itemName: 'Wheel',
    });
    wheelquantity.workingQuantity = wheelquantity.workingQuantity- wheelscaffolding[i];
    await wheelquantity.save();
    
    
    const chaliwoodenquantity = await productModel.findOne({
      itemName: 'Woodern Chali',
    });
    chaliwoodenquantity.workingQuantity = chaliwoodenquantity.workingQuantity- Woodernchali[i];
    await chaliwoodenquantity.save();
    
    const chalisteelquantity = await productModel.findOne({
      itemName: 'Steel Chali',
    });
    chalisteelquantity.workingQuantity = chalisteelquantity.workingQuantity- Steelchali[i];
    await chalisteelquantity.save();
    
    
    const receiptt = await ttreceipt.findOne({ _id: receiptId }); 
    
    receiptt.scaffoldingitemreceipt.push(newscaffolding.id);  
    await receiptt.save();
    
    
    console.log('done2');

    }

    res.redirect(`/return/${receiptId}`);

  }    
   
  


  
   

    

  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
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
  try {
    const userId = req.params.id;

    const productEdit = await scaffoldingout.findByIdAndDelete(userId);

    if (!productEdit) {
      return res.status(404).send('Product not found or already deleted');
    }

   

    res.redirect(`/ttreceiptall`);
   
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
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
  // Create a new Clientsite document
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
console.log(datetimescaffolding);
console.log('datetimescaffolding');
let scaffoldingsentence = ''; 
if(lengthscaffolding[0]!='' && heightscaffolding[0]!='' )

{

for (let i = 0; i < lengthscaffolding.length; i++) 
{console.log(datetimescaffolding[0]);

  let datetimeString;

if (req.body.eveningTime === 'yes') {
  // Set to next day 8:30 AM in UTC
  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setHours(8, 30, 0, 0);
  datetimeString = now.toISOString();
} else {
  // Use provided datetime
  datetimeString = datetimescaffolding[i] + 'Z'; // assuming it's in ISO format
}
  const newscaffolding = await scaffoldingout.create({

    Dateandtimescaffolding: datetimeString,
    lengthoutscaffolding: lengthscaffolding[i],
    heightoutscaffolding: heightscaffolding[i],
    quantityscaffolding: quantityscaffolding[i],
    breadthscaffolding : breadthscaffolding[i],
    rentmultipledayscaffolding:multipledayscaffolding[i],
    numberofdayscaffolding:noofdaysscaffolding[i],
    rateafterdayscaffolding:rateafterdaysscaffolding[i],
    cuplock10ftno:cuplock10ftoutscaffolding[i],
    cuplock5ftno: cuplock5ftoutscaffolding[i],
    cuplock8ftno:cuplock8ftoutscaffolding[i],
    ledger5ftno:ledger5ftoutscaffolding[i],
    ledger3ftno:ledger3ftoutscaffolding[i],
    ledger6ft5inchno:ledger6ft5inchftoutscaffolding[i],
    pinscaffoldingno:pinoutscaffolding[i],
    labourfitting:labourupsscaffolding[i],
    labourremoving: labourdownsscaffolding[i],
    transportgoing:transportupsscaffolding[i],
    transportcoming:transportdownsscaffolding[i],
    woodernchaliscaffolding:Woodernchali[i],
    steelchalscaffolding: Steelchali[i],
    wheelscaffolding:wheelscaffolding[i],
  });

  const cuplock10ftquantity = await productModel.findOne({
    itemName: 'Cuplock 10ft',
  });
cuplock10ftquantity.workingQuantity = cuplock10ftquantity.workingQuantity- cuplock10ftoutscaffolding[i];
await cuplock10ftquantity.save();

const cuplock5ftquantity = await productModel.findOne({
  itemName: 'Cuplock 5ft',
});
cuplock5ftquantity.workingQuantity = cuplock5ftquantity.workingQuantity- cuplock5ftoutscaffolding[i];
await cuplock5ftquantity.save();


const cuplock8ftquantity = await productModel.findOne({
  itemName: 'Cuplock 8ft',
});
cuplock8ftquantity.workingQuantity = cuplock8ftquantity.workingQuantity- cuplock8ftoutscaffolding[i];
await cuplock8ftquantity.save();

const leager5ftquantity = await productModel.findOne({
  itemName: 'Ledger 5ft',
});

leager5ftquantity.workingQuantity = leager5ftquantity.workingQuantity- ledger5ftoutscaffolding[i];
await leager5ftquantity.save();

const leager3ftquantity = await productModel.findOne({
  itemName: 'Ledger 3ft',
});
leager3ftquantity.workingQuantity = leager3ftquantity.workingQuantity- ledger3ftoutscaffolding[i];
await leager3ftquantity.save();

const leager6ft5inchquantity = await productModel.findOne({
  itemName: 'ledger 6.5ft',
});
leager6ft5inchquantity.workingQuantity = leager6ft5inchquantity.workingQuantity- ledger6ft5inchftoutscaffolding[i];
await leager6ft5inchquantity.save();

const pinquantity = await productModel.findOne({
  itemName: 'Pin',
});
pinquantity.workingQuantity = pinquantity.workingQuantity- pinoutscaffolding[i];
await pinquantity.save();

const wheelquantity = await productModel.findOne({
  itemName: 'Wheel',
});
wheelquantity.workingQuantity = wheelquantity.workingQuantity- wheelscaffolding[i];
await wheelquantity.save();


const chaliwoodenquantity = await productModel.findOne({
  itemName: 'Woodern Chali',
});
chaliwoodenquantity.workingQuantity = chaliwoodenquantity.workingQuantity- Woodernchali[i];
await chaliwoodenquantity.save();

const chalisteelquantity = await productModel.findOne({
  itemName: 'Steel Chali',
});
chalisteelquantity.workingQuantity = chalisteelquantity.workingQuantity- Steelchali[i];
await chalisteelquantity.save();


scaffoldingsentence += `Scaffolding ${lengthscaffolding[i]}' X ${heightscaffolding[i]}' X ${breadthscaffolding}`;

const scaffoldingitem = [
  { size: 'Cuplock 10ft', value: cuplock10ftoutscaffolding[i] },
  { size: 'Cuplock 5ft', value: cuplock5ftoutscaffolding[i] },
  { size: 'Cuplock 8ft', value: cuplock8ftoutscaffolding[i] },
  { size: 'Ledger 5ft', value: ledger5ftoutscaffolding[i] },
  { size: 'Ledger 3ft', value: ledger3ftoutscaffolding[i] },
  { size: 'Ledger 6.5ft', value: ledger6ft5inchftoutscaffolding[i] },
  { size: 'Pin', value: pinoutscaffolding[i] },
  { size: 'Wheel', value: wheelscaffolding[i] },
  { size: 'Woodern Chali', value: Woodernchali[i] },
  { size: 'Steel Chali', value: Steelchali[i] },
];

scaffoldingitem.forEach(item => {
  if (item.value && !isNaN(item.value) && item.value !== 0) {
    scaffoldingsentence += `, ${item.size} - ${item.value}`;
  }
});


  





receiptt.scaffoldingitemreceipt.push(newscaffolding.id);  
await receiptt.save();


console.log('done2');
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
      comment: 'Receipt advance ' + (req.body.serialNumber) + ' ' + (req.body.Name),
       receipt : receipttt._id  ,
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
