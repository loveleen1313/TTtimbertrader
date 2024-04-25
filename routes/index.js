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
const generalout = require('./generalout');
const scaffoldingout = require('./scaffoldingout');
const farmaout = require('./farmaout');
const ttreceipt = require('./reciept');
const moneyinandout = require('./moneyinandout');
const returnitem = require('./returnitem');
const todo = require('./todo');
const scaffoldingin = require('./scaffoldingin');
const additionalcharge = require('./additionalcharges');
const puppeteer = require('puppeteer');
const ejs = require('ejs'); 


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});



router.get('/login', function(req, res, next) {
  res.render('login',{error : req.flash('error')});
});

router.get('/print', (req, res) => {
  res.render('print');
});

router.get('/profile', isLoggedIn , async function(req, res, next){
  const  user = await userModel.findOne({username : req.session.passport.user})
  .populate("posts");
  console.log(user);
   res.render('profile', {user});
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

    res.send('done');
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






router.get('/ttdashboard', async function(req, res, next){
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Set time to the beginning of the day in UTC
  
  const endOfDay = new Date(today);
  endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);
  
  const receiptEdit = await moneyinandout.find({
    Dateandtimeinandout: {
      $gte: today,
      $lt: endOfDay,
    },
    // To filter out records where 'amount' is null
  });
 


  res.render('dashboardtt', {receiptEdit} );
});


router.get('/ttproduct', function(req, res, next){
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

router.post('/login', passport.authenticate("local",{
  successRedirect: '/profile',
  failureRedirect: '/login',
  failureFlash: true,
}), function(req, res){
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
       res.redirect('/');
};


 // Adjust the path based on your project structure


 router.post('/ttproduct', async function(req, res){
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
  
router.get('/ttproductall', async function (req, res) {
  let allproducts = await productModel.find();
  res.render( 'productall', {allproducts} );
 
});


router.get('/ttreceiptall', async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('farmaitemreceipt')

      
      
    res.render('receiptall', { allproducts });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});



router.get('/ttreceiptclearall', async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('farmaitemreceipt')

      
      
    res.render('clearreceiptall', { allproducts });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/ttreceiptflagall', async function (req, res) {
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

router.get('/ttreceipttransportall', async function (req, res) {
  try {
    let allproducts = await ttreceipt.find()
      .populate('receiptclientname')
      .populate('receiptclientsitename')
      .populate('scaffoldingitemreceipt')
      .populate('generalitemreceipt')
      .populate('moneyreceipt')
      .populate('farmaitemreceipt')

      
      
    res.render('transportreceiptall', { allproducts });

  } catch (error) {
    console.error('Error fetching ttreceipt data:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/clientall', async function(req, res) {
  try {
    const allclients = await Client.find({});
    res.render('clientall', { allclients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.render('error', { error });
  }
});

router.get('/parts', async (req, res) => {
  try {
    
    

    res.render('parts');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
 
router.get('/ttrecipt', async (req, res) => {
  try {
    
    const allproducts = await productModel.find();
    const allclients = await Client.find();

    res.render('receiptt', { allproducts, allclients });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/todo', async (req, res) => {
  try {
    
    const alltodo = await todo.find();
   

    res.render('todo', { alltodo});
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/addtodo', async (req, res) => {
  try {
   

    res.render('addtodo');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

router.get('/username/:username', async (req, res) => {
  try {
    const regex = new RegExp(`^${req.params.username}`, 'i');
    const user = await Client.find({ clientName: regex });

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


router.get('/addscaffolding/:id', async (req, res) => {`1e`
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
    .populate('farmaitemreceipt');



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

router.get('/viewrender/:id', async (req, res) => {
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
   

    

  } catch (error) {
    // Handle any potential errors (e.g., database errors)
    console.error(error);
    res.status(500).send('Internal Server Error');
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


router.post('/savetransport/:id', async (req, res) => {
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
    const regex = new RegExp(`^${req.params.itemname}`, 'i');
    const item = await productModel.find({  itemName: regex });

    if (item) {
      res.json(item);
    } else {
      console.log("item not found");
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post('/ttrecipt2', async (req, res) => {
  console.log(req.body);

});

router.post('/moneytransaction/:moneytransaction', async (req, res) => {
  try {
    const datetime = moment.utc(req.body.datetimee).toDate();
    const receiptId = req.params.moneytransaction; // Use correct parameter name
    const moneyin = await moneyinandout.create({
      inandout: req.body.itemCategory,
      amount: req.body.amounttr,
      Dateandtimeinandout: datetime,
      comment: req.body.comment,
    });

    const receiptt = await ttreceipt.findOne({ // Use findOne instead of find
      _id: receiptId,
    });

    receiptt.moneyreceipt.push(moneyin.id);
    await receiptt.save();

    // Use template literal to include receiptId in the URL
    res.redirect(`/addmoney/${receiptId}`);
  } catch (error) {
    // Handle the error appropriately
    console.error('Error creating money transaction:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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

router.get('/receiptfinal', (req, res) => {
  // Render the 'receiptfinal1' view
  res.render('receiptfinal1');
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
          const receiptId = req.params.id;

          const receiptEdit = await ttreceipt.findOne({ _id: receiptId })
          
          
          receiptEdit.generalitemreceipt.push(product.id);  
          await receiptEdit.save();
           
          console.log('done');


          console.log(`Data for ${itemName} saved successfully`);
        } catch (error) {
          console.error(`Error saving data for ${itemName}:`, error);
        }
      }
      res.redirect('/ttreceiptall');

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


 router.get('/navbar', (req, res) => {
  res.render('nav bar/navbar'); // Adjust the path based on your actual folder structure
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
  
      // Use the correct field to query for the existing product
      const productEdit = await ttreceipt.findOne({ _id: userId });
  
      // Update the 'final' field to 1 (assuming 'final' is the correct field)
      if (productEdit) {
        productEdit.final = 1;
  
       
        await productEdit.save();
  
        const moneyin = await moneyinandout.create({
          inandout: req.body.moneydeborcre,
          amount: req.body.Finalamount,
          Dateandtimeinandout : req.body.datetimeclear + 'Z',
          comment:'recipt clear',
        });
        
        productEdit.moneyreceipt.push(moneyin.id);  
        await  productEdit.save();



        res.redirect('/ttreceiptall'); 
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

    res.redirect('/ttproductall');
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


router.get('/deletereceipt/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const productEdit = await ttreceipt.findOneAndDelete({ _id: userId });

    if (!productEdit) 
    {
      return res.status(404).send('Product not found');
    }

    res.redirect('/ttreceiptall');

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

    res.redirect('/ttreceiptall');

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




 router.get('/receipt1234', async (req, res) => {

  const latestSerialNumber = await ttreceipt.findOne({}, {}, { sort: { 'receiptChallannumber': -1 } });
  let nextSerialNumber = 'TT/0001';

  if (latestSerialNumber) {
    const currentNumber = parseInt(latestSerialNumber.receiptChallannumber.split('/')[1], 10);
    nextSerialNumber = `TT/${(currentNumber + 1).toString().padStart(4, '0')}`;
}
  const allproducts = await productModel.find();
  console.log(nextSerialNumber);
  res.render('receipt1234', { allproducts,nextSerialNumber});
 
});



router.post('/receipt1234', async (req, res) => {
  try
   {

    console.log(req.body);
    const receipttt = await ttreceipt.create({ 
  receiptChallannumber: req.body.serialNumber,
  receiptdate: new Date(req.body.datetimereceipt + 'Z'),
  nutboltfarma : req.body.nutboltfarma,
  keyfarma : req.body.keyfarma,
  
  
  
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
    const receiptt = await ttreceipt.findOne({ receiptChallannumber: req.body.serialNumber });   
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

if (Additionalchargesnames) {
  try {
   

    for (let i = 0; i < Additionalchargesnames.length; i++) {
      const currentAdditionalchargesname = Additionalchargesnames[i];
      const currentAdditionalchargesAmount = AdditionalchargesAmounts[i];

      try {
        const product = await additionalcharge.create({
          additionalchargesName: currentAdditionalchargesname,
          additionalchargesCost: currentAdditionalchargesAmount,
          recieptt: receiptt._id ,
        });
        receiptt.additionalcharges.push(product.id); 
        await receiptt.save();

      } 
      catch (error)
       {
      console.error(`Error saving data for ${currentAdditionalchargesname}:`, error);
      }
    }
  } catch (error) {
    console.error('Error processing additional charges:', error);
  }
}



const items = ensureArray(req.body['item[]']);
const quantities = ensureArray(req.body['quantity[]']);
const datetimes = ensureArray(req.body['datetime[]']);
const rents = ensureArray(req.body['rent[]']);



if(items && quantities)
{

  if (items.length === quantities.length && quantities.length === datetimes.length && datetimes.length === rents.length) 
  {
    for (let i = 0; i < items.length; i++) {

      const itemWithStock = items[i];      
      const itemName = itemWithStock.replace(/\s*\(\-?\d+\sin\sstock\)/i, '');

      const quantity = parseInt(quantities[i]);
      const datetimeString = datetimes[i];
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

if(lengthscaffolding[0]!='' && heightscaffolding[0]!='' )

{

for (let i = 0; i < lengthscaffolding.length; i++) 
{console.log(datetimescaffolding[0]);
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

const moneyin = await moneyinandout.create({
  inandout: '1',
  amount: req.body.AdvanceAmount,
  Dateandtimeinandout:req.body.datetimereceipt+ 'Z',
  comment:'recipt advance' + (req.body.serialNumber),
});

receiptt.moneyreceipt.push(moneyin.id);  
await receiptt.save();

res.redirect(`/ttreceiptall`);


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









module.exports = router;
